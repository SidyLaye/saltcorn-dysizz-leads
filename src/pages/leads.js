/* Tableau de bord, liste des leads, fiche d'un lead (tout ce qui a été lu et décidé). */
"use strict";
const { esc, peutVoir, isAdmin, hidden, go, dateFr, flowApi } = require("../core");
const { tables, MAILS } = require("../schema");
const { charger } = require("../conf");
const { retraiter } = require("../dossier");
const { etat_ecouteur } = require("../installer");
const U = require("../ui");

const refuse = (res) => res.status(403).send("Accès réservé à l'équipe");
const db = () => require("@saltcorn/data/db");
const nb = async (where, params) => +((await db().query(`select count(*) n from "${db().getTenantSchema()}".ld_leads ${where ? "where " + where : ""}`, params || [])).rows[0].n);

/* Bandeau d'état : mode, CRM, écouteur, envoi. */
const bandeau = async () => {
  const { crm, reglages } = await charger().catch(() => ({ crm: {}, reglages: {} }));
  const e = await etat_ecouteur().catch(() => null);
  const ec = !e ? U.pill("écouteur non réglé", "warn") : e.etat === "erreur" ? U.pill("écouteur en erreur", "ko") : U.pill(e.etat === "idle" ? "écoute en temps réel" : e.etat || "en attente", e.etat === "idle" || e.etat === "ok" ? "ok" : "warn");
  return `<div class="ld-bandeau"><span>Mode ${crm.mode === "reel" ? '<span class="ld-reel">RÉEL</span>' : '<span class="ld-ombre">OMBRE</span> <span class="ld-mute">le CRM est seulement lu</span>'}</span>
<span>CRM <b>${esc(crm.type || "—")}</b></span><span>Boîte ${e ? `<b>${esc(e.utilisateur)}</b> ` : ""}${ec}${e && e.vu_le ? ` <span class="ld-mute">vu ${esc(dateFr(e.vu_le))}</span>` : ""}</span>
<span>Envoi des mails ${reglages.envoi_mails ? U.pill("activé", "warn") : U.pill("coupé", "mute")}</span></div>`;
};

