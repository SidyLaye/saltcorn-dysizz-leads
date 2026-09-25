/* Réglages du client (CRM, mode, boîte écoutée, consentement, sites) et import des référentiels. */
"use strict";
const { esc, isAdmin, hidden, go, flowApi } = require("../core");
const { tables, MAILS } = require("../schema");
const { reglages: lireReglages, json, liste } = require("../conf");
const { installer, regler_ecouteur, etat_ecouteur, manque } = require("../installer");
const { retraiter } = require("../dossier");
const U = require("../ui");

const refuse = (res) => res.status(403).send("Réservé aux administrateurs");
const sitesTexte = (s) => (json(s, []) || []).map((x) => `${x.domaine} | ${(x.noms || []).join(" / ")} | ${x.origine || ""}`).join("\n");
const sitesLire = (t) => String(t || "").split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[0]).map(([domaine, noms, origine]) => ({ domaine: domaine.toLowerCase().replace(/^www\./, ""), noms: String(noms || "").split("/").map((x) => x.trim()).filter(Boolean), origine: origine || domaine.replace(/[.-]/g, "_") }));

const page = async (req, res) => {
  if (!isAdmin(req)) return refuse(res);
  const t = await tables();
  const R = await lireReglages();
  const C = json(R.crm_reglages, {});
  const e = await etat_ecouteur().catch(() => null);
  const siege = await t.siege.getRows({});
  const api = flowApi();
  const pre = R.prefixe_secrets || "LEADS_CRM";
  const a = async (n) => (api && (await api.hasSecret(n)) ? U.pill("rangé", "ok") : U.pill("absent", "warn"));
  const m = manque();
  const html = `${m.length ? `<div class="ld-flash ko">Blocs manquants : ${esc(m.join(", "))}. Mets à jour dysizz-flow.</div>` : ""}
<form method="post" action="/leads/reglages">${hidden(req)}
${U.carte("CRM", `<div class="ld-form">
${U.champ("CRM du client", U.select("crm", [["immofacile", "Immofacile (API V2)"], ["salesforce", "Salesforce"]], R.crm))}
${U.champ("Immofacile · site_id", U.input("if_site_id", C.site_id || ""))}${U.champ("Immofacile · adresse de l'API", U.input("if_base", C.base || "https://v2.immo-facile.com/api"))}
${U.champ(`Immofacile · identifiants (Basic) ${await a(pre + "_BASIC")}`, U.input("s_basic", "", { type: "password", placeholder: "laisser vide pour garder" }), "rangé chiffré dans le coffre, jamais réaffiché")}
${U.champ("Immofacile · groupe « Demandeur » (id)", U.input("if_groupe", C.groupe_demandeur || ""))}
${U.champ("Immofacile · type d'action pour le message du prospect (id)", U.input("if_action", C.action_lead || ""), "facultatif : le message est noté dans l'historique du contact (GET /actions/types)")}
${U.champ("Salesforce · domaine", U.input("sf_domaine", C.domaine || "", { placeholder: "https://monentreprise.my.salesforce.com" }))}${U.champ("Salesforce · objet contact", U.select("sf_objet", ["Lead", "Contact"], (C.contact || {}).objet || "Lead"))}
${U.champ(`Salesforce · client_id ${await a(pre + "_CLIENT_ID")}`, U.input("s_client_id", "", { type: "password" }))}${U.champ(`Salesforce · client_secret ${await a(pre + "_CLIENT_SECRET")}`, U.input("s_client_secret", "", { type: "password" }))}
${U.champ(`Salesforce · refresh_token (facultatif) ${await a(pre + "_REFRESH_TOKEN")}`, U.input("s_refresh_token", "", { type: "password" }))}
${U.champ("Réglages avancés (JSON)", U.zone("crm_avance", JSON.stringify(Object.fromEntries(Object.entries(C).filter(([k]) => !["site_id", "base", "groupe_demandeur", "action_lead", "domaine"].includes(k))), null, 1), 4), "ex. correspondance des champs Salesforce, noms des champs du consentement")}
</div>`)}
${U.carte("Mode et envoi", `<div class="ld-form">
${U.champ("Mode", U.select("mode", [["ombre", "OMBRE — le CRM est seulement lu, les écritures sont notées"], ["reel", "RÉEL — crée / complète les contacts, lie les biens, pose le consentement"]], R.mode))}
${U.champ("Pour passer en réel, tape REEL", U.input("confirmer", "", { placeholder: "REEL" }))}
${U.champ("", U.coche("envoi_mails", !!R.envoi_mails, "Envoyer les mails aux négociateurs") + '<small class="ld-mute">Phase 1 : l\'envoi n\'est pas branché dans le workflow (le service en production continue d\'envoyer).</small>')}
${U.champ("", U.coche("utiliser_relais", R.utiliser_relais !== false, "Utiliser l'adresse relais du portail quand le prospect n'a pas donné d'e-mail"))}
</div>`)}
${U.carte("Consentement anti-démarchage", `<div class="ld-form">${U.champ("", U.coche("consentement_actif", !!R.consentement_actif, "Enregistrer le consentement sur la fiche client à chaque lead de portail"))}
${U.champ("Libellé", U.input("consentement_libelle", R.consentement_libelle || ""), "{portail} et {date} sont remplacés. Le mail d'origine est joint en preuve (.eml). À valider par le client.")}</div>`)}
${U.carte("Boîte des leads (écoute en temps réel)", `<div class="ld-form">
${U.champ("Serveur IMAP", U.input("m_serveur", e ? e.serveur : "", { placeholder: "ssl0.ovh.net, zimbra…" }))}${U.champ("Port", U.input("m_port", e ? e.port : 993))}
${U.champ("Identifiant", U.input("m_utilisateur", e ? e.utilisateur : ""))}${U.champ(`Mot de passe ${await a("LEADS_MAIL_MDP")}`, U.input("s_mail", "", { type: "password", placeholder: "laisser vide pour garder" }))}
${U.champ("", U.coche("m_actif", e ? e.actif : false, "Écouter cette boîte (lecture seule : rien n'est marqué lu ni déplacé)"))}</div>
${e ? `<p class="ld-mute" style="margin:8px 0 0">État : ${esc(e.etat || "—")} · ${+e.recus || 0} mail(s) reçu(s)${e.erreur ? " · " + esc(e.erreur) : ""}</p>` : ""}`)}
${U.carte("Reconnaissance", `<div class="ld-form">
${U.champ("Domaines de l'agence", U.zone("domaines_agence", liste(R.domaines_agence).join("\n"), 4), "un par ligne : les mails venant de ces domaines sont internes (transferts dépliés)")}
${U.champ("Sites d'agence (leads « AC3 »)", U.zone("sites", sitesTexte(R.sites), 5, { placeholder: "selectionhabitat.com | SELECTION HABITAT | selectionhabitat_com" }), "domaine | noms affichés (séparés par /) | code de l'origine")}
${U.champ("Objets des campagnes (réponses à trier)", U.zone("objets_campagnes", R.objets_campagnes || "", 3))}
${U.champ("Identifiant CRM dans les liens (motif)", U.zone("id_crm_liens", R.id_crm_liens || "", 2), "un motif par ligne ; ex. immo-facile-(\\d{8})\\b (8 chiffres : un bien ; 6 chiffres : c'est une agence)")}
${U.champ("Portail → origine (JSON)", U.zone("origines_portail", typeof R.origines_portail === "string" ? R.origines_portail : JSON.stringify(R.origines_portail || {}), 4), '{"leboncoin":"leboncoin","seloger":"se_loger"}')}
${U.champ("Siège (reçoit toujours)", U.zone("siege", siege.filter((s) => s.actif !== false).map((s) => s.email).join("\n"), 3))}
</div>`)}
<div class="ld-actions"><button class="btn btn-primary">Enregistrer</button></div></form>
${U.carte("Outils", `<div class="ld-actions">
<form method="post" action="/leads/reglages/tester">${hidden(req)}<button class="btn btn-sm btn-outline-primary">Tester la connexion au CRM</button></form>
<form method="post" action="/leads/reglages/installer">${hidden(req)}<button class="btn btn-sm btn-outline-secondary">Installer / réparer le workflow</button></form>
<form method="post" action="/leads/reglages/installer">${hidden(req)}<input type="hidden" name="reecrire" value="1"><button class="btn btn-sm btn-outline-danger">Réécrire le workflow</button></form>
<a class="btn btn-sm btn-link" href="/dysizz-flow/workflows">Voir les workflows</a><a class="btn btn-sm btn-link" href="/dysizz-flow/ecouteurs">Écouteurs</a></div>`)}`;
  U.page(req, res, "Réglages", "reglages", html);
};

