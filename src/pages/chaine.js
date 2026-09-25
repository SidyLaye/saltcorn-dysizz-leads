/* La chaîne à la carte (étapes actives), les portails déclarés sans code, les nouveaux expéditeurs,
   le catalogue local des biens et le webhook du CRM. */
"use strict";
const { esc, isAdmin, hidden, go, dateFr, flowApi } = require("../core");
const { tables } = require("../schema");
const { reglages: lireReglages, json, liste } = require("../conf");
const { synchroniser, evenementBien } = require("../catalogue");
const U = require("../ui");

const refuse = (res) => res.status(403).send("Réservé aux administrateurs");
const db = () => require("@saltcorn/data/db");
const ETAPES = [
  ["bien", "Rapprocher le bien", "sans cette étape, pas de négociateur tiré du bien"],
  ["contact", "Retrouver ou créer le contact", ""],
  ["suivi", "Lier le contact au bien (suivi)", ""],
  ["projet", "Projet de recherche (critères du bien demandé)", ""],
  ["commentaire", "Commentaire = conversation entière", "reconstruit à chaque mail"],
  ["consentement", "Consentement anti-démarchage", "un par contact, preuve .eml jointe"],
  ["action", "Action « message reçu » dans l'historique", "si un type d'action est réglé"],
  ["notification", "Calculer les destinataires", "l'envoi reste à part (réglage « Envoyer les mails »)"],
];

