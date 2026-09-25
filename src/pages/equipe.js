/* Envoi (règles + bouton « tester »), équipe (temps plein / mi-temps), absences (vue semaine). */
"use strict";
const { esc, peutVoir, hidden, go, jour, flowApi } = require("../core");
const { tables } = require("../schema");
const { charger, liste } = require("../conf");
const U = require("../ui");

const refuse = (res) => res.status(403).send("Accès réservé à l'équipe");
const JOURS = [[1, "lun"], [2, "mar"], [3, "mer"], [4, "jeu"], [5, "ven"], [6, "sam"], [7, "dim"]];

/* Choix d'une personne ou d'une adresse libre : « p:<id> » ou « x@y ». */
const refOptions = (personnes, vide = "— personne —") => [["", vide], ...personnes.filter((p) => p.actif !== false).sort((a, b) => a.nom.localeCompare(b.nom)).map((p) => [`p:${p.id}`, `${p.nom} (${p.role === "assistante" ? "assistant(e)" : "négociateur"})`])];
const refChamp = (name, cur, personnes, label, aide) => {
  const estEmail = /@/.test(cur || "");
  return U.champ(label, `${U.select(name, refOptions(personnes), estEmail ? "" : cur || "")}<input class="form-control form-control-sm mt-1" name="${name}_email" value="${esc(estEmail ? cur : "")}" placeholder="…ou une adresse e-mail">`, aide);
};
const refLire = (b, name) => String(b[name + "_email"] || "").trim() || String(b[name] || "").trim();
const nomRef = (ref, P) => { if (!ref) return "—"; const m = String(ref).match(/^p:(\d+)$/); if (m) { const p = P.find((x) => x.id === +m[1]); return p ? p.nom : "?"; } return ref; };

