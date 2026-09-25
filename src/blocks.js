/* Blocs apportés à dysizz-flow (préfixe dzx_) : ils relient le moteur leads aux tables de la plateforme. */
"use strict";
const { charger } = require("./conf");
const { enregistrer } = require("./dossier");

module.exports = [
  {
    name: "dzx_leads_conf", label: "Leads : charger la configuration", category: "Leads immobiliers", icon: "fas fa-sliders-h", output: "leads_conf",
    description: "Lit agences, négociateurs, assistant(e)s, règles d'envoi, absences, origines, sites et réglages du client. Donne leads_conf (moteur) et leads_crm (type, réglages, mode).",
    params: [],
    run: async () => { const { conf, crm, reglages } = await charger(); return { __merge: { leads_conf: conf, leads_crm: crm, leads_reglages: { envoi_mails: !!reglages.envoi_mails, mode: crm.mode } } }; },
  },
  {
    name: "dzx_leads_enregistrer", label: "Leads : enregistrer le dossier", category: "Leads immobiliers", icon: "fas fa-save", output: "lead_id",
    description: "Range le résultat du traitement dans ld_leads (un lead par mail, mis à jour si le mail est retraité).",
    params: [{ name: "dossier", label: "Dossier", type: "json", default: "{{dossier}}" }, { name: "mail", label: "Mail", type: "json", default: "{{mail}}" }],
    run: async (p) => enregistrer(typeof p.dossier === "string" ? JSON.parse(p.dossier) : p.dossier, typeof p.mail === "string" ? JSON.parse(p.mail) : p.mail),
  },
];
