/* Petites fonctions pures : lecture des sites, versLigne. */
const Module = require("module");
const orig = Module._load;
Module._load = function (req, ...rest) { if (req.startsWith("@saltcorn/")) return class {}; return orig.call(this, req, ...rest); };
const assert = require("assert");
const { sitesLire } = require("../src/pages/reglages");
const { versLigne } = require("../src/dossier");
assert.deepStrictEqual(sitesLire("www.Selectionhabitat.com | SELECTION HABITAT / SH | selectionhabitat_com\n\nagence-exemple.fr | AGENCE EXEMPLE"), [
  { domaine: "selectionhabitat.com", noms: ["SELECTION HABITAT", "SH"], origine: "selectionhabitat_com", libelle: "SELECTION HABITAT" },
  { domaine: "agence-exemple.fr", noms: ["AGENCE EXEMPLE"], origine: "agence_exemple_fr", libelle: "AGENCE EXEMPLE" },
]);
assert.strictEqual(
  sitesLire("selectionhabitat.com | SELECTION HABITAT / SH | selectionhabitat_com | Sélection Habitat")[0].libelle,
  "Sélection Habitat"
);
const l = versLigne({ statut: "pret", extraction: { portail: "leboncoin", nature: "lead", contact: { prenom: "Paul", nom: "Martin", email_relais: "x@messagerie.leboncoin.fr" }, bien: { reference: "30123" } }, bien: { id: 99, reference: "30123" }, rapprochement: { methode: "reference_complete", confiance: "haute" }, destinataires: { liste: [{ email: "a@b.fr" }, { email: "siege@b.fr" }] }, actions: [{ op: "creerContact" }, { op: "ajouterConsentement", preuves: [{ nom: "demande.eml", base64: "QQ==" }] }], execution: { resultats: [{ op: "creerContact", fait: false, mode: "ombre" }] } }, { id: 7, objet: "Nouveau message" });
assert.strictEqual(l.contact_nom, "Paul Martin"); assert.strictEqual(l.contact_email, "x@messagerie.leboncoin.fr"); assert.strictEqual(l.bien_crm, "99");
assert.strictEqual(l.destinataires, "a@b.fr, siege@b.fr"); assert.strictEqual(l.mode, "ombre"); assert.strictEqual(l.mail_id, 7);
assert(!/QQ==/.test(l.dossier), "la preuve (base64) n'est pas recopiée dans ld_leads");
console.log("unités OK");
