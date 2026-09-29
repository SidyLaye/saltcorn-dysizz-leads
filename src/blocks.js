/* Blocs apportés à dysizz-flow (préfixe dzx_) : ils relient le moteur leads aux tables de la plateforme. */
"use strict";
const { charger } = require("./conf");
const { enregistrer, traiterMail } = require("./dossier");
const E = require("./etapes");
const P_DOSSIER = { name: "dossier", label: "Dossier (étape précédente)", type: "json", default: "{{dossier}}" };
/* une étape du traitement : lit {{dossier}}, rend le dossier complété (rangé dans « dossier ») */
const etape = (name, label, icon, description, fn, timeout = 60) => ({ name, label, category: "Leads immobiliers", icon, output: "dossier", timeout, description, params: [P_DOSSIER], run: async (p) => fn(p.dossier) });

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
  /* ── le traitement en étapes visibles (workflow ld_traitement v3) ── */
  {
    name: "dzx_leads_preparer", label: "Leads : préparer le mail reçu", category: "Leads immobiliers", icon: "fas fa-inbox", output: "lead",
    description: "Prend le mail reçu (ld_mails), le mode du client (ombre ou réel) et la personne qui écrit : deux mails d'une même personne sont traités l'un après l'autre (verrou).",
    params: [{ name: "id", label: "Id du mail (ld_mails)", default: "{{id}}", required: true }],
    run: async (p) => E.preparer(+p.id),
  },
  {
    name: "dzx_leads_lire", label: "Leads : lire le mail", category: "Leads immobiliers", icon: "fas fa-envelope-open-text", output: "dossier", timeout: 120,
    description: "Lit le mail en trois étages : règles des portails connus, gabarits appris tout seuls, IA en dernier recours (si réglée). Portail, nature (lead, relance, non-lead…), prospect, bien cité, message. Rattache le mail à la conversation du prospect. Un non-lead ou une réponse de l'équipe s'arrête ici.",
    params: [{ name: "lead", label: "Mail préparé", type: "json", default: "{{lead}}" }],
    run: async (p) => E.lire(p.lead),
  },
  etape("dzx_leads_bien", "Leads : retrouver le bien", "fas fa-search-location", "Catalogue local, puis CRM : identifiant, référence complète, référence moins le dernier caractère, segments, puis critères. Chaque bien trouvé est comparé au mail ; contradiction = rejet. Rattache le dossier existant du prospect pour ce bien.", E.bien, 90),
  etape("dzx_leads_contact", "Leads : agence, négociateur et contact", "fas fa-address-card", "Agence (bien, compte du portail, boîte qui a reçu, agence citée) ; négociateur du bien ; contact du CRM (e-mail d'abord, puis le plus récent ; on complète, on n'écrase pas) ; origine ; plan d'écriture dans le CRM (contact, suivi du bien, projet de recherche avec toute la conversation).", E.contact, 90),
  etape("dzx_leads_consentement", "Leads : consentement anti-démarchage", "fas fa-file-signature", "Ajoute au plan le consentement du prospect : date de la demande, motif « Demande de contact via <portail> du <date> » (réglable), et le mail d'origine (.eml) en preuve. Une seule fois par contact.", E.consentement),
  etape("dzx_leads_destinataires", "Leads : qui reçoit ?", "fas fa-user-check", "Négociateur du bien, assistant(e), règles d'envoi, congés, mi-temps, siège et copies. Une relance d'une conversation déjà suivie ne va qu'au négociateur (réglable). Donne aussi le statut : prêt, à vérifier, à trier.", E.destinataires),
  etape("dzx_leads_crm", "Leads : écrire dans le CRM", "fas fa-cloud-upload-alt", "Exécute le plan (contact, suivi du bien, projet de recherche, consentement) selon le mode : en ombre, rien n'est écrit, tout est noté. Chaque écriture est relue ; rejouer ne crée pas de doublon.", E.ecrireCrm, 120),
  {
    name: "dzx_leads_ranger", label: "Leads : enregistrer le lead et la conversation", category: "Leads immobiliers", icon: "fas fa-save", output: "resultat",
    description: "Range le lead (ld_leads, visible dans les écrans), le dossier du prospect (ld_dossiers) et la conversation (ld_evenements). Retraiter un mail met à jour la même ligne.",
    params: [P_DOSSIER],
    run: async (p) => E.ranger(p.dossier),
  },
];
