/* =====================================================================
   dysizz-leads — plateforme de leads immobiliers pour Saltcorn.
   Le moteur (lecture des mails, bien, contact, routage, CRM) est dans
   dysizz-flow ; ici : les tables, les écrans, le workflow et deux blocs
   qui relient le moteur aux tables. Un client = un tenant Saltcorn.
   index.js est GÉNÉRÉ depuis src/ par tools/build.mjs.
   ===================================================================== */
"use strict";
const { PLUGIN, VERSION, peutVoir } = require("./core");
const { CSS } = require("./ui");
const L = require("./pages/leads");
const E = require("./pages/equipe");
const D = require("./pages/demandes");
const R = require("./pages/reglages");
const DO = require("./pages/dossiers");
const CH = require("./pages/chaine");

const asset = (req, res) => {
  if (req.params.file !== "ld.css") return res.status(404).send("");
  res.setHeader("Content-Type", "text/css; charset=utf-8");
  res.setHeader("Cache-Control", req.params.ver === VERSION ? "public, max-age=31536000, immutable" : "public, max-age=300");
  res.end(CSS);
};
const garde = (fn) => async (req, res) => { try { await fn(req, res); } catch (e) { res.status(500).send(`<p>Erreur : ${String(e.message).replace(/[<>&]/g, "")}</p>`); } };

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: PLUGIN,
  dysizz_flow_blocks: () => require("./blocks"),
  dysizz_hub: async (req) => (peutVoir(req) ? [{ group: "Mes applis", label: "Leads", sub: "leads immobiliers : portails, biens, envoi", url: "/leads", icon: "fas fa-bullseye", color: "#2457d6", size: "m", min_role: 40 }] : []),
  onLoad: async () => {
    try { await require("./schema").tables(); } catch (e) { /* 1er démarrage : dysizz-flow peut ne pas être prêt */ }
    try { require("./taches").planifier(); } catch (e) { /* rien */ }
    /* nos blocs (dzx_leads_*) dans dysizz-flow, quel que soit l'ordre de chargement des plugins */
    try { const api = require("./core").flowApi(); if (api && api.enregistrerBlocsExternes) api.enregistrerBlocsExternes(); } catch (e) { /* rien */ }
  },
  routes: [
    { url: "/leads", method: "get", callback: garde(L.tableau) },
    { url: "/leads/liste", method: "get", callback: garde(L.liste) },
    { url: "/leads/l/:id", method: "get", callback: garde(L.fiche) },
    { url: "/leads/l/:id/retraiter", method: "post", callback: garde(L.retraiterPost) },
    { url: "/leads/l/:id/decision", method: "post", callback: garde(L.decisionPost) },
    { url: "/leads/dossiers", method: "get", callback: garde(DO.liste) },
    { url: "/leads/dossier/:id", method: "get", callback: garde(DO.fiche) },
    { url: "/leads/chaine", method: "get", callback: garde(CH.page) },
    { url: "/leads/chaine", method: "post", callback: garde(CH.enregistrer) },
    { url: "/leads/chaine/webhook", method: "post", callback: garde(CH.webhookCle) },
    { url: "/leads/portails", method: "post", callback: garde(CH.portailAjouter) },
    { url: "/leads/portails/:id/supprimer", method: "post", callback: garde(CH.portailRetirer) },
    { url: "/leads/catalogue", method: "post", callback: garde(CH.catalogue) },
    /* webhook du CRM : appelé de l'extérieur (clé dans X-Api-Key), donc sans jeton CSRF */
    { url: "/leads/crochet/crm", method: "post", noCsrf: true, callback: CH.crochet },
    { url: "/leads/envoi", method: "get", callback: garde(E.envoi) },
    { url: "/leads/envoi/regle", method: "post", callback: garde(E.regleSave) },
    { url: "/leads/envoi/regle/:id/supprimer", method: "post", callback: garde(E.regleSuppr) },
    { url: "/leads/personne/:id", method: "get", callback: garde(E.personne) },
    { url: "/leads/personne", method: "post", callback: garde(E.personneSave) },
    { url: "/leads/absences", method: "get", callback: garde(E.absences) },
    { url: "/leads/absences", method: "post", callback: garde(E.absenceSave) },
    { url: "/leads/absences/:id/supprimer", method: "post", callback: garde(E.absenceSuppr) },
    { url: "/leads/demandes", method: "get", callback: garde(D.liste) },
    { url: "/leads/demandes", method: "post", callback: garde(D.creer) },
    { url: "/leads/demandes/:id", method: "get", callback: garde(D.fiche) },
    { url: "/leads/demandes/:id/etape", method: "post", callback: garde(D.etape) },
    { url: "/leads/reglages", method: "get", callback: garde(R.page) },
    { url: "/leads/reglages", method: "post", callback: garde(R.enregistrer) },
    { url: "/leads/reglages/tester", method: "post", callback: garde(R.tester) },
    { url: "/leads/reglages/installer", method: "post", callback: garde(R.installerPost) },
    { url: "/leads/import", method: "get", callback: garde(R.importPage) },
    { url: "/leads/import", method: "post", callback: garde(R.importPost) },
    { url: "/leads/import/rejouer", method: "post", callback: garde(R.rejouer) },
    { url: "/dysizz-leads/a/:ver/:file", method: "get", callback: asset },
  ],
};