/* ---------------- Envoi ---------------- */
const envoi = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  const t = await tables();
  const [P, R] = await Promise.all([t.personnes.getRows({}), t.regles.getRows({})]);
  const negos = P.filter((p) => p.role !== "assistante" && p.actif !== false).sort((a, b) => a.nom.localeCompare(b.nom));
  const q = req.query || {};
  let resultat = "";
  if (q.tester) {
    const { conf, idMoteur } = await charger();
    const p = P.find((x) => x.id === +q.tester);
    const d = flowApi().leads.destinataires(p ? idMoteur.get(p.id) : q.tester, q.date ? new Date(q.date + "T10:00:00") : new Date(), conf.routage);
    resultat = U.carte(`Le prochain lead de ${esc(p ? p.nom : q.tester)}${q.date ? " le " + esc(q.date) : " maintenant"} partirait à :`, U.table(["Adresse", "Rôle", "Pourquoi"], d.liste.map((z) => [`<b>${esc(z.email)}</b>`, esc((z.roles || [z.role]).join(", ")), esc(z.raison)])) + (d.trace.length ? `<ul class="ld-trace">${d.trace.map((z) => `<li>${esc(z)}</li>`).join("")}</ul>` : ""), { cls: "ld-resultat" });
  }
  const edit = q.regle ? R.find((r) => r.id === +q.regle) || {} : {};
  const form = `<form method="post" action="/leads/envoi/regle">${hidden(req)}<input type="hidden" name="id" value="${edit.id || ""}"><div class="ld-form">
${U.champ("Nom de la règle", U.input("libelle", edit.libelle || "", { required: true, placeholder: "ex. Sénégal : assistante seule" }))}
${U.champ("S'applique à", `${U.select("tous", [["", "des négociateurs choisis"], ["1", "tous les négociateurs"]], edit.tous ? "1" : "")}<select class="form-select form-select-sm mt-1" name="negociateurs" multiple size="5">${negos.map((p) => `<option value="p:${p.id}" ${liste(edit.negociateurs).includes("p:" + p.id) ? "selected" : ""}>${esc(p.nom)}</option>`).join("")}</select>`, "Ctrl/Cmd + clic pour en choisir plusieurs")}
${U.champ("Négociateur", U.select("couper_negociateur", [["", "reçoit le lead"], ["1", "ne reçoit pas le lead (coupé)"]], edit.couper_negociateur ? "1" : ""))}
${U.champ("Assistant(e)", U.select("assistante", [["garder", "garder la sienne"], ["couper", "couper"], ["remplacer", "remplacer par…"]], edit.assistante || "garder"))}
${refChamp("assistante_remplacante", edit.assistante_remplacante, P, "Remplaçant(e) de l'assistant(e)", "si « remplacer par… »")}
${U.champ("Adresses en plus", U.zone("adresses_libres", String(edit.adresses_libres || "").split(/[\s,;]+/).join("\n"), 3, { placeholder: "une adresse par ligne" }), "sans limite, toute combinaison")}
${U.champ("", U.coche("actif", edit.actif !== false, "règle active"))}</div>
<div class="ld-actions"><button class="btn btn-sm btn-primary">${edit.id ? "Enregistrer" : "Ajouter la règle"}</button>${edit.id ? `<a class="btn btn-sm btn-link" href="/leads/envoi">Annuler</a>` : ""}</div></form>`;
  const html = `${U.carte("Tester : où partirait le prochain lead ?", `<form class="ld-filtres" method="get">${U.select("tester", [["", "Choisir un négociateur"], ...negos.map((p) => [p.id, p.nom])], q.tester || "", { required: true })}<input class="form-control form-control-sm" type="date" name="date" value="${esc(q.date || "")}"><button class="btn btn-sm btn-primary">Tester</button><span class="ld-mute">Le siège reçoit toujours. Congés et mi-temps sont pris en compte.</span></form>`)}
${resultat}
${U.carte("Règles d'envoi", U.table(["Règle", "Pour", "Négociateur", "Assistant(e)", "En plus", ""], R.map((r) => [esc(r.libelle) + (r.actif === false ? " " + U.pill("inactive") : ""), r.tous ? "tous" : esc(liste(r.negociateurs).map((x) => nomRef(x, P)).join(", ")), r.couper_negociateur ? U.pill("coupé", "warn") : "reçoit", esc(r.assistante === "remplacer" ? "remplacée par " + nomRef(r.assistante_remplacante, P) : r.assistante || "garder"), esc(liste(r.adresses_libres).join(", ")),
  `<a href="/leads/envoi?regle=${r.id}">modifier</a> · <form method="post" action="/leads/envoi/regle/${r.id}/supprimer" style="display:inline">${hidden(req)}<button class="btn btn-link btn-sm p-0">supprimer</button></form>`]), "Aucune règle : chaque négociateur reçoit ses leads avec son assistant(e), plus le siège."))}
${U.carte(edit.id ? "Modifier la règle" : "Nouvelle règle", form)}
${U.carte("Équipe", U.table(["Nom", "Rôle", "E-mail", "Assistant(e)", "Temps", ""], P.sort((a, b) => a.nom.localeCompare(b.nom)).map((p) => [esc(p.nom) + (p.actif === false ? " " + U.pill("inactif") : ""), p.role === "assistante" ? "assistant(e)" : "négociateur", esc(p.email), esc(p.assistante ? (P.find((x) => x.id === p.assistante) || {}).nom : ""), p.temps === "mi_temps" ? U.pill("mi-temps : " + liste(p.jours).map((j) => (JOURS.find((x) => x[0] === +j) || [])[1]).join(" "), "info") : "temps plein", `<a href="/leads/personne/${p.id}">régler</a>`]), "Aucune personne : importe-les (onglet Import) ou ajoute-les."), { actions: '<a class="btn btn-sm btn-outline-secondary" href="/leads/personne/nouvelle">Ajouter</a>' })}`;
  U.page(req, res, "Envoi des leads", "envoi", html);
};
const regleSave = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  const b = req.body || {}, t = await tables();
  const negs = [].concat(b.negociateurs || []).join(",");
  const row = { libelle: String(b.libelle || "").slice(0, 200), tous: b.tous === "1", negociateurs: negs, couper_negociateur: b.couper_negociateur === "1", assistante: ["garder", "couper", "remplacer"].includes(b.assistante) ? b.assistante : "garder", assistante_remplacante: refLire(b, "assistante_remplacante"), adresses_libres: liste(b.adresses_libres).filter((e) => /@/.test(e)).join(", "), actif: b.actif === "on", maj_le: new Date() };
  if (!row.libelle) return go(res, "/leads/envoi", "Donne un nom à la règle", true);
  if (!row.tous && !negs) return go(res, "/leads/envoi", "Choisis au moins un négociateur (ou « tous »)", true);
  if (row.assistante === "remplacer" && !row.assistante_remplacante) return go(res, "/leads/envoi", "Choisis qui remplace l'assistant(e)", true);
  if (b.id) await t.regles.updateRow(row, +b.id); else await t.regles.insertRow(row);
  go(res, "/leads/envoi", "Règle enregistrée");
};
const regleSuppr = async (req, res) => { if (!peutVoir(req)) return refuse(res); const t = await tables(); await t.regles.deleteRows({ id: +req.params.id }); go(res, "/leads/envoi", "Règle supprimée"); };