const tableau = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  await tables();
  const J = "traite_le > now() - interval '1 day'", S = "traite_le > now() - interval '7 days'";
  const [p1, v1, t1, i1, p7, v7, t7, moy] = await Promise.all([
    nb(`${J} and statut='pret'`), nb(`${J} and statut='a_verifier'`), nb(`${J} and statut='a_trier'`), nb(`${J} and statut in ('ignore','alerte')`),
    nb(`${S} and statut='pret'`), nb(`${S} and statut='a_verifier'`), nb(`${S} and statut='a_trier'`),
    db().query(`select coalesce(round(avg(duree_ms)),0) m from "${db().getTenantSchema()}".ld_leads where ${S}`).then((r) => +r.rows[0].m),
  ]);
  const parPortail = (await db().query(`select coalesce(nullif(portail,''),'(autre)') p, count(*) n, count(*) filter (where statut='pret') ok, count(*) filter (where statut='a_verifier') v from "${db().getTenantSchema()}".ld_leads where ${S} and nature not in ('non_lead','auto_reponse','interne','alerte_spam') group by 1 order by 2 desc limit 20`)).rows;
  const motifs = (await db().query(`select split_part(motifs,' : ',1) m, count(*) n from "${db().getTenantSchema()}".ld_leads where ${S} and statut='a_verifier' group by 1 order by 2 desc limit 8`)).rows;
  const alertes = (await db().query(`select id, objet, alertes, traite_le from "${db().getTenantSchema()}".ld_leads where alertes <> '' and ${S} order by traite_le desc limit 8`)).rows;
  const t = await tables();
  const dem = await t.demandes.getRows({}, { orderBy: "cree_le", orderDesc: true, limit: 50 });
  const ouvertes = dem.filter((d) => !["Terminée", "Mise en ligne"].includes(d.statut));
  const DC = await require("./dossiers").chiffres().catch(() => ({ nouveaux: 0, sans_reponse: 0, mediane_ms: null }));
  let absents = [];
  try { const { conf } = await charger(); absents = flowApi().leads.absentsSemaine(conf.routage, new Date()); } catch (e) { /* rien */ }
  const html = `<div class="ld-kpis">
${U.kpi(p1, "prêts aujourd'hui", { ton: "ok", lien: "/leads/liste?statut=pret&periode=1" })}${U.kpi(v1, "à vérifier aujourd'hui", { ton: v1 ? "warn" : "", lien: "/leads/liste?statut=a_verifier&periode=1" })}${U.kpi(t1, "à trier aujourd'hui", { ton: "info", lien: "/leads/liste?statut=a_trier&periode=1" })}${U.kpi(i1, "non-leads écartés", { lien: "/leads/liste?statut=ignore&periode=1" })}
${U.kpi(DC.nouveaux, "conversations ouvertes sur 7 jours", { lien: "/leads/dossiers" })}${U.kpi(require("./dossiers").duree(DC.mediane_ms), "délai de 1re réponse (médiane, 30 j)", { ton: DC.mediane_ms != null && DC.mediane_ms > 864e5 ? "warn" : "ok" })}${U.kpi(DC.sans_reponse, "sans réponse depuis plus de 24 h", { ton: DC.sans_reponse ? "ko" : "", lien: "/leads/dossiers?sans_reponse=1" })}
${U.kpi(p7, "prêts sur 7 jours", { lien: "/leads/liste?statut=pret&periode=7" })}${U.kpi(v7, "à vérifier sur 7 jours", { ton: v7 ? "warn" : "", lien: "/leads/liste?statut=a_verifier&periode=7" })}${U.kpi(t7, "à trier sur 7 jours", { lien: "/leads/liste?statut=a_trier&periode=7" })}${U.kpi(moy + " ms", "temps moyen de traitement")}</div>
<div class="ld-grille ld-g2">
${U.carte("Par portail · 7 jours", U.table(["Portail", "Leads", "Prêts", "À vérifier", "Taux"], parPortail.map((r) => [`<a href="/leads/liste?portail=${encodeURIComponent(r.p)}&periode=7">${esc(r.p)}</a>`, r.n, r.ok, r.v ? `<span class="ld-badge warn">${r.v}</span>` : 0, Math.round((100 * r.ok) / Math.max(1, r.n)) + " %"])))}
${U.carte("Pourquoi « à vérifier » · 7 jours", U.table(["Motif", "Nombre"], motifs.map((m) => [esc(m.m || "—"), m.n])))}
${U.carte("Absents cette semaine", U.table(["Personne", "Relais"], absents.map((a) => [esc(a.personne), esc(a.resume)]), "Personne n'est absent cette semaine."), { actions: '<a href="/leads/absences" class="btn btn-sm btn-outline-secondary">Voir la semaine</a>' })}
${U.carte("Demandes en cours", U.table(["Demande", "Urgence", "Statut"], ouvertes.slice(0, 8).map((d) => [`<a href="/leads/demandes/${d.id}">${esc(d.titre)}</a>`, U.pill(d.urgence, d.urgence === "Bloquant" ? "ko" : d.urgence === "Important" ? "warn" : "mute"), esc(d.statut)]), "Aucune demande en cours."), { actions: '<a href="/leads/demandes" class="btn btn-sm btn-outline-secondary">Toutes</a>' })}
${U.carte("Alertes récentes", U.table(["Quand", "Mail", "Alerte"], alertes.map((a) => [esc(dateFr(a.traite_le)), `<a href="/leads/l/${a.id}">${esc(String(a.objet).slice(0, 70))}</a>`, esc(a.alertes)])))}
</div>`;
  U.page(req, res, "Tableau de bord", "", html, { bandeau: await bandeau() });
};