const enregistrer = async (req, res) => {
  if (!isAdmin(req)) return refuse(res);
  const b = req.body || {}, t = await tables();
  const R = await lireReglages();
  const api = flowApi();
  const pre = R.prefixe_secrets || "LEADS_CRM";
  let avance = {};
  try { avance = b.crm_avance ? JSON.parse(b.crm_avance) : {}; } catch (e) { return go(res, "/leads/reglages", "Réglages avancés : JSON invalide", true); }
  try { if (b.origines_portail) JSON.parse(b.origines_portail); } catch (e) { return go(res, "/leads/reglages", "Portail → origine : JSON invalide", true); }
  const crm = b.crm === "salesforce" ? "salesforce" : "immofacile";
  const C = { ...avance, ...(crm === "immofacile" ? { site_id: String(b.if_site_id || "").trim(), base: String(b.if_base || "").trim() || undefined, groupe_demandeur: String(b.if_groupe || "").trim() || undefined, action_lead: String(b.if_action || "").trim() || undefined } : { domaine: String(b.sf_domaine || "").trim(), contact: { ...(avance.contact || {}), objet: b.sf_objet === "Contact" ? "Contact" : "Lead" } }) };
  let mode = b.mode === "reel" ? "reel" : "ombre";
  let note = "";
  if (mode === "reel" && R.mode !== "reel" && String(b.confirmer || "").trim().toUpperCase() !== "REEL") { mode = "ombre"; note = " — mode réel NON activé (tape REEL pour confirmer)"; }
  const row = { crm, crm_reglages: JSON.stringify(C), mode, envoi_mails: b.envoi_mails === "on", utiliser_relais: b.utiliser_relais === "on", consentement_actif: b.consentement_actif === "on", consentement_libelle: String(b.consentement_libelle || "").slice(0, 300),
    domaines_agence: liste(b.domaines_agence).join(", "), sites: JSON.stringify(sitesLire(b.sites)), objets_campagnes: String(b.objets_campagnes || ""), id_crm_liens: String(b.id_crm_liens || ""), origines_portail: String(b.origines_portail || "{}"), prefixe_secrets: pre, maj_le: new Date() };
  const ex = (await t.reglages.getRows({}, { limit: 1 }))[0];
  if (ex) await t.reglages.updateRow(row, ex.id); else await t.reglages.insertRow(row);
  for (const [champ, suffixe] of [["s_basic", "BASIC"], ["s_client_id", "CLIENT_ID"], ["s_client_secret", "CLIENT_SECRET"], ["s_refresh_token", "REFRESH_TOKEN"]]) if (String(b[champ] || "").trim()) await api.writeSecret(`${pre}_${suffixe}`, String(b[champ]).trim(), "dysizz-leads");
  if (String(b.s_mail || "").trim()) await api.writeSecret("LEADS_MAIL_MDP", String(b.s_mail).trim(), "dysizz-leads : boîte des leads");
  const siege = liste(b.siege).filter((x) => /@/.test(x));
  await t.siege.deleteRows({});
  for (const email of siege) await t.siege.insertRow({ email: email.toLowerCase(), libelle: "Siège", actif: true });
  if (String(b.m_serveur || "").trim() && String(b.m_utilisateur || "").trim()) {
    try { await regler_ecouteur({ serveur: b.m_serveur.trim(), port: b.m_port, utilisateur: b.m_utilisateur.trim(), secret: "LEADS_MAIL_MDP", actif: b.m_actif === "on" }); } catch (e) { return go(res, "/leads/reglages", "Réglages enregistrés, mais écouteur : " + e.message, true); }
  }
  go(res, "/leads/reglages", "Réglages enregistrés" + note, !!note);
};

