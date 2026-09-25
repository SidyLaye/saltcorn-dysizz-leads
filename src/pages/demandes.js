/* Demandes : suivi des évolutions et incidents (Reçue → Prise en compte → En cours → Terminée → Mise en ligne).
   Urgence : Bloquant (alerte immédiate), Important (dans la journée), Confort (file normale). */
"use strict";
const { esc, peutVoir, isAdmin, hidden, go, dateFr } = require("../core");
const { tables, STATUTS_DEMANDE, URGENCES } = require("../schema");
const U = require("../ui");

const refuse = (res) => res.status(403).send("Accès réservé à l'équipe");
const ton = (u) => (u === "Bloquant" ? "ko" : u === "Important" ? "warn" : "mute");

/* Alerte immédiate pour un « Bloquant » : notification Saltcorn aux administrateurs. */
const alerter = async (d) => {
  try {
    const User = require("@saltcorn/data/models/user"), Notification = require("@saltcorn/data/models/notification");
    for (const u of await User.find({ role_id: 1 })) await Notification.create({ user_id: u.id, title: `Demande bloquante : ${d.titre}`, body: String(d.description || "").slice(0, 300), link: `/leads/demandes/${d.id}` });
  } catch (e) { /* notifications indisponibles : la demande reste en tête de liste */ }
};

const liste = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  const t = await tables();
  const D = await t.demandes.getRows({}, { orderBy: "cree_le", orderDesc: true });
  const ordre = { Bloquant: 0, Important: 1, Confort: 2 };
  const col = (s) => D.filter((d) => (d.statut || "Reçue") === s).sort((a, b) => (ordre[a.urgence] ?? 3) - (ordre[b.urgence] ?? 3))
    .map((d) => `<a class="ld-ticket" href="/leads/demandes/${d.id}"><b>${esc(d.titre)}</b>${U.pill(d.urgence || "Confort", ton(d.urgence))} <small class="ld-mute">${esc(dateFr(d.maj_le || d.cree_le, false))}</small></a>`).join("");
  const html = `<div class="ld-board">${STATUTS_DEMANDE.map((s) => `<div class="ld-col"><h3>${esc(s)} <span class="ld-mute">${D.filter((d) => (d.statut || "Reçue") === s).length}</span></h3>${col(s)}</div>`).join("")}</div>
${U.carte("Nouvelle demande", `<form method="post" action="/leads/demandes">${hidden(req)}<div class="ld-form">
${U.champ("Titre", U.input("titre", "", { required: true, placeholder: "ex. Les leads Properstar n'arrivent plus" }))}
${U.champ("Urgence", U.select("urgence", Object.entries(URGENCES).map(([k, v]) => [k, `${k} — ${v}`]), "Confort"))}
${U.champ("Description", U.zone("description", "", 4, { placeholder: "Ce qui se passe, depuis quand, un exemple (référence, mail…)" }))}</div>
<div class="ld-actions"><button class="btn btn-sm btn-primary">Envoyer la demande</button></div></form>`)}`;
  U.page(req, res, "Demandes", "demandes", html);
};

const creer = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  const b = req.body || {}, t = await tables();
  const titre = String(b.titre || "").trim().slice(0, 200);
  if (!titre) return go(res, "/leads/demandes", "Titre obligatoire", true);
  const urgence = Object.keys(URGENCES).includes(b.urgence) ? b.urgence : "Confort";
  const qui = (req.user && req.user.email) || "";
  const id = await t.demandes.insertRow({ titre, description: String(b.description || "").slice(0, 8000), urgence, statut: "Reçue", demandeur: qui, cree_le: new Date(), maj_le: new Date() });
  await t.etapes.insertRow({ demande: id, statut: "Reçue", quand: new Date(), note: `Urgence : ${urgence}`, par: qui });
  if (urgence === "Bloquant") await alerter({ id, titre, description: b.description });
  go(res, `/leads/demandes/${id}`, urgence === "Bloquant" ? "Demande envoyée — alerte immédiate" : "Demande envoyée");
};

const fiche = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  const t = await tables();
  const d = await t.demandes.getRow({ id: +req.params.id });
  if (!d) return go(res, "/leads/demandes", "Demande introuvable", true);
  const E = await t.etapes.getRows({ demande: d.id }, { orderBy: "quand" });
  const suivant = STATUTS_DEMANDE[Math.min(STATUTS_DEMANDE.indexOf(d.statut || "Reçue") + 1, STATUTS_DEMANDE.length - 1)];
  const html = `<div class="ld-actions" style="margin:-4px 0 12px">${U.pill(d.urgence, ton(d.urgence))} ${U.pill(d.statut || "Reçue", "info")} <span class="ld-mute">par ${esc(d.demandeur || "?")} le ${esc(dateFr(d.cree_le))}</span></div>
<div class="ld-grille ld-g2">${U.carte("Description", `<pre class="ld-pre">${esc(d.description || "—")}</pre>`)}
${U.carte("Suivi", U.table(["Date", "Étape", "Note", "Par"], E.map((e) => [esc(dateFr(e.quand)), esc(e.statut), esc(e.note || ""), esc(e.par || "")])) +
  (isAdmin(req) ? `<form method="post" action="/leads/demandes/${d.id}/etape" style="margin-top:10px">${hidden(req)}<div class="ld-form">${U.champ("Nouvelle étape", U.select("statut", STATUTS_DEMANDE, suivant))}${U.champ("Note", U.input("note", "", { placeholder: "ce qui a été fait" }))}</div><div class="ld-actions"><button class="btn btn-sm btn-primary">Mettre à jour</button></div></form>` : ""))}</div>
<a class="btn btn-sm btn-link" href="/leads/demandes">← Toutes les demandes</a>`;
  U.page(req, res, d.titre, "demandes", html);
};

const etape = async (req, res) => {
  if (!isAdmin(req)) return refuse(res);
  const b = req.body || {}, t = await tables();
  const statut = STATUTS_DEMANDE.includes(b.statut) ? b.statut : null;
  if (!statut) return go(res, `/leads/demandes/${req.params.id}`, "Statut inconnu", true);
  await t.demandes.updateRow({ statut, maj_le: new Date() }, +req.params.id);
  await t.etapes.insertRow({ demande: +req.params.id, statut, quand: new Date(), note: String(b.note || "").slice(0, 2000), par: (req.user && req.user.email) || "" });
  go(res, `/leads/demandes/${req.params.id}`, "Étape ajoutée");
};

module.exports = { liste, creer, fiche, etape, alerter };