const liste = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  await tables();
  const q = req.query || {};
  const w = [], p = [];
  const add = (sql, v) => { p.push(v); w.push(sql.replace("?", "$" + p.length)); };
  if (q.statut) add("statut = ?", q.statut);
  if (q.portail) add("coalesce(nullif(portail,''),'(autre)') = ?", q.portail);
  if (+q.periode) add("traite_le > now() - (? || ' days')::interval", String(+q.periode));
  if (q.q) { p.push("%" + q.q + "%"); const n = "$" + p.length; w.push(`(objet ilike ${n} or contact_email ilike ${n} or contact_nom ilike ${n} or reference ilike ${n} or bien_ref_crm ilike ${n})`); }
  if (q.ecart === "1") w.push("ancien_statut is not null and ancien_statut <> '' and ((ancien_bien is distinct from nullif(bien_crm,'')) or (ancien_destinataires is distinct from destinataires))");
  const page = Math.max(1, +q.page || 1);
  const S = db().getTenantSchema();
  const where = w.length ? "where " + w.join(" and ") : "";
  const total = +(await db().query(`select count(*) n from "${S}".ld_leads ${where}`, p)).rows[0].n;
  const rows = (await db().query(`select id, recu_le, portail, nature, statut, decision, contact_nom, contact_email, reference, bien_ref_crm, agence, destinataires, objet, motifs from "${S}".ld_leads ${where} order by recu_le desc nulls last, id desc limit 50 offset ${(page - 1) * 50}`, p)).rows;
  const portails = (await db().query(`select distinct coalesce(nullif(portail,''),'(autre)') p from "${S}".ld_leads order by 1`)).rows.map((r) => r.p);
  const qs = (o) => "?" + new URLSearchParams({ ...q, ...o }).toString();
  const html = `<form class="ld-filtres" method="get">${U.select("statut", [["", "Tous les statuts"], ...Object.entries(U.STATUTS).map(([k, v]) => [k, v[0]])], q.statut || "")}${U.select("portail", [["", "Tous les portails"], ...portails], q.portail || "")}${U.select("periode", [["", "Toute la période"], ["1", "24 h"], ["7", "7 jours"], ["30", "30 jours"]], q.periode || "")}
<input class="form-control form-control-sm" name="q" value="${esc(q.q || "")}" placeholder="Nom, e-mail, référence…">${U.coche("ecart", q.ecart === "1", "écarts avec l'ancien système").replace('name="ecart"', 'name="ecart" value="1"')}<button class="btn btn-sm btn-primary">Filtrer</button> <span class="ld-mute">${total} résultat(s)</span></form>
${U.table(["Reçu", "Portail", "Contact", "Référence → bien", "Agence", "Statut", "Destinataires"], rows.map((r) => [
    `<a href="/leads/l/${r.id}">${esc(dateFr(r.recu_le))}</a>`, esc(r.portail || "—") + `<br><small class="ld-mute">${esc(r.nature)}</small>`,
    `${esc(r.contact_nom || "")}<br><small class="ld-mute">${esc(r.contact_email || "")}</small>`,
    `${esc(r.reference || "—")}${r.bien_ref_crm ? ` → <b>${esc(r.bien_ref_crm)}</b>` : ""}`, esc(r.agence || ""),
    U.badge(r.decision || r.statut) + (r.motifs ? `<br><small class="ld-mute">${esc(String(r.motifs).slice(0, 90))}</small>` : ""),
    `<small>${esc(String(r.destinataires || "").split(", ").filter(Boolean).length)} adresse(s)</small>`]), "Aucun lead ne correspond.")}
<div class="ld-pages">${page > 1 ? `<a class="btn btn-sm btn-outline-secondary" href="${qs({ page: page - 1 })}">Précédents</a>` : ""}${page * 50 < total ? `<a class="btn btn-sm btn-outline-secondary" href="${qs({ page: page + 1 })}">Suivants</a>` : ""}</div>`;
  U.page(req, res, "Leads", "liste", html, { bandeau: await bandeau() });
};

/* HTML d'un mail affiché sans risque : cadre isolé, sans script, liens neutralisés. */
const mailSur = (html) => String(html || "").replace(/<(script|iframe|object|embed|form|meta|link|base)\b[\s\S]*?(<\/\1\s*>|\/?>)/gi, "").replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'\s>]*/gi, "$1=$2#");

