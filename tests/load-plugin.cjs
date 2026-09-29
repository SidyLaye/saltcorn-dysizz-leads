/* Charge index.js (le fichier livré) avec des doublures de @saltcorn/*, puis vérifie
   les routes, les blocs apportés à dysizz-flow, et la lecture des réglages. */
const Module = require("module");
const orig = Module._load;
Module._load = function (req, ...rest) { if (req.startsWith("@saltcorn/")) return class { constructor(o) { Object.assign(this, o); } }; return orig.call(this, req, ...rest); };
const assert = require("assert");
const plugin = require("../index.js");
assert.strictEqual(plugin.plugin_name, "dysizz-leads");
for (const u of ["/leads", "/leads/liste", "/leads/l/:id", "/leads/envoi", "/leads/absences", "/leads/demandes", "/leads/reglages", "/leads/import"]) assert(plugin.routes.some((r) => r.url === u), "route " + u);
const blocs = plugin.dysizz_flow_blocks();
assert.deepStrictEqual(blocs.map((b) => b.name), ["dzx_leads_conf", "dzx_leads_traiter", "dzx_leads_enregistrer", "dzx_leads_preparer", "dzx_leads_lire", "dzx_leads_bien", "dzx_leads_contact", "dzx_leads_consentement", "dzx_leads_destinataires", "dzx_leads_crm", "dzx_leads_ranger"]);
/* le workflow ld_traitement : chaque étape pointe vers une étape qui existe, chaque bloc dzx_ existe */
const { WF } = require("../src/installer");
const etapes = new Set(WF.steps.map((s) => s.name));
for (const s of WF.steps) {
  if (/^dzx_/.test(s.action_name)) assert(blocs.some((b) => b.name === s.action_name), "bloc " + s.action_name);
  for (const n of String(s.next_step || "").match(/"([a-z_]+)"|^[a-z_]+$/g) || []) assert(etapes.has(n.replace(/"/g, "")), `étape suivante inconnue : ${n} (depuis ${s.name})`);
  if (s.action_name === "SetErrorHandler" && s.configuration.error_handling_step) assert(etapes.has(s.configuration.error_handling_step), "étape d'erreur inconnue");
}
assert(blocs.every((b) => /^dzx_/.test(b.name) && typeof b.run === "function"));
/* toute route qui écrit est en POST (protégée par le jeton CSRF de Saltcorn) */
assert(plugin.routes.filter((r) => /supprimer|save|installer|rejouer|retraiter|decision|etape|tester/.test(r.url)).every((r) => r.method === "post"));
console.log("plugin OK :", plugin.routes.length, "routes,", blocs.length, "blocs pour dysizz-flow");
