/* Blocs apportés à dysizz-flow (préfixe dzx_) : ils relient le moteur leads aux tables de la plateforme. */
"use strict";
const { charger } = require("./conf");
const { enregistrer, traiterMail } = require("./dossier");

module.exports = [
  {
    name: "dzx_leads_conf", label: "Leads : charger la configuration", category: "Leads immobiliers", icon: "fas fa-sliders-h", output: "leads_conf",
    description: "Lit agences, négociateurs, assistant(e)s, règles d'envoi, absences, origines, sites et réglages du client. Donne leads_conf (moteur) et leads_crm (type, réglages, mode).",
    params: [],
    run: async () => { const { conf, crm, reglages } = await charger(); return { __merge: { leads_conf: conf, leads_crm: crm, leads_reglages: { envoi_mails: !!reglages.envoi_mails, mode: crm.mode } } }; },
  },
  {
    name: "dzx_leads_traiter", label: "Leads : traiter un mail reçu", category: "Leads immobiliers", icon: "fas fa-bullseye", output: "lead",
    description: "Traite un mail de ld_mails de bout en bout : lecture sans IA, fil de conversation (dossier prospect × bien), bien (catalogue local), contact, plan CRM exécuté selon le mode (ombre par défaut), destinataires. Deux mails du même prospect ne sont jamais traités en même temps.",
    params: [{ name: "id", label: "Id du mail (ld_mails)", type: "text", default: "{{id}}", required: true }],
    run: async (p) => { const r = await traiterMail(+p.id); return { id: r.id, dossier_id: r.dossier_id, statut: r.statut }; },
  },
  {
    name: "dzx_leads_enregistrer", label: "Leads : enregistrer le dossier", category: "Leads immobiliers", icon: "fas fa-save", output: "lead_id",
    description: "Range le résultat du traitement dans ld_leads (un lead par mail, mis à jour si le mail est retraité).",
    params: [{ name: "dossier", label: "Dossier", type: "json", default: "{{dossier}}" }, { name: "mail", label: "Mail", type: "json", default: "{{mail}}" }],
    run: async (p) => enregistrer(typeof p.dossier === "string" ? JSON.parse(p.dossier) : p.dossier, typeof p.mail === "string" ? JSON.parse(p.mail) : p.mail),
  },
];
