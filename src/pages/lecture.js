/* « Lecture des mails » : comment chaque mail a été lu (règles, gabarit appris, IA), les gabarits
   appris tout seuls, le réglage de l'IA et l'import des gabarits de l'ancien AMBS.
   Rien à déclarer à la main : un nouveau portail est lu par l'IA, puis appris. */
"use strict";
const { esc, peutVoir, isAdmin, hidden, go, dateFr, flowApi } = require("../core");
const { tables } = require("../schema");
const { reglages: lireReglages } = require("../conf");
const G = require("../gabarits");
const U = require("../ui");

const refuse = (res) => res.status(403).send("Accès réservé à l'équipe");
const db = () => require("@saltcorn/data/db");
const S = () => db().getTenantSchema();
const NOMS = { nom_complet: "nom complet", telephone: "téléphone", reference: "référence", type_bien: "type", nb_pieces: "pièces", code_postal: "CP" };
const STATUT = { actif: ["actif", "ok"], candidat: ["en apprentissage", "info"], suspendu: ["suspendu", "warn"], quarantaine: ["doublon", "mute"] };

const page = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  const t = await tables();
  const R = await lireReglages();
  const api = flowApi();
  const q = await db().query(`select coalesce(nullif(lu_par,''),'regles') lu, count(*) n from "${S()}".ld_leads where traite_le > now() - interval '30 days' and nature in ('lead','relance','recherche','estimation','direct','inconnu','reponse_campagne') group by 1`).catch(() => ({ rows: [] }));
  const par = Object.fromEntries(q.rows.map((r) => [r.lu, +r.n]));
  const total = Object.values(par).reduce((a, b) => a + b, 0) || 0;
  const pc = (n) => (total ? Math.round((100 * n) / total) + " %" : "—");
  const regles = par.regles || 0, gab = par["regles+gabarit"] || 0, ia = (par["regles+ia"] || 0) + (par["regles+gabarit+ia"] || 0);
  const jour = await G.appelsDuJour().catch(() => 0);
  const erreurs = +(await db().query(`select count(*) n from "${S()}".ld_ia where ok is not true and quand > now() - interval '1 day'`).catch(() => ({ rows: [{ n: 0 }] }))).rows[0].n;
  const gabs = (await t.gabarits.getRows({}, { orderBy: "id" })).map(G.versGabarit);
  const compte = (s) => gabs.filter((g) => g.statut === s).length;
  const communs = R.gabarits_partages ? (await G.lireCommuns().catch(() => [])).length : 0;
  const cle = api ? await api.hasSecret("LEADS_IA_CLE") : false;
  const admin = isAdmin(req);
  const ordre = { candidat: 0, suspendu: 1, actif: 2, quarantaine: 3 };
  const lignes = gabs.slice().sort((a, b) => (ordre[a.statut] ?? 9) - (ordre[b.statut] ?? 9) || String(a.source).localeCompare(String(b.source))).slice(0, 400).map((g) => {
    const s = g.signature || {};
    const [l, c] = STATUT[g.statut] || [g.statut || "—", "mute"];
    const act = !admin ? "" : `<form method="post" action="/leads/gabarits/${g.id}/statut" class="ld-inline">${hidden(req)}${g.statut === "actif"
      ? '<button class="btn btn-sm btn-link" name="statut" value="suspendu">suspendre</button>'
      : '<button class="btn btn-sm btn-link" name="statut" value="actif">activer</button>'}</form>`;
    return [
      `<b>${esc(g.source)}</b><br><small class="ld-mute">${esc(g.nature || "")}</small>`,
      `<small>${esc(String(s.expediteur || "").replace(/\\/g, "").replace(/\$$/, ""))}</small>${(s.ancres || []).map((a) => `<br><small class="ld-mute">« ${esc(a)} »</small>`).join("")}`,
      `<details><summary>${esc((g.champs || []).map((c) => NOMS[c.nom] || c.nom).join(", ") || "—")}</summary><pre class="ld-pre">${esc((g.champs || []).map((c) => `${c.nom} : /${c.motif}/`).join("\n"))}</pre></details>`,
      U.pill(l, c), esc(g.nb_observations || 0), esc(g.nb_utilisations || 0), g.nb_echecs ? U.pill(g.nb_echecs, "warn") : "0",
      `<small class="ld-mute">${esc(String(g.origine || "").startsWith("ambs") ? "ancien AMBS" : g.origine === "commun" ? "bibliothèque commune" : "appris ici")}<br>${esc(dateFr(g.vu_le || g.cree_le))}</small>`, act];
  });
  const html = `${U.carte("Comment un mail est lu", `<ol class="ld-trace">
