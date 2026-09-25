/* Enregistre le résultat du moteur (« dossier ») dans ld_leads, et relit un mail
   pour le retraiter. Utilisé par le workflow (bloc dzx_leads_enregistrer) et les pages. */
"use strict";
const { tables, MAILS } = require("./schema");
const { charger } = require("./conf");
const { flowApi } = require("./core");

const courte = (v, n = 900) => String(v == null ? "" : v).slice(0, n);
const versLigne = (d, mail = {}) => {
  const x = d.extraction || {}, c = x.contact || {}, b = d.bien || null;
  return {
    mail_id: mail.id || null, message_id: courte(mail.message_id, 300), recu_le: mail.date_envoi || mail.recu_le || new Date(), traite_le: new Date(),
    expediteur: courte(mail.expediteur, 300), objet: courte(mail.objet, 400),
    portail: x.portail || "", nature: x.nature || "", statut: d.statut, decision: "",
    contact_nom: courte([c.prenom, c.nom].filter(Boolean).join(" ") || c.nom_complet, 200), contact_email: c.email || c.email_relais || "", contact_tel: c.telephone || "",
    contact_crm: d.contact && d.contact.id ? String(d.contact.id) : "", contact_action: (d.contact && d.contact.action) || "",
    reference: (x.bien && (x.bien.reference || x.bien.id_crm || x.bien.reference_portail)) || "",
    bien_crm: b ? String(b.id) : "", bien_ref_crm: b ? String(b.reference || "") : "", bien_methode: (d.rapprochement && d.rapprochement.methode) || "", bien_confiance: (d.rapprochement && d.rapprochement.confiance) || "",
    agence: d.agence ? d.agence.nom : "", negociateur: d.negociateur ? String(d.negociateur) : "", origine: d.origine ? d.origine.libelle || d.origine.code : "", site: x.site || "",
    destinataires: d.destinataires ? d.destinataires.liste.map((l) => l.email).sort().join(", ") : "",
    motifs: (d.motifs || []).join(" · "), alertes: (d.alertes || []).join(" · "), mode: (d.execution && d.execution.resultats && d.execution.resultats[0] && d.execution.resultats[0].mode) || (d.execution && d.execution.resultats && d.execution.resultats.some((r) => r.fait) ? "reel" : "ombre"),
    actions: (d.actions || []).map((a) => a.op).join(", "), dossier: JSON.stringify({ ...d, actions: (d.actions || []).map((a) => ({ ...a, preuves: a.preuves && a.preuves.map((p) => p.nom) })) }).slice(0, 200000), duree_ms: d.duree_ms || 0,
  };
};

const enregistrer = async (d, mail) => {
  const t = await tables();
  const ligne = versLigne(d, mail);
  const ex = mail && mail.id ? await t.leads.getRow({ mail_id: mail.id }) : null;
  if (ex) { await t.leads.updateRow({ ...ligne, decision: ex.decision || "", ancien_statut: ex.ancien_statut, ancien_bien: ex.ancien_bien, ancien_destinataires: ex.ancien_destinataires }, ex.id); return ex.id; }
  return t.leads.insertRow(ligne);
};

/* Retraite un mail rangé dans ld_mails (mode du client, ou ombre forcé). */
const retraiter = async (mailId, { forcerOmbre = false } = {}) => {
  const api = flowApi();
  if (!api) throw new Error("dysizz-flow 2.4 ou plus récent est nécessaire");
  const Table = require("@saltcorn/data/models/table");
  const tm = Table.findOne({ name: MAILS });
  const mail = tm && (await tm.getRow({ id: +mailId }));
  if (!mail) throw new Error("mail introuvable");
  const { conf, crm } = await charger();
  const mode = forcerOmbre ? "ombre" : crm.mode;
  const client = api.crmDepuisCoffre(crm.type, crm.reglages, crm.prefixe, mode);
  const L = api.leads;
  const d = await L.traiter({ expediteur: mail.expediteur, destinataire: mail.destinataire, objet: mail.objet, texte: mail.corps_texte, html: mail.corps_html, date: mail.date_envoi }, client, conf);
  d.execution = await L.executer(d, client, { mode });
  if (client.notees) d.execution.ecritures_notees = client.notees;
  const id = await enregistrer(d, mail);
  return { id, dossier: d };
};

module.exports = { enregistrer, retraiter, versLigne };