const tester = async (req, res) => {
  if (!isAdmin(req)) return refuse(res);
  try {
    const { charger } = require("../conf");
    const { crm } = await charger();
    const c = flowApi().crmDepuisCoffre(crm.type, crm.reglages, crm.prefixe, "ombre");
    await c.tester();
    go(res, "/leads/reglages", `Connexion ${crm.type} réussie (lecture seule)`);
  } catch (e) { go(res, "/leads/reglages", "Connexion impossible : " + e.message, true); }
};
const installerPost = async (req, res) => {
  if (!isAdmin(req)) return refuse(res);
  try { const log = await installer({ reecrire: (req.body || {}).reecrire === "1" }); go(res, "/leads/reglages", log.join(" · ")); } catch (e) { go(res, "/leads/reglages", e.message, true); }
};

/* ---------------- Import ---------------- */
const importPage = async (req, res) => {
  if (!isAdmin(req)) return refuse(res);
  const t = await tables();
  const n = { agences: (await t.agences.getRows({})).length, personnes: (await t.personnes.getRows({})).length, origines: (await t.origines.getRows({})).length };
  const Table = require("@saltcorn/data/models/table");
  const tm = Table.findOne({ name: MAILS });
  const S = require("@saltcorn/data/db").getTenantSchema();
  const sans = tm ? +(await require("@saltcorn/data/db").query(`select count(*) n from "${S}".${MAILS} m where not exists (select 1 from "${S}".ld_leads l where l.mail_id = m.id)`)).rows[0].n : 0;
  const html = `${U.carte("Reprendre les référentiels d'une sauvegarde Saltcorn", `<p>Dans le dossier <code>tables/</code> d'une sauvegarde, choisis : <code>agence.json</code>, <code>contact_negociateur.json</code>, <code>origine.json</code>, <code>destinataire_custom.json</code>, <code>destinataire_custom_nego.json</code>. Seuls ces fichiers sont lus ; les secrets des sauvegardes (config SMTP, jetons…) ne sont jamais importés.</p>
<p>Pour comparer avec l'ancien système, ajoute le fichier <code>comparaison-ancien.json</code> (fabriqué depuis la sauvegarde par <code>tools/comparaison-sauvegarde.py</code>) : chaque lead est relié au résultat de l'ancien (statut, bien, destinataires) par le numéro du mail dans la boîte.</p>
<p class="ld-mute">Aujourd'hui : ${n.agences} agence(s), ${n.personnes} personne(s), ${n.origines} origine(s). L'import complète et met à jour, il ne supprime rien.</p>
<form method="post" action="/leads/import" enctype="multipart/form-data">${hidden(req)}<input class="form-control form-control-sm" type="file" name="fichiers" multiple accept=".json" required>
<div class="ld-actions">${U.coche("senegal", false, "Reprendre la règle codée en dur de l'ancien système (négociateurs @selectionsenegal.com → assistante seule gemma@selectionhabitat.com)")}</div>
<div class="ld-actions"><button class="btn btn-sm btn-primary">Importer</button></div></form>`)}
${U.carte("Rejouer en ombre", `<p>${sans} mail(s) reçu(s) n'ont pas encore de lead. Ils sont traités en mode ombre (CRM lu, rien d'écrit), par lots de 50.</p><form method="post" action="/leads/import/rejouer">${hidden(req)}<button class="btn btn-sm btn-outline-primary" ${sans ? "" : "disabled"}>Traiter 50 mails</button></form>`)}`;
  U.page(req, res, "Import", "import", html);
};

