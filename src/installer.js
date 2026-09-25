/* Installation : tables ld_*, le workflow de traitement (blocs dysizz-flow),
   et l'écouteur de la boîte des leads (dans dysizz-flow). Idempotent. */
"use strict";
const { tables, MAILS } = require("./schema");
const { flowApi } = require("./core");

const ECOUTEUR = "leads";
const WF = {
  name: "ld_traitement", when: "DzfMailRecu", channel: ECOUTEUR, version: 2,
  description: "dysizz-leads v2 : chaque mail reçu par l'écouteur « leads » est traité une seule fois (dossier prospect × bien, catalogue local, CRM selon le mode). Mode ombre par défaut. Aucun mail n'est envoyé.",
  steps: [
    { name: "une_fois", action_name: "dzf_idempotence", configuration: { cle: "ld-{{id}}", duree_h: 720 } },
    { name: "traiter", action_name: "dzx_leads_traiter", configuration: { id: "{{id}}" } },
  ],
};
/* Le workflow installé est-il la version actuelle ? (sinon « Installer / réparer » le réécrit) */
const aJour = async () => {
  const Trigger = require("@saltcorn/data/models/trigger");
  const t = Trigger.findOne({ name: WF.name });
  return !!(t && String(t.description || "").startsWith("dysizz-leads v" + WF.version));
};

const manque = () => {
  const st = require("@saltcorn/data/db/state").getState();
  const need = ["dzf_idempotence", "dzx_leads_traiter"];
  return need.filter((a) => !st.actions || !st.actions[a]);
};

const installer = async ({ reecrire = false } = {}) => {
  const log = [];
  await tables(); log.push("tables ld_* prêtes");
  const api = flowApi();
  if (!api) throw new Error("dysizz-flow 2.4 (ou plus récent) doit être installé");
  await api.ecouteurs.tableDest(MAILS); log.push(`table ${MAILS} prête (mails reçus)`);
  const m = manque();
  if (m.length) throw new Error("blocs manquants : " + m.join(", ") + " (mets à jour dysizz-flow puis recharge)");
  const Trigger = require("@saltcorn/data/models/trigger"), WS = require("@saltcorn/data/models/workflow_step"), db = require("@saltcorn/data/db");
  let t = Trigger.findOne({ name: WF.name });
  const def = { name: WF.name, description: WF.description, action: "Workflow", when_trigger: WF.when, channel: WF.channel, configuration: {}, min_role: 1 };
  if (!t) { t = await Trigger.create(def); t = Trigger.findOne({ name: WF.name }) || t; log.push("workflow ld_traitement créé"); }
  else if (reecrire || !(await aJour())) { await Trigger.update(t.id, def); log.push("workflow ld_traitement réécrit"); }
  else { log.push("workflow ld_traitement déjà là (gardé tel quel)"); }
  if (reecrire || !(await WS.find({ trigger_id: t.id })).length || !(await WS.find({ trigger_id: t.id, action_name: "dzx_leads_traiter" })).length) {
    await db.deleteWhere("_sc_workflow_steps", { trigger_id: t.id });
    WF.steps.forEach((s, i) => { s.next_step = WF.steps[i + 1] ? WF.steps[i + 1].name : ""; });
    for (let i = 0; i < WF.steps.length; i++) { const s = WF.steps[i]; await WS.create({ trigger_id: t.id, name: s.name, action_name: s.action_name, configuration: s.configuration, next_step: s.next_step, only_if: "", initial_step: i === 0 }); }
  }
  try { await require("@saltcorn/data/db/state").getState().refresh_triggers(true); } catch (e) { /* rien */ }
  return log;
};

/* Écouteur de la boîte des leads (table dzf_ecouteurs de dysizz-flow). */
const regler_ecouteur = async ({ serveur, port, utilisateur, secret, actif }) => {
  const api = flowApi();
  const Table = require("@saltcorn/data/models/table");
  const E = Table.findOne({ name: "dzf_ecouteurs" });
  if (!E) throw new Error("dysizz-flow n'a pas encore créé ses tables : ouvre une fois /dysizz-flow/ecouteurs");
  const row = { nom: ECOUTEUR, serveur, port: +port || 993, utilisateur, secret: secret || "LEADS_MAIL_MDP", dossier: "INBOX", table_dest: MAILS, marquer_lu: false, actif: !!actif };
  const ex = await E.getRow({ nom: ECOUTEUR });
  if (ex) await E.updateRow(row, ex.id); else await E.insertRow({ ...row, dernier_uid: 0, recus: 0 });
  await api.ecouteurs.demarrerTous();
  return row;
};
const etat_ecouteur = async () => {
  const Table = require("@saltcorn/data/models/table");
  const E = Table.findOne({ name: "dzf_ecouteurs" });
  return E ? E.getRow({ nom: ECOUTEUR }) : null;
};

module.exports = { installer, regler_ecouteur, etat_ecouteur, ECOUTEUR, WF, manque, aJour };
