/* Conversations : une conversation = un prospect au sujet d'un bien (comme un fil de mails).
   Tous les mails de ce prospect pour ce bien s'y rangent : sa demande, ses relances, les réponses de l'agence.
   C'est ce qui évite de créer un lead à chaque mail, et ce qui sert à écrire le commentaire du CRM.
   (dans les tables : ld_dossiers / ld_evenements) */
"use strict";
const { esc, peutVoir, go, dateFr, flowApi } = require("../core");
const { tables } = require("../schema");
const { charger } = require("../conf");
const U = require("../ui");

const refuse = (res) => res.status(403).send("Accès réservé à l'équipe");
const db = () => require("@saltcorn/data/db");
const S = () => db().getTenantSchema();
const duree = (ms) => { if (ms == null || isNaN(ms)) return "—"; const h = ms / 36e5; return h < 1 ? Math.round(h * 60) + " min" : h < 48 ? Math.round(h) + " h" : Math.round(h / 24) + " j"; };

const liste = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  await tables();
  const q = req.query || {};
  const w = [], p = [];
  const add = (sql, v) => { p.push(v); w.push(sql.replace("?", "$" + p.length)); };
  if (q.sans_reponse === "1") w.push("reponse_le is null");
  if (q.negociateur) add("negociateur = ?", q.negociateur);
  if (q.q) { p.push("%" + q.q + "%"); const n = "$" + p.length; w.push(`(nom ilike ${n} or email ilike ${n} or bien_ref ilike ${n} or reference ilike ${n})`); }
  const where = w.length ? "where " + w.join(" and ") : "";
  const page = Math.max(1, +q.page || 1);
  const total = +(await db().query(`select count(*) n from "${S()}".ld_dossiers ${where}`, p)).rows[0].n;
  const rows = (await db().query(`select * from "${S()}".ld_dossiers ${where} order by derniere_activite desc nulls last limit 50 offset ${(page - 1) * 50}`, p)).rows;
  const { conf } = await charger().catch(() => ({ conf: { routage: { personnes: [] } } }));
  const nom = new Map(((conf.routage && conf.routage.personnes) || []).map((x) => [String(x.id), x.nom]));
  const qs = (o) => "?" + new URLSearchParams({ ...q, ...o }).toString();
  const html = `<form class="ld-filtres" method="get"><input class="form-control form-control-sm" name="q" value="${esc(q.q || "")}" placeholder="Nom, e-mail, référence…">
${U.coche("sans_reponse", q.sans_reponse === "1", "sans réponse de l'équipe").replace('name="sans_reponse"', 'name="sans_reponse" value="1"')}<button class="btn btn-sm btn-primary">Filtrer</button> <span class="ld-mute">${total} conversation(s) · <span title="une conversation = un prospect × un bien : sa demande, ses relances et les réponses de l'agence">un prospect × un bien</span></span></form>
${U.table(["Dernière activité", "Prospect", "Bien", "Négociateur", "Mails", "Réponse de l'équipe"], rows.map((r) => [
    `<a href="/leads/dossier/${r.id}">${esc(dateFr(r.derniere_activite))}</a>`,
    `${esc(r.nom || "")}<br><small class="ld-mute">${esc(r.email || r.relais || r.telephone || "")}</small>`,
    `${esc(r.bien_ref || r.reference || "—")}<br><small class="ld-mute">${esc(r.portail || "")}</small>`,
    esc(nom.get(String(r.negociateur)) || r.negociateur || "—"), esc(r.nb_mails || 1),
    r.reponse_le ? `${U.pill("répondu", "ok")} <small class="ld-mute">en ${esc(duree(new Date(r.reponse_le) - new Date(r.premiere_demande)))}</small>` : U.pill("pas encore", Date.now() - new Date(r.premiere_demande) > 864e5 ? "ko" : "warn")]), "Aucune conversation.")}
<div class="ld-pages">${page > 1 ? `<a class="btn btn-sm btn-outline-secondary" href="${qs({ page: page - 1 })}">Précédents</a>` : ""}${page * 50 < total ? `<a class="btn btn-sm btn-outline-secondary" href="${qs({ page: page + 1 })}">Suivants</a>` : ""}</div>`;
  U.page(req, res, "Conversations", "dossiers", html);
};