/* ---------------- Personne ---------------- */
const personne = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  const t = await tables();
  const P = await t.personnes.getRows({});
  const p = req.params.id === "nouvelle" ? { actif: true, role: "negociateur", temps: "plein" } : P.find((x) => x.id === +req.params.id);
  if (!p) return go(res, "/leads/envoi", "Personne introuvable", true);
  const abs = p.id ? await t.absences.getRows({ personne: p.id }, { orderBy: "debut", orderDesc: true }) : [];
  const jours = liste(p.jours).map(Number);
  const html = `${U.carte("Fiche", `<form method="post" action="/leads/personne">${hidden(req)}<input type="hidden" name="id" value="${p.id || ""}"><div class="ld-form">
${U.champ("Nom", U.input("nom", p.nom || "", { required: true }))}${U.champ("E-mail", U.input("email", p.email || "", { type: "email" }))}
${U.champ("Rôle", U.select("role", [["negociateur", "négociateur"], ["assistante", "assistant(e)"]], p.role))}${U.champ("Identifiant CRM", U.input("crm_id", p.crm_id || ""), "ex. user_id Immofacile")}
${U.champ("Assistant(e)", U.select("assistante", [["", "— aucun(e) —"], ...P.filter((x) => x.role === "assistante" && x.id !== p.id).map((x) => [x.id, x.nom])], p.assistante || ""))}
${U.champ("Temps de travail", U.select("temps", [["plein", "temps plein"], ["mi_temps", "mi-temps (jours choisis)"]], p.temps || "plein"))}
${U.champ("Jours travaillés (mi-temps)", `<div class="ld-actions" style="margin:0">${JOURS.map(([n, l]) => U.coche("j" + n, jours.includes(n), l)).join("")}</div>`, "ex. lundi à mercredi")}
${refChamp("remplacant_hors_jours", p.remplacant_hors_jours, P.filter((x) => x.id !== p.id), "Remplaçant les autres jours", "reçoit les leads les jours non travaillés")}
${U.champ("", U.coche("actif", p.actif !== false, "actif(ve)"))}</div><div class="ld-actions"><button class="btn btn-sm btn-primary">Enregistrer</button><a class="btn btn-sm btn-link" href="/leads/envoi">Retour</a></div></form>`)}
${p.id ? U.carte("Congés et absences", U.table(["Du", "Au", "Relais", "Motif", ""], abs.map((a) => [esc(a.debut), esc(a.fin || "…"), esc(nomRef(a.remplacant, P)), esc(a.motif || "congés"), `<form method="post" action="/leads/absences/${a.id}/supprimer">${hidden(req)}<input type="hidden" name="retour" value="/leads/personne/${p.id}"><button class="btn btn-link btn-sm p-0">supprimer</button></form>`]), "Aucune absence.") + formAbsence(req, P, p.id, `/leads/personne/${p.id}`)) : ""}`;
  U.page(req, res, p.nom || "Nouvelle personne", "envoi", html);
};
const personneSave = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  const b = req.body || {}, t = await tables();
  const row = { nom: String(b.nom || "").trim().slice(0, 150), email: String(b.email || "").trim().toLowerCase(), role: b.role === "assistante" ? "assistante" : "negociateur", crm_id: String(b.crm_id || "").trim(), assistante: +b.assistante || null, temps: b.temps === "mi_temps" ? "mi_temps" : "plein", jours: JOURS.filter(([n]) => b["j" + n] === "on").map(([n]) => n).join(","), remplacant_hors_jours: refLire(b, "remplacant_hors_jours"), actif: b.actif === "on" };
  if (!row.nom) return go(res, "/leads/envoi", "Nom obligatoire", true);
  if (row.temps === "mi_temps" && !row.jours) return go(res, `/leads/personne/${b.id || "nouvelle"}`, "Choisis les jours travaillés", true);
  const id = b.id ? (await t.personnes.updateRow(row, +b.id), +b.id) : await t.personnes.insertRow(row);
  go(res, `/leads/personne/${id}`, "Enregistré");
};

