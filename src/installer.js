/* Installation : tables ld_*, le workflow de traitement (blocs dysizz-flow),
   et l'écouteur de la boîte des leads (dans dysizz-flow). Idempotent. */
"use strict";
const { tables, MAILS } = require("./schema");
const { flowApi } = require("./core");

const ECOUTEUR = "leads";
const WF = {
  name: "ld_traitement", when: "DzfMailRecu", channel: ECOUTEUR, version: 3,
  description: "dysizz-leads v3 : chaque mail reçu par l'écouteur « leads » est traité une seule fois, étape par étape (lecture, bien, contact, consentement, destinataires, CRM selon le mode, enregistrement). Mode ombre par défaut. Aucun mail n'est envoyé.",
  /* next_step explicite : une lecture qui suffit (non-lead, réponse de l'équipe) saute aux écritures */
  steps: [
    { name: "une_fois", action_name: "dzf_idempotence", configuration: { cle: "ld-{{id}}", duree_h: 720 }, next_step: 'deja_traite ? "" : "preparer"' },
    { name: "preparer", action_name: "dzx_leads_preparer", configuration: { id: "{{id}}" }, next_step: "si_erreur" },
    { name: "si_erreur", action_name: "SetErrorHandler", configuration: { error_handling_step: "rendre_le_verrou_erreur" }, next_step: "attendre_son_tour" },
    { name: "attendre_son_tour", action_name: "dzf_verrou", configuration: { action: "prendre", nom: "ld-{{lead.cle}}", duree: 180, attente: 60 }, next_step: "lire" },
    { name: "lire", action_name: "dzx_leads_lire", configuration: { lead: "{{lead}}" }, next_step: 'dossier.fin ? "ecrire_crm" : "bien"' },
    { name: "bien", action_name: "dzx_leads_bien", configuration: {}, next_step: "contact" },
    { name: "contact", action_name: "dzx_leads_contact", configuration: {}, next_step: "consentement" },
    { name: "consentement", action_name: "dzx_leads_consentement", configuration: {}, next_step: "destinataires" },
    { name: "destinataires", action_name: "dzx_leads_destinataires", configuration: {}, next_step: "ecrire_crm" },
    { name: "ecrire_crm", action_name: "dzx_leads_crm", configuration: {}, next_step: "enregistrer" },
    { name: "enregistrer", action_name: "dzx_leads_ranger", configuration: {}, next_step: "rendre_le_verrou" },
    { name: "rendre_le_verrou", action_name: "dzf_verrou", configuration: { action: "libérer", nom: "ld-{{lead.cle}}" }, next_step: "" },
    /* en cas d'erreur : rendre le verrou, puis signaler l'erreur (l'exécution apparaît en échec ;
       la tâche horaire reprend les mails restés sans lead) */
    { name: "rendre_le_verrou_erreur", action_name: "dzf_verrou", configuration: { action: "libérer", nom: "ld-{{lead.cle}}" }, next_step: "plus_de_filet" },
    { name: "plus_de_filet", action_name: "SetErrorHandler", configuration: { error_handling_step: "" }, next_step: "signaler" },
    { name: "signaler", action_name: "dzf_verifier", configuration: { condition: "false", si_faux: "arrêter en erreur", message: "traitement interrompu : {{__error.message}}" }, next_step: "" },
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
  const need = [...new Set(WF.steps.map((s) => s.action_name).filter((a) => a !== "SetErrorHandler"))];
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
  let refaire = reecrire;
  if (!t) { t = await Trigger.create(def); t = Trigger.findOne({ name: WF.name }) || t; refaire = true; log.push(`workflow ${WF.name} créé (${WF.steps.length} étapes)`); }
  else if (reecrire || !(await aJour())) { await Trigger.update(t.id, def); refaire = true; log.push(`workflow ${WF.name} réécrit (${WF.steps.length} étapes)`); }
  else { log.push(`workflow ${WF.name} déjà là (gardé tel quel)`); }
  if (refaire || !(await WS.find({ trigger_id: t.id })).length) {
    await db.deleteWhere("_sc_workflow_steps", { trigger_id: t.id });
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