const fiche = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  const t = await tables();
  const d = await t.dossiers.getRow({ id: +req.params.id });
  if (!d) return go(res, "/leads/dossiers", "Conversation introuvable", true);
  const evts = await t.evenements.getRows({ dossier: d.id }, { orderBy: "quand" });
  const leads = await t.leads.getRows({ dossier_id: d.id }, { orderBy: "recu_le" });
  const api = flowApi();
  const msgs = evts.map((e) => ({ type: e.type, role: e.role, auteur: e.auteur, via: e.via, date: e.quand, texte: e.texte }));
  const comment = api ? api.leads.conversation.commentaire(msgs, { max: 6000 }) : "";
  const fil = evts.map((e) => `<div style="margin:0 0 12px;padding:8px 10px;border-left:3px solid ${e.role === "equipe" ? "var(--ld-ok)" : "var(--ld-a)"};background:var(--ld-f);border-radius:4px">
<div class="ld-mute" style="font-size:12px">${esc(dateFr(e.quand) || "date inconnue")} · <b>${esc(e.auteur || "")}</b> ${e.role === "equipe" ? U.pill("agence", "ok") : e.via ? U.pill("via " + e.via, "info") : ""} ${U.pill(e.type, "mute")}${e.source === "citation" ? ' <span class="ld-mute">(recopié dans un mail suivant)</span>' : ""}</div>
<div style="white-space:pre-wrap;margin-top:4px">${esc(e.texte)}</div></div>`).join("");
  const html = `<div class="ld-grille ld-g2">
${U.carte("Conversation", fil || '<p class="ld-vide">Aucun message.</p>')}
<div>
${U.carte("Prospect et bien", `<dl class="ld-kv"><dt>Prospect</dt><dd>${esc(d.nom || "—")}</dd><dt>E-mail</dt><dd>${esc(d.email || "—")}</dd><dt>Relais du portail</dt><dd>${esc(d.relais || "—")}</dd><dt>Téléphone</dt><dd>${esc(d.telephone || "—")}</dd>
<dt>Bien</dt><dd>${esc(d.bien_ref || d.reference || "—")} ${d.bien_crm ? `<span class="ld-mute">(id ${esc(d.bien_crm)})</span>` : ""}</dd><dt>Négociateur</dt><dd>${esc(d.negociateur || "—")}</dd>
<dt>Contact CRM</dt><dd>${esc(d.contact_crm || "— (mode ombre)")}</dd><dt>Projet de recherche</dt><dd>${esc(d.recherche_crm || "—")}</dd><dt>Consentement</dt><dd>${d.consentement ? U.pill("posé", "ok") : U.pill("non", "mute")}</dd>
<dt>1re demande</dt><dd>${esc(dateFr(d.premiere_demande))}</dd><dt>1re réponse de l'équipe</dt><dd>${d.reponse_le ? esc(dateFr(d.reponse_le)) + " · " + esc(duree(new Date(d.reponse_le) - new Date(d.premiere_demande))) : U.pill("pas encore", "warn")}</dd></dl>`)}
${U.carte("Mails de la conversation", U.table(["Reçu", "Nature", "Statut"], leads.map((l) => [`<a href="/leads/l/${l.id}">${esc(dateFr(l.recu_le))}</a>`, esc(l.nature), U.badge(l.decision || l.statut)])))}
${U.carte("Commentaire écrit dans le CRM (projet de recherche)", `<pre class="ld-pre">${esc(comment)}</pre><p class="ld-mute" style="margin:6px 0 0">Reconstruit à chaque mail à partir de toute la conversation ; rien n'est ajouté en double.</p>`)}
</div></div>`;
  U.page(req, res, "Conversation · " + (d.nom || d.email || d.id), "dossiers", html);
};

/* Chiffres pour le tableau de bord : délai de première réponse, dossiers sans réponse. */
const chiffres = async () => {
  const r = (await db().query(`select count(*) filter (where cree_le > now() - interval '7 days') nouveaux,
    count(*) filter (where reponse_le is null and premiere_demande < now() - interval '24 hours' and premiere_demande > now() - interval '30 days') sans_reponse,
    percentile_cont(0.5) within group (order by extract(epoch from (reponse_le - premiere_demande))) filter (where reponse_le is not null and premiere_demande > now() - interval '30 days') mediane_s
    from "${S()}".ld_dossiers`)).rows[0] || {};
  return { nouveaux: +r.nouveaux || 0, sans_reponse: +r.sans_reponse || 0, mediane_ms: r.mediane_s != null ? +r.mediane_s * 1000 : null };
};

module.exports = { liste, fiche, chiffres, duree };