/* ---------------- Absences ---------------- */
const formAbsence = (req, P, personneId, retour) => `<form method="post" action="/leads/absences" style="margin-top:10px">${hidden(req)}<input type="hidden" name="retour" value="${esc(retour)}"><div class="ld-form">
${personneId ? `<input type="hidden" name="personne" value="${personneId}">` : U.champ("Qui ?", U.select("personne", [["", "Choisir"], ...P.filter((p) => p.actif !== false).sort((a, b) => a.nom.localeCompare(b.nom)).map((p) => [p.id, p.nom])], "", { required: true }))}
${U.champ("Du", U.input("debut", "", { type: "date", required: true }))}${U.champ("Au (inclus)", U.input("fin", "", { type: "date" }), "vide = jusqu'à nouvel ordre")}
${refChamp("remplacant", "", P.filter((p) => p.id !== personneId), "Les leads vont à", "négociateur, assistant(e) ou adresse libre")}
${U.champ("Motif", U.select("motif", ["congés", "maladie", "formation", "autre"], "congés"))}</div><div class="ld-actions"><button class="btn btn-sm btn-primary">Ajouter l'absence</button><span class="ld-mute">Pendant l'absence : aucune notification pour la personne ; retour automatique à la normale après la date de fin.</span></div></form>`;