const page = async (req, res) => {
  if (!isAdmin(req)) return refuse(res);
  const t = await tables();
  const R = await lireReglages();
  const E = json(R.etapes, {});
  const M = { prix: 0.1, surface: 0.2, pieces: 1, ...json(R.marges_projet, {}) };
  const portails = await t.portails.getRows({}, { orderBy: "nom" });
  const S = db().getTenantSchema();
  const nouveaux = (await db().query(`select lower(substring(expediteur from '@([A-Za-z0-9.-]+)')) d, count(*) n, max(objet) o, max(id) id from "${S}".ld_leads
    where (portail = 'inconnu' or statut = 'a_trier') and traite_le > now() - interval '30 days' group by 1 order by 2 desc limit 15`).catch(() => ({ rows: [] }))).rows;
  const nbBiens = +(await db().query(`select count(*) n from "${S}".ld_biens where supprime is not true`).catch(() => ({ rows: [{ n: 0 }] }))).rows[0].n;
  const url = `${req.protocol}://${req.get("host")}/leads/crochet/crm`;
  const pre = R.prefixe_secrets || "LEADS_CRM";
  const api = flowApi();
  const aSecret = api ? await api.hasSecret(pre + "_WEBHOOK") : false;
  const html = `<form method="post" action="/leads/chaine">${hidden(req)}
${U.carte("Étapes de la chaîne", `<p class="ld-mute" style="margin:0 0 8px">Tout est actif par défaut. Un client qui ne veut qu'une partie coupe le reste ; la lecture des mails et le tableau de bord restent toujours là.</p>
<div class="ld-form">${ETAPES.map(([k, l, a]) => U.champ("", U.coche("e_" + k, E[k] !== false, esc(l)) + (a ? `<small class="ld-mute">${esc(a)}</small>` : ""))).join("")}</div>`)}
${U.carte("Relances et commentaire", `<div class="ld-form">
${U.champ("Relance d'un dossier déjà suivi", U.select("notifier_relances", [["negociateur", "au négociateur et à son assistant(e) seulement"], ["tous", "à tous les destinataires (comme un nouveau lead)"], ["non", "à personne (seulement dans le CRM)"]], R.notifier_relances || "negociateur"))}
${U.champ("Taille maximale du commentaire", U.input("commentaire_max", R.commentaire_max || 6000, { type: "number" }), "au-delà : la 1re demande et les messages les plus récents")}
${U.champ("Projet de recherche · prix max", U.input("m_prix", Math.round(M.prix * 100), { type: "number" }), "en % au-dessus du prix du bien")}
${U.champ("Projet de recherche · surface min", U.input("m_surface", Math.round(M.surface * 100), { type: "number" }), "en % en dessous de la surface du bien")}
${U.champ("Projet de recherche · pièces min", U.input("m_pieces", M.pieces, { type: "number" }), "pièces en moins")}
${U.champ("Conserver le texte des mails", U.input("retention_jours", R.retention_jours || 0, { type: "number" }), "en jours ; 0 = toujours. Au-delà, le corps est effacé (l'empreinte et la preuve restent dans le CRM).")}
</div>`)}
<div class="ld-actions"><button class="btn btn-primary">Enregistrer</button></div></form>

${U.carte("Catalogue local des biens", `<p style="margin:0 0 8px">${nbBiens} bien(s) · ${esc(R.catalogue_etat || "jamais synchronisé")}</p>
<p class="ld-mute" style="margin:0 0 8px">Le rapprochement se fait sur ce catalogue (rapide, sans appel au CRM). Mise à jour : une fois par heure (biens modifiés), et en temps réel par webhook si le CRM le permet.</p>
<div class="ld-actions"><form method="post" action="/leads/catalogue">${hidden(req)}<button class="btn btn-sm btn-outline-primary">Mettre à jour maintenant</button></form>
<form method="post" action="/leads/catalogue">${hidden(req)}<input type="hidden" name="complet" value="1"><button class="btn btn-sm btn-outline-secondary">Tout recharger</button></form></div>
<p style="margin:12px 0 4px"><b>Webhook Immofacile</b> ${aSecret ? U.pill("clé rangée", "ok") : U.pill("clé absente", "warn")}</p>
<p class="ld-mute ld-mono" style="margin:0">POST /hooks { "url": "${esc(url)}", "origines": ["PRODUCT_CREATE","PRODUCT_UPDATE","PRODUCT_DELETE"], "headers": { "X-Api-Key": "&lt;la clé&gt;" } }</p>
<form method="post" action="/leads/chaine/webhook" class="ld-inline" style="margin-top:8px">${hidden(req)}${U.input("cle", "", { type: "password", placeholder: "clé du webhook (rangée chiffrée)" })}<button class="btn btn-sm btn-outline-secondary">Ranger la clé</button></form>`)}

${U.carte("Portails déclarés (sans code)", `${U.table(["Nom", "Domaines", "Objets qui sont des leads", "Référence", ""], portails.map((p) => [esc(p.nom), `<span class="ld-mono">${esc(p.domaines)}</span>`, `<span class="ld-mono">${esc(String(p.objets_lead || "").split("\n").join(" · "))}</span>`, `<span class="ld-mono">${esc(p.reference || "")}</span>`,
    `<form method="post" action="/leads/portails/${p.id}/supprimer" class="ld-inline">${hidden(req)}<button class="btn btn-sm btn-link">retirer</button></form>`]), "Aucun portail déclaré : ceux du code suffisent pour l'instant.")}
<form method="post" action="/leads/portails" style="margin-top:10px">${hidden(req)}<div class="ld-form">
${U.champ("Nom", U.input("nom", req.query.domaine || "", { required: true }))}
${U.champ("Domaines de l'expéditeur", U.input("domaines", req.query.domaine || "", { placeholder: "exemple-immo.fr", required: true }), "séparés par des virgules")}
${U.champ("Objets qui sont des leads", U.zone("objets_lead", "", 2, { placeholder: "nouveau contact\ndemande d'information" }), "un par ligne (vide = tous les mails de ce portail)")}
${U.champ("Objets qui ne sont pas des leads", U.zone("objets_non_lead", "", 2, { placeholder: "facture\nnewsletter" }))}
${U.champ("Libellés en plus (JSON)", U.zone("libelles", "", 2, { placeholder: '{"tél. perso": "telephone", "n° client": "ignorer"}' }), "champs : email, telephone, nom, prenom, reference, prix, ville, code_postal, message…")}
${U.champ("Référence (expression)", U.input("reference", "", { placeholder: "Réf\\\\.?\\\\s*:\\\\s*(\\\\S+)" }))}
</div><div class="ld-actions"><button class="btn btn-sm btn-primary">Déclarer ce portail</button></div></form>`)}

${U.carte("Nouveaux expéditeurs · 30 jours", U.table(["Domaine", "Mails", "Exemple", ""], nouveaux.filter((n) => n.d).map((n) => [esc(n.d), n.n, `<a href="/leads/l/${n.id}">${esc(String(n.o || "").slice(0, 70))}</a>`, `<a class="btn btn-sm btn-link" href="/leads/chaine?domaine=${encodeURIComponent(n.d)}">déclarer comme portail</a>`]), "Aucun expéditeur inconnu."))}`;
  U.page(req, res, "Chaîne et portails", "chaine", html);
};