const fiche = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  const t = await tables();
  const l = await t.leads.getRow({ id: +req.params.id });
  if (!l) return go(res, "/leads/liste", "Lead introuvable", true);
  let d = {};
  try { d = JSON.parse(l.dossier || "{}"); } catch (e) { d = {}; }
  const x = d.extraction || {};
  const Table = require("@saltcorn/data/models/table");
  const tm = Table.findOne({ name: MAILS });
  const mail = tm && l.mail_id ? await tm.getRow({ id: l.mail_id }) : null;
  const ligne = (champ, v, pr) => [esc(champ), v === undefined || v === null || v === "" ? '<span class="ld-mute">—</span>' : esc(typeof v === "object" ? JSON.stringify(v) : v), `<span class="ld-mute ld-mono">${esc(pr || "")}</span>`];
  const P = x.preuves || {};
  const champs = [
    ...["prenom", "nom", "email", "email_relais", "telephone", "civilite", "pays"].map((k) => ligne("contact · " + k, (x.contact || {})[k], P["contact." + k])),
    ...["reference", "reference_portail", "id_crm", "titre", "type", "prix", "surface", "pieces", "chambres", "ville", "code_postal", "departement"].map((k) => ligne("bien · " + k, (x.bien || {})[k], P["bien." + k])),
    ...Object.entries(x.recherche || {}).map(([k, v]) => ligne("recherche · " + k, v, P["recherche." + k])),
    ligne("site d'origine", x.site, P.site), ligne("message", x.message, P.message),
  ].filter((r) => !/—<\/span>$/.test(r[1]) || /reference|email|telephone|nom/.test(r[0]));
  const R = d.rapprochement || {};
  const nego = d.negociateur ? await t.personnes.getRow({ crm_id: String(d.negociateur) }) : null;
  const etapes = (R.etapes || []).map((e) => [esc(e.etape), `<span class="ld-mono">${esc(typeof e.requete === "object" ? JSON.stringify(e.requete) : e.requete)}</span>`, esc(e.trouves), (e.candidats || []).map((c) => `${c.ok ? "✔" : "✖"} ${esc(c.reference)} <span class="ld-mute">(${esc(c.id)})</span> — ${esc(c.raison)}`).join("<br>")]);
  const D = d.destinataires || { liste: [], trace: [] };
  const ex = (d.execution && d.execution.resultats) || [];
  const html = `<div class="ld-actions" style="margin:-4px 0 12px">${U.badge(l.decision || l.statut)} ${U.pill(l.portail || "portail inconnu")} ${U.pill(l.nature)} ${l.mode === "reel" ? '<span class="ld-reel">RÉEL</span>' : '<span class="ld-ombre">OMBRE</span>'}
${l.dossier_id ? `<a class="btn btn-sm btn-outline-secondary" href="/leads/dossier/${l.dossier_id}"><i class="fas fa-comments"></i> Conversation</a>` : ""}
<form method="post" action="/leads/l/${l.id}/retraiter" class="ld-inline">${hidden(req)}<button class="btn btn-sm btn-outline-primary"><i class="fas fa-redo"></i> Retraiter (ombre)</button></form>
<form method="post" action="/leads/l/${l.id}/decision" class="ld-inline">${hidden(req)}${U.select("decision", [["", "Décision…"], ["traite", "Traité à la main"], ["ignore", "Pas un lead"], ["a_verifier", "À revoir"]], "")}<button class="btn btn-sm btn-outline-secondary">Enregistrer</button></form></div>
${l.motifs ? `<div class="ld-flash ko">${esc(l.motifs)}</div>` : ""}${l.alertes ? `<div class="ld-flash" style="background:rgba(161,92,0,.1)">${esc(l.alertes)}</div>` : ""}
<div class="ld-grille ld-g2">
${U.carte("Ce qui a été lu", (() => {
  const x = d.extraction || {}, lu = x.lu_par || ["regles"], le = x.lecture || {};
  const qui = lu.includes("ia") ? (lu.includes("gabarit") ? "règles + gabarit appris + IA" : "règles + IA") : lu.includes("gabarit") ? "règles + gabarit appris" : "règles";
  const ia = le.ia && le.ia.statut === "ok" ? `<br><small class="ld-mute">IA : ${esc(le.ia.nature)} (confiance ${esc(le.ia.confiance)})${le.ia.justification ? " — " + esc(le.ia.justification) : ""}${(le.ia.rejets || []).length ? " · refusé car absent du mail : " + esc(le.ia.rejets.join(", ")) : ""}</small>` : le.ia ? `<br><small class="ld-mute">IA : ${esc(le.ia.statut)}</small>` : "";
  const ap = le.apprentissage && le.apprentissage.fait !== "rien" ? `<br><small class="ld-mute">gabarit ${esc(le.apprentissage.fait)} (${esc(le.apprentissage.observations)} observation(s))</small>` : "";
  return `<p style="margin:0 0 8px">Lu par : <b>${esc(qui)}</b>${ia}${ap}</p>` + U.table(["Champ", "Valeur", "Source"], champs);
})())}
<div>
${U.carte("Bien", `<dl class="ld-kv"><dt>Résultat</dt><dd>${d.bien ? `<b>${esc(d.bien.reference)}</b> (id ${esc(d.bien.id)}) · ${esc([d.bien.type, d.bien.pieces && d.bien.pieces + " p.", d.bien.surface && d.bien.surface + " m²", d.bien.prix && d.bien.prix.toLocaleString("fr-FR") + " €", d.bien.ville].filter(Boolean).join(" · "))}` : `<span class="ld-badge warn">non trouvé</span> ${esc(R.motif || "")}`}</dd><dt>Méthode</dt><dd>${esc(R.methode || "—")} ${R.confiance ? U.pill("confiance " + R.confiance) : ""}</dd><dt>Agence</dt><dd>${esc(d.agence ? `${d.agence.nom} (par ${d.agence.par})` : "—")}</dd><dt>Négociateur</dt><dd>${nego ? `<a href="/leads/personne/${nego.id}">${esc(nego.nom)}</a> <span class="ld-mute">(${esc(d.negociateur)})</span>` : esc(d.negociateur || "—")}</dd><dt>Origine</dt><dd>${esc(d.origine ? `${d.origine.libelle || d.origine.code} ${d.origine.id ? "(" + d.origine.id + ")" : "(non reliée au CRM)"}` : "—")}</dd></dl>`)}
${U.carte("Étapes de recherche du bien", U.table(["Étape", "Requête", "Trouvés", "Vérification"], etapes, "Aucune recherche (pas un lead ou pas de référence)."))}
${U.carte("Contact", `<dl class="ld-kv"><dt>Décision</dt><dd>${esc((d.contact || {}).action || "—")}${(d.contact || {}).par ? " (trouvé par " + esc(d.contact.par) + ")" : ""}${(d.contact || {}).id ? " · contact " + esc(d.contact.id) : ""}</dd></dl>${((d.contact || {}).trace || []).length ? `<ul class="ld-trace">${d.contact.trace.map((z) => `<li>${esc(z)}</li>`).join("")}</ul>` : ""}`)}
</div>
${U.carte("Destinataires", U.table(["Adresse", "Rôle", "Pour", "Pourquoi"], D.liste.map((z) => [esc(z.email), esc((z.roles || [z.role]).join(", ")), esc(z.pour || ""), esc(z.raison || "")])) + (D.trace && D.trace.length ? `<ul class="ld-trace">${D.trace.map((z) => `<li>${esc(z)}</li>`).join("")}</ul>` : ""))}
${U.carte("Actions CRM", U.table(["Action", "Détail", "Fait ?"], (d.actions || []).map((a, i) => [esc(a.op), `<span class="ld-mono">${esc(JSON.stringify(a.donnees || { bien: a.bien, motif: a.motif, preuves: a.preuves } || {})).slice(0, 400)}</span>`, ex[i] ? (ex[i].fait ? U.pill("fait", "ok") : ex[i].erreur ? U.pill("erreur : " + ex[i].erreur, "ko") : U.pill("noté (ombre)", "mute")) : "—"]), "Aucune action."))}
</div>
${U.carte("Mail d'origine", mail ? `<dl class="ld-kv"><dt>De</dt><dd>${esc(mail.expediteur)}</dd><dt>À</dt><dd>${esc(mail.destinataire)}</dd><dt>Objet</dt><dd>${esc(mail.objet)}</dd><dt>Reçu</dt><dd>${esc(dateFr(mail.date_envoi))}</dd></dl><div style="margin-top:8px">${mail.corps_html ? `<iframe class="ld-mail" sandbox="" referrerpolicy="no-referrer" srcdoc="${esc(mailSur(mail.corps_html))}"></iframe>` : `<pre class="ld-pre">${esc(mail.corps_texte)}</pre>`}</div>` : '<p class="ld-vide">Mail non disponible.</p>')}
${l.ancien_statut ? U.carte("Ancien système (comparaison)", `<dl class="ld-kv"><dt>Statut</dt><dd>${esc(l.ancien_statut)}</dd><dt>Bien</dt><dd>${esc(l.ancien_bien || "—")} ${String(l.ancien_bien || "") === String(l.bien_crm || "") ? U.pill("identique", "ok") : U.pill("différent", "warn")}</dd><dt>Destinataires</dt><dd>${esc(l.ancien_destinataires || "—")}</dd></dl>`) : ""}`;
  U.page(req, res, l.objet || "Lead", "liste", html);
};

const retraiterPost = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  const t = await tables();
  const l = await t.leads.getRow({ id: +req.params.id });
  if (!l || !l.mail_id) return go(res, "/leads/liste", "Pas de mail à retraiter", true);
  try { const r = await retraiter(l.mail_id, { forcerOmbre: true }); go(res, `/leads/l/${r.id}`, "Retraité en mode ombre"); } catch (e) { go(res, `/leads/l/${l.id}`, "Échec : " + e.message, true); }
};
const decisionPost = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  const t = await tables();
  await t.leads.updateRow({ decision: String((req.body || {}).decision || "").slice(0, 30) }, +req.params.id);
  go(res, `/leads/l/${req.params.id}`, "Décision enregistrée");
};

module.exports = { tableau, liste, fiche, retraiterPost, decisionPost, bandeau };