const absences = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  const t = await tables();
  const P = await t.personnes.getRows({});
  const A = await t.absences.getRows({}, { orderBy: "debut" });
  const q = req.query || {};
  const base = q.semaine ? new Date(q.semaine + "T12:00:00Z") : new Date();
  const lundi = new Date(base); lundi.setUTCDate(lundi.getUTCDate() - ((lundi.getUTCDay() + 6) % 7));
  const jours7 = [...Array(7)].map((_, i) => { const d = new Date(lundi); d.setUTCDate(lundi.getUTCDate() + i); return d; });
  const { conf, idMoteur } = await charger();
  const L = flowApi().leads;
  const lignes = [];
  for (const p of P.filter((x) => x.actif !== false).sort((a, b) => a.nom.localeCompare(b.nom))) {
    const pm = conf.routage.personnes.find((x) => x.id === idMoteur.get(p.id));
    const cells = jours7.map((d) => { const r = L.disponibilite(conf.routage, pm, d); return r.dispo ? "" : `<td class="${r.type === "absence" ? "abs" : "hors"}">${r.type === "absence" ? "absent(e)" : "ne travaille pas"}<br><small>→ ${esc(r.remplacant ? (r.remplacant.email || (conf.routage.personnes.find((x) => x.id === r.remplacant.personne) || {}).nom) : "personne")}</small></td>`; });
    if (cells.some(Boolean)) lignes.push(`<tr><td><a href="/leads/personne/${p.id}">${esc(p.nom)}</a></td>${cells.map((c) => c || "<td></td>").join("")}</tr>`);
  }
  const prec = new Date(lundi); prec.setUTCDate(prec.getUTCDate() - 7);
  const suiv = new Date(lundi); suiv.setUTCDate(suiv.getUTCDate() + 7);
  const aVenir = A.filter((a) => !a.fin || a.fin >= jour(new Date()));
  const html = `${U.carte(`Semaine du ${lundi.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} : qui est absent, qui prend le relais`, `<div class="ld-table-wrap"><table class="ld-table ld-semaine"><thead><tr><th>Personne</th>${jours7.map((d) => `<th>${d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })}</th>`).join("")}</tr></thead><tbody>${lignes.join("") || '<tr><td colspan="8" class="ld-mute">Tout le monde est là cette semaine.</td></tr>'}</tbody></table></div>`, { actions: `<span><a class="btn btn-sm btn-outline-secondary" href="?semaine=${jour(prec)}">‹</a> <a class="btn btn-sm btn-outline-secondary" href="/leads/absences">cette semaine</a> <a class="btn btn-sm btn-outline-secondary" href="?semaine=${jour(suiv)}">›</a></span>` })}
${U.carte("Absences en cours et à venir", U.table(["Qui", "Du", "Au", "Relais", "Motif", ""], aVenir.map((a) => [esc((P.find((p) => p.id === a.personne) || {}).nom || "?"), esc(a.debut), esc(a.fin || "…"), esc(nomRef(a.remplacant, P)), esc(a.motif || ""), `<form method="post" action="/leads/absences/${a.id}/supprimer">${hidden(req)}<input type="hidden" name="retour" value="/leads/absences"><button class="btn btn-link btn-sm p-0">supprimer</button></form>`]), "Aucune absence prévue."))}
${U.carte("Nouvelle absence", formAbsence(req, P, null, "/leads/absences"))}`;
  U.page(req, res, "Absences", "absences", html);
};
const absenceSave = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  const b = req.body || {}, t = await tables();
  const retour = /^\/leads\//.test(b.retour || "") ? b.retour : "/leads/absences";
  const row = { personne: +b.personne, debut: String(b.debut || ""), fin: String(b.fin || ""), remplacant: refLire(b, "remplacant"), motif: String(b.motif || "congés").slice(0, 40), actif: true };
  if (!row.personne || !/^\d{4}-\d{2}-\d{2}$/.test(row.debut)) return go(res, retour, "Personne et date de début obligatoires", true);
  if (row.fin && row.fin < row.debut) return go(res, retour, "La fin est avant le début", true);
  if (row.remplacant === `p:${row.personne}`) return go(res, retour, "Une personne ne peut pas se remplacer elle-même", true);
  await t.absences.insertRow(row);
  go(res, retour, "Absence ajoutée" + (row.remplacant ? "" : " (sans relais : ses leads iront seulement à l'assistant(e) et au siège)"));
};
const absenceSuppr = async (req, res) => {
  if (!peutVoir(req)) return refuse(res);
  const t = await tables(); await t.absences.deleteRows({ id: +req.params.id });
  const r = (req.body || {}).retour; go(res, /^\/leads\//.test(r || "") ? r : "/leads/absences", "Absence supprimée");
};

module.exports = { envoi, regleSave, regleSuppr, personne, personneSave, absences, absenceSave, absenceSuppr };