const enregistrer = async (req, res) => {
  if (!isAdmin(req)) return refuse(res);
  const b = req.body || {}, t = await tables();
  const etapes = Object.fromEntries(ETAPES.map(([k]) => [k, b["e_" + k] === "on"]).filter(([, v]) => v === false));
  const marges = { prix: Math.max(0, +b.m_prix || 0) / 100, surface: Math.max(0, Math.min(90, +b.m_surface || 0)) / 100, pieces: Math.max(0, +b.m_pieces || 0) };
  const row = { etapes: JSON.stringify(etapes), notifier_relances: ["negociateur", "tous", "non"].includes(b.notifier_relances) ? b.notifier_relances : "negociateur",
    commentaire_max: Math.max(1000, Math.min(60000, +b.commentaire_max || 6000)), marges_projet: JSON.stringify(marges), retention_jours: Math.max(0, +b.retention_jours || 0), maj_le: new Date() };
  const ex = (await t.reglages.getRows({}, { limit: 1 }))[0];
  if (ex) await t.reglages.updateRow(row, ex.id); else await t.reglages.insertRow(row);
  go(res, "/leads/chaine", "Chaîne enregistrée");
};

const portailAjouter = async (req, res) => {
  if (!isAdmin(req)) return refuse(res);
  const b = req.body || {}, t = await tables();
  if (b.libelles) { try { JSON.parse(b.libelles); } catch (e) { return go(res, "/leads/chaine", "Libellés : JSON invalide", true); } }
  for (const x of [...String(b.objets_lead || "").split("\n"), ...String(b.objets_non_lead || "").split("\n"), b.reference || ""].filter((s) => s.trim())) { try { new RegExp(x, "i"); } catch (e) { return go(res, "/leads/chaine", `Expression invalide : ${x}`, true); } }
  await t.portails.insertRow({ nom: String(b.nom).slice(0, 100), domaines: liste(b.domaines).map((x) => x.toLowerCase()).join(", "), objets_lead: String(b.objets_lead || ""), objets_non_lead: String(b.objets_non_lead || ""), libelles: String(b.libelles || ""), reference: String(b.reference || ""), nature: "lead", actif: true });
  go(res, "/leads/chaine", "Portail déclaré : les prochains mails seront reconnus. « Retraiter » les anciens depuis leur fiche.");
};
const portailRetirer = async (req, res) => {
  if (!isAdmin(req)) return refuse(res);
  const t = await tables(); await t.portails.deleteRows({ id: +req.params.id });
  go(res, "/leads/chaine", "Portail retiré");
};

const catalogue = async (req, res) => {
  if (!isAdmin(req)) return refuse(res);
  try { const r = await synchroniser({ complet: (req.body || {}).complet === "1" }); go(res, "/leads/chaine", r.message, !r.ok); } catch (e) { go(res, "/leads/chaine", "Catalogue : " + e.message, true); }
};

const webhookCle = async (req, res) => {
  if (!isAdmin(req)) return refuse(res);
  const cle = String((req.body || {}).cle || "").trim();
  if (cle.length < 24) return go(res, "/leads/chaine", "Clé trop courte (24 caractères au moins)", true);
  const R = await lireReglages();
  await flowApi().writeSecret((R.prefixe_secrets || "LEADS_CRM") + "_WEBHOOK", cle, "dysizz-leads : webhook du CRM");
  go(res, "/leads/chaine", "Clé du webhook rangée");
};

/* Webhook entrant du CRM : clé dans X-Api-Key, réponse immédiate, traitement ensuite. */
const crochet = async (req, res) => {
  try {
    const R = await lireReglages();
    const ok = await flowApi().secretEgal((R.prefixe_secrets || "LEADS_CRM") + "_WEBHOOK", req.get("x-api-key"));
    if (!ok) return res.status(401).json({ error: "clé invalide" });
    const b = req.body || {};
    const type = String(b.event_type || b.type || ""), id = b.resource_id || b.id;
    if (!/^PRODUCT_/i.test(type) || !id) return res.status(200).json({ ignore: true });
    res.status(200).json({ recu: true });
    const db_ = require("@saltcorn/data/db"), tenant = db_.getTenantSchema();
    setImmediate(() => db_.runWithTenant(tenant, () => evenementBien(type, id)).catch(() => {}));
  } catch (e) { if (!res.headersSent) res.status(500).json({ error: "erreur interne" }); }
};

module.exports = { page, enregistrer, portailAjouter, portailRetirer, catalogue, webhookCle, crochet };