<li><b>Règles</b> : pour les portails connus (SeLoger, Leboncoin, Green-Acres…), la lecture est écrite dans le moteur. Gratuit, instantané.</li>
<li><b>Gabarits appris</b> : pour un portail ou une mise en page nouvelle, la « forme » du mail a été apprise. Gratuit, instantané.</li>
<li><b>IA</b> : seulement si le mail reste inconnu ou incomplet. Chaque valeur rendue par l'IA est revérifiée dans le mail (rien d'inventé), et sa lecture sert à apprendre un gabarit : au 3e mail de la même forme, l'IA n'est plus appelée.</li></ol>
<p class="ld-mute" style="margin:6px 0 0">Si un portail change sa mise en page, le gabarit échoue, l'IA reprend et un nouveau gabarit s'apprend. Rien n'est à déclarer à la main.</p>`)}
<div class="ld-kpis">${U.kpi(pc(regles), "lus par les règles (30 j)", { detail: regles + " mail(s)" })}${U.kpi(pc(gab), "lus par un gabarit appris", { ton: "ok", detail: gab + " mail(s)" })}${U.kpi(pc(ia), "complétés par l'IA", { ton: "info", detail: ia + " mail(s)" })}
${U.kpi(`${jour} / ${+R.ia_plafond_jour || 200}`, "appels IA aujourd'hui / plafond", { ton: R.ia_actif ? "" : "warn", detail: R.ia_actif ? (erreurs ? erreurs + " erreur(s) sur 24 h" : "") : "IA coupée" })}
${U.kpi(compte("actif"), "gabarits actifs", { ton: "ok", detail: communs ? `+ ${communs} dans la bibliothèque commune` : "" })}${U.kpi(compte("candidat"), "en apprentissage")}${U.kpi(compte("suspendu"), "suspendus", { ton: compte("suspendu") ? "warn" : "" })}</div>
${admin ? `<form method="post" action="/leads/lecture">${hidden(req)}${U.carte("IA", `<div class="ld-form">
${U.champ("", U.coche("ia_actif", !!R.ia_actif, "Utiliser l'IA pour les mails inconnus ou incomplets"))}
${U.champ("Fournisseur", U.select("ia_fournisseur", [["saltcorn", "plugin « large-language-model » de Saltcorn (déjà réglé)"], ["openai", "OpenAI"], ["anthropic", "Anthropic"]], R.ia_fournisseur || "saltcorn"))}
${U.champ("Modèle", U.input("ia_modele", R.ia_modele || "", { placeholder: "vide = modèle par défaut" }), "ignoré avec le plugin Saltcorn (c'est son réglage qui compte)")}
${U.champ("Adresse de l'API", U.input("ia_url", R.ia_url || "", { placeholder: "vide = adresse officielle" }), "pour une API compatible OpenAI (Mistral, Azure, serveur interne…)")}
${U.champ("Plafond d'appels par jour", U.input("ia_plafond_jour", R.ia_plafond_jour || 200, { type: "number" }), "au-delà, les mails restent « à trier » jusqu'au lendemain")}
${U.champ(`Clé d'API ${cle ? U.pill("rangée", "ok") : U.pill("absente", "mute")}`, U.input("ia_cle", "", { type: "password", placeholder: "laisser vide pour garder" }), "rangée chiffrée dans le coffre (LEADS_IA_CLE), jamais réaffichée ; inutile avec le plugin Saltcorn")}
${U.champ("", U.coche("gabarits_partages", !!R.gabarits_partages, "Partager les gabarits des portails avec les autres clients (bibliothèque commune)") + '<small class="ld-mute">seule la forme du mail est partagée (libellés, expressions) ; aucune donnée de prospect</small>')}
</div><div class="ld-actions"><button class="btn btn-sm btn-primary">Enregistrer</button></div>`)}</form>` : ""}
${U.carte("Gabarits appris", U.table(["Portail", "Reconnu par", "Champs lus", "Statut", "Observations", "Utilisations", "Échecs", "Origine", ""], lignes, "Aucun gabarit pour l'instant : ils s'apprennent au fil des mails."))}
${admin ? U.carte("Reprendre les gabarits de l'ancien AMBS", `<p>Fichier <code>tables/gabarit_version.json</code> d'une sauvegarde : seuls les gabarits actifs sont repris ; ils ne servent que là où les règles ne suffisent pas.</p>
<form method="post" action="/leads/gabarits/import" enctype="multipart/form-data">${hidden(req)}<input class="form-control form-control-sm" type="file" name="fichiers" accept=".json" required><div class="ld-actions"><button class="btn btn-sm btn-outline-primary">Importer</button></div></form>`) : ""}`;
  U.page(req, res, "Lecture des mails", "lecture", html);
};

const enregistrer = async (req, res) => {
  if (!isAdmin(req)) return refuse(res);
  const b = req.body || {};
  const t = await tables();
  const R = (await t.reglages.getRows({}, { orderBy: "id", limit: 1 }))[0];
  const v = { ia_actif: b.ia_actif === "on", ia_fournisseur: ["saltcorn", "openai", "anthropic"].includes(b.ia_fournisseur) ? b.ia_fournisseur : "saltcorn", ia_modele: String(b.ia_modele || "").trim().slice(0, 80), ia_url: /^https:\/\/[\w.-]+(:\d+)?(\/[\w./-]*)?$/.test(String(b.ia_url || "").trim()) || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(String(b.ia_url || "").trim()) ? String(b.ia_url).trim().replace(/\/$/, "") : "",
    ia_plafond_jour: Math.max(0, Math.min(100000, +b.ia_plafond_jour || 200)), gabarits_partages: b.gabarits_partages === "on", maj_le: new Date() };
  if (R) await t.reglages.updateRow(v, R.id); else await t.reglages.insertRow(v);
  if (String(b.ia_cle || "").trim()) await flowApi().writeSecret("LEADS_IA_CLE", String(b.ia_cle).trim(), "dysizz-leads : clé d'API de l'IA");
  G.oublier();
  go(res, "/leads/lecture", "Réglages de l'IA enregistrés");
};

const statut = async (req, res) => {
  if (!isAdmin(req)) return refuse(res);
  const t = await tables();
  const s = (req.body || {}).statut === "actif" ? "actif" : "suspendu";
  await t.gabarits.updateRow(s === "actif" ? { statut: "actif", nb_echecs: 0, active_le: new Date() } : { statut: "suspendu", suspendu_le: new Date() }, +req.params.id);
  G.oublier();
  go(res, "/leads/lecture", s === "actif" ? "Gabarit activé" : "Gabarit suspendu");
};

const importer = async (req, res) => {
  if (!isAdmin(req)) return refuse(res);
  const f = [].concat((req.files && req.files.fichiers) || [])[0];
  if (!f) return go(res, "/leads/lecture", "Aucun fichier", true);
  let lignes;
  try { const buf = f.data && f.data.length ? f.data : require("fs").readFileSync(f.tempFilePath); lignes = JSON.parse(buf.toString("utf8")); } catch (e) { return go(res, "/leads/lecture", "Fichier illisible", true); }
  if (!Array.isArray(lignes)) return go(res, "/leads/lecture", "Ce n'est pas gabarit_version.json", true);
  const n = await G.importerAmbs(flowApi(), lignes);
  go(res, "/leads/lecture", `${n} gabarit(s) repris de l'ancien AMBS`);
};

module.exports = { page, enregistrer, statut, importer };