const lireFichiers = (req) => {
  const f = req.files && req.files.fichiers;
  const out = {};
  for (const x of [].concat(f || [])) {
    const nom = String(x.name || "").toLowerCase().replace(/\.json$/, "");
    try {
      const buf = x.data && x.data.length ? x.data : x.tempFilePath ? require("fs").readFileSync(x.tempFilePath) : Buffer.alloc(0);
      out[nom] = JSON.parse(buf.toString("utf8"));
    } catch (e) { /* fichier ignoré */ }
  }
  return out;
};

const importPost = async (req, res) => {
  if (!isAdmin(req)) return refuse(res);
  const F = lireFichiers(req), t = await tables(), log = [];
  const upsert = async (T, cle, row) => { const ex = await T.getRow({ [cle]: row[cle] }); if (ex) { await T.updateRow(row, ex.id); return ex.id; } return T.insertRow(row); };
  if (Array.isArray(F.agence)) { for (const a of F.agence) await upsert(t.agences, "crm_id", { nom: a.nom, crm_id: String(a.agency_id || ""), boites: [...new Set([a.boite].concat(String(a.emails || "").match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g) || []).filter(Boolean).map((x) => String(x).toLowerCase()))].join(", "), actif: true }); log.push(`${F.agence.length} agences`); }
  if (Array.isArray(F.origine)) { for (const o of F.origine) await upsert(t.origines, "code", { code: o.code, libelle: o.libelle, crm_id: String(o.origin_id || "") }); log.push(`${F.origine.length} origines`); }
  if (Array.isArray(F.contact_negociateur)) {
    const assist = new Map();
    for (const c of F.contact_negociateur) {
      const e = String(c.email_secretaire || "").toLowerCase().trim();
      if (e && !assist.has(e)) { const ex = await t.personnes.getRow({ email: e }); assist.set(e, ex ? ex.id : await t.personnes.insertRow({ nom: c.nom_secretaire || e, email: e, role: "assistante", temps: "plein", actif: true })); }
    }
    for (const c of F.contact_negociateur) {
      const e = String(c.email_secretaire || "").toLowerCase().trim();
      await upsert(t.personnes, "crm_id", { nom: c.nom || c.nom_immofacile, email: String(c.email_negociateur || "").toLowerCase(), role: "negociateur", crm_id: String(c.user_id), agence_crm_id: String(c.agency_id || ""), assistante: e ? assist.get(e) : null, telephone: c.telephone || "", actif: c.actif !== false });
    }
    log.push(`${F.contact_negociateur.length} négociateurs, ${assist.size} assistant(e)s`);
  }
  if (Array.isArray(F.destinataire_custom)) {
    const P = await t.personnes.getRows({});
    for (const d of F.destinataire_custom.filter((x) => x.actif)) {
      if (d.portee === "tous") { if (!(await t.siege.getRow({ email: d.email }))) await t.siege.insertRow({ email: d.email, libelle: d.libelle || "Siège", actif: true }); continue; }
      const ids = (F.destinataire_custom_nego || []).filter((x) => x.custom === d.id).map((x) => (P.find((p) => p.crm_id === String(x.user_id)) || {}).id).filter(Boolean);
      if (ids.length && !(await t.regles.getRow({ libelle: d.libelle }))) await t.regles.insertRow({ libelle: d.libelle || d.email, tous: false, negociateurs: ids.map((i) => "p:" + i).join(","), couper_negociateur: false, assistante: "garder", adresses_libres: d.email, actif: true, maj_le: new Date() });
    }
    log.push("destinataires en plus → siège et règles");
  }
  if ((req.body || {}).senegal === "on" && !(await t.regles.getRow({ libelle: "Sénégal : assistante seule" }))) {
    const P = await t.personnes.getRows({});
    const ids = P.filter((p) => /@selectionsenegal\.com$/.test(p.email || "") && p.role !== "assistante" && ["voury", "christophe", "claude", "josephine"].includes(String(p.email).split("@")[0])).map((p) => "p:" + p.id);
    if (ids.length) { await t.regles.insertRow({ libelle: "Sénégal : assistante seule", tous: false, negociateurs: ids.join(","), couper_negociateur: true, assistante: "remplacer", assistante_remplacante: "gemma@selectionhabitat.com", adresses_libres: "", actif: true, maj_le: new Date() }); log.push("règle Sénégal"); }
  }
  const comp = Object.entries(F).find(([k, v]) => /^comparaison/.test(k) && Array.isArray(v));
  if (comp) {
    const db = require("@saltcorn/data/db"), S = db.getTenantSchema();
    let n = 0;
    for (const c of comp[1]) {
      if (!c || c.uid === undefined || c.uid === null || !c.statut) continue;
      const r = await db.query(`update "${S}".ld_leads l set ancien_statut = $1, ancien_bien = $2, ancien_destinataires = $3 from "${S}".${MAILS} m where m.id = l.mail_id and m.uid = $4 and trim(m.objet) = trim($5)`, [String(c.statut), c.bien ? String(c.bien) : "", String(c.destinataires || "").split(/,\s*/).filter(Boolean).sort().join(", "), +c.uid, String(c.objet || "")]);
      n += r.rowCount || 0;
    }
    log.push(`${n} lead(s) reliés aux résultats de l'ancien système`);
  }
  go(res, "/leads/import", log.length ? "Importé : " + log.join(", ") : "Aucun fichier reconnu", !log.length);
};

const rejouer = async (req, res) => {
  if (!isAdmin(req)) return refuse(res);
  const db = require("@saltcorn/data/db"), S = db.getTenantSchema();
  const ids = (await db.query(`select m.id from "${S}".${MAILS} m where not exists (select 1 from "${S}".ld_leads l where l.mail_id = m.id) order by m.date_envoi, m.id limit 50`)).rows.map((r) => r.id);
  let ok = 0, ko = 0;
  for (const id of ids) { try { await retraiter(id, { forcerOmbre: true }); ok++; } catch (e) { ko++; } }
  go(res, "/leads/import", `${ok} mail(s) traité(s) en ombre${ko ? `, ${ko} en échec` : ""}`, !!ko && !ok);
};

module.exports = { page, enregistrer, tester, installerPost, importPage, importPost, rejouer, sitesLire };
