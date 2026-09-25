/* Mise en page commune : onglets, messages, petits composants (badges, tableaux, chiffres). */
"use strict";
const { esc, VERSION } = require("./core");

const ONGLETS = [["", "Tableau de bord", "fas fa-gauge-high"], ["liste", "Leads", "fas fa-inbox"], ["dossiers", "Conversations", "fas fa-comments"], ["lecture", "Lecture des mails", "fas fa-wand-magic-sparkles"], ["envoi", "Envoi", "fas fa-paper-plane"], ["absences", "Absences", "fas fa-umbrella-beach"], ["demandes", "Demandes", "fas fa-clipboard-list"], ["reglages", "Réglages", "fas fa-sliders-h"], ["chaine", "Chaîne", "fas fa-diagram-project"], ["import", "Import", "fas fa-file-import"]];

const flash = (req) => { const q = req.query || {}; return q.ok ? `<div class="ld-flash ok">${esc(q.ok)}</div>` : q.err ? `<div class="ld-flash ko">${esc(q.err)}</div>` : ""; };

const page = (req, res, titre, actif, html, { bandeau = "" } = {}) => res.sendWrap({ title: titre + " · Leads", requestFluidLayout: true, headers: [{ css: `/dysizz-leads/a/${VERSION}/ld.css` }] }, {
  above: [{ type: "blank", isHTML: true, contents: `<div class="ld">
<nav class="ld-nav"><span class="ld-marque"><i class="fas fa-bullseye"></i>Leads</span>${ONGLETS.map(([u, l, i]) => `<a href="/leads${u ? "/" + u : ""}" class="${actif === u ? "on" : ""}"><i class="${i}"></i>${l}</a>`).join("")}</nav>
${bandeau}${flash(req)}<h1 class="ld-titre">${esc(titre)}</h1>${html}</div>`.replace(/\{\{/g, "&#123;&#123;").replace(/\}\}/g, "&#125;&#125;") }],
});

const STATUTS = { suivi: ["Suivi (réponse)", "info"], pret: ["Prêt", "ok"], a_verifier: ["À vérifier", "warn"], a_trier: ["À trier", "info"], ignore: ["Ignoré", "mute"], alerte: ["Alerte", "ko"], erreur: ["Erreur", "ko"], traite: ["Traité", "ok"] };
const badge = (statut) => { const [l, c] = STATUTS[statut] || [statut || "—", "mute"]; return `<span class="ld-badge ${c}">${esc(l)}</span>`; };
const pill = (texte, c = "mute") => `<span class="ld-badge ${c}">${esc(texte)}</span>`;
const kpi = (valeur, label, { ton = "", lien = "", detail = "" } = {}) => `<${lien ? `a href="${esc(lien)}"` : "div"} class="ld-kpi ${ton}"><b>${esc(valeur)}</b><span>${esc(label)}</span>${detail ? `<small>${esc(detail)}</small>` : ""}</${lien ? "a" : "div"}>`;
const table = (entetes, lignes, vide = "Rien pour l'instant.") => lignes.length
  ? `<div class="ld-table-wrap"><table class="ld-table"><thead><tr>${entetes.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${lignes.map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
  : `<p class="ld-vide">${vide}</p>`;
const carte = (titre, contenu, { actions = "", cls = "" } = {}) => `<section class="ld-carte ${cls}"><header><h2>${titre}</h2>${actions}</header>${contenu}</section>`;
const champ = (label, input, aide = "") => `<label class="ld-champ"><span>${label}</span>${input}${aide ? `<small>${aide}</small>` : ""}</label>`;
const input = (name, value = "", o = {}) => `<input class="form-control form-control-sm" name="${name}" value="${esc(value)}"${o.type ? ` type="${o.type}"` : ""}${o.placeholder ? ` placeholder="${esc(o.placeholder)}"` : ""}${o.required ? " required" : ""}${o.pattern ? ` pattern="${o.pattern}"` : ""}>`;
const select = (name, options, cur, o = {}) => `<select class="form-select form-select-sm" name="${name}"${o.required ? " required" : ""}>${options.map((x) => { const [v, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(v)}"${String(v) === String(cur) ? " selected" : ""}>${esc(l)}</option>`; }).join("")}</select>`;
const zone = (name, value = "", rows = 3, o = {}) => `<textarea class="form-control form-control-sm" name="${name}" rows="${rows}"${o.placeholder ? ` placeholder="${esc(o.placeholder)}"` : ""}>${esc(value)}</textarea>`;
const coche = (name, on, label) => `<label class="ld-coche"><input type="checkbox" name="${name}" ${on ? "checked" : ""}> ${label}</label>`;

const CSS = `
.ld{--ld-b:#d9dee7;--ld-f:#f6f8fb;--ld-t:#1d2733;--ld-m:#687385;--ld-a:#2457d6;--ld-ok:#137a3f;--ld-warn:#a15c00;--ld-ko:#b42318;--ld-info:#1f5f99;color:var(--ld-t);font-size:14px;max-width:1500px;margin:0 auto}
@media (prefers-color-scheme:dark){.ld{--ld-b:#324052;--ld-f:#1a2330;--ld-t:#e6ebf2;--ld-m:#9aa7b8;--ld-a:#6f9bff;--ld-ok:#4cc38a;--ld-warn:#f0b35a;--ld-ko:#ff7b72;--ld-info:#79b8ff}}
.ld-nav{display:flex;flex-wrap:wrap;gap:2px;align-items:center;border-bottom:1px solid var(--ld-b);margin:0 0 14px;padding-bottom:6px}
.ld-nav a{padding:6px 11px;border-radius:6px;color:var(--ld-m);text-decoration:none;font-weight:500}.ld-nav a i{margin-right:6px;opacity:.8}
.ld-nav a.on,.ld-nav a:hover{background:var(--ld-f);color:var(--ld-t)}.ld-marque{font-weight:700;margin-right:12px}.ld-marque i{color:var(--ld-a);margin-right:6px}
.ld-titre{font-size:20px;font-weight:650;margin:4px 0 14px}
.ld-bandeau{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;background:var(--ld-f);border:1px solid var(--ld-b);border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:13px}
.ld-bandeau b{font-weight:600}.ld-flash{padding:8px 12px;border-radius:6px;margin-bottom:10px}.ld-flash.ok{background:#e7f6ec;color:#0c5b2c}.ld-flash.ko{background:#fdecea;color:#8a1c12}
.ld-grille{display:grid;gap:12px}.ld-g2{grid-template-columns:repeat(auto-fit,minmax(380px,1fr))}.ld-g3{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}
.ld-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:12px}
.ld-kpi{display:flex;flex-direction:column;border:1px solid var(--ld-b);border-radius:8px;padding:10px 12px;text-decoration:none;color:inherit;background:transparent}
.ld-kpi b{font-size:24px;font-weight:650;line-height:1.1;font-variant-numeric:tabular-nums}.ld-kpi span{color:var(--ld-m);font-size:12.5px}.ld-kpi small{color:var(--ld-m);font-size:11.5px}
.ld-kpi.ok b{color:var(--ld-ok)}.ld-kpi.warn b{color:var(--ld-warn)}.ld-kpi.ko b{color:var(--ld-ko)}.ld-kpi.info b{color:var(--ld-info)}a.ld-kpi:hover{border-color:var(--ld-a)}
.ld-carte{border:1px solid var(--ld-b);border-radius:8px;margin-bottom:12px;overflow:hidden}.ld-carte>header{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid var(--ld-b);background:var(--ld-f)}
.ld-carte>header h2{font-size:14px;font-weight:650;margin:0}.ld-carte>:not(header){padding:10px 12px}.ld-carte>.ld-table-wrap{padding:0}
.ld-table-wrap{overflow-x:auto}.ld-table{width:100%;border-collapse:collapse;font-size:13px}.ld-table th{text-align:left;font-weight:600;color:var(--ld-m);font-size:12px;padding:7px 10px;border-bottom:1px solid var(--ld-b);white-space:nowrap}
.ld-table td{padding:7px 10px;border-bottom:1px solid var(--ld-b);vertical-align:top}.ld-table tr:last-child td{border-bottom:0}.ld-table tr:hover td{background:var(--ld-f)}
.ld-badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11.5px;font-weight:600;border:1px solid currentColor;white-space:nowrap}
.ld-badge.ok{color:var(--ld-ok)}.ld-badge.warn{color:var(--ld-warn)}.ld-badge.ko{color:var(--ld-ko)}.ld-badge.info{color:var(--ld-info)}.ld-badge.mute{color:var(--ld-m)}
.ld-vide{color:var(--ld-m);margin:0}.ld-mute{color:var(--ld-m)}.ld-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px}
.ld-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px 14px;align-items:start}.ld-champ{display:flex;flex-direction:column;gap:3px;margin:0}.ld-champ>span{font-size:12.5px;font-weight:600}.ld-champ small{color:var(--ld-m);font-size:11.5px}
.ld-coche{display:flex;gap:6px;align-items:center;margin:0;font-size:13px}.ld-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}
.ld-filtres{display:flex;flex-wrap:wrap;gap:8px;align-items:end;margin-bottom:10px}.ld-filtres .form-control,.ld-filtres .form-select{width:auto;min-width:150px}
.ld code{color:var(--ld-t);background:var(--ld-f);padding:0 4px;border-radius:3px;font-size:12.5px}
.ld-trace{margin:0;padding-left:24px;font-size:13px}.ld-trace li{margin:2px 0}.ld-kv{display:grid;grid-template-columns:minmax(120px,max-content) 1fr;gap:4px 14px;font-size:13px}.ld-kv dt{color:var(--ld-m);font-weight:500}.ld-kv dd{margin:0;word-break:break-word}
.ld-semaine td.abs{background:rgba(180,35,24,.08)}.ld-semaine td.hors{background:rgba(161,92,0,.08)}.ld-semaine td{font-size:12.5px}
.ld-board{display:grid;grid-template-columns:repeat(5,minmax(200px,1fr));gap:10px;overflow-x:auto}.ld-col{border:1px solid var(--ld-b);border-radius:8px;min-height:120px}.ld-col h3{font-size:13px;margin:0;padding:8px 10px;border-bottom:1px solid var(--ld-b);background:var(--ld-f)}
.ld-ticket{display:block;margin:8px;padding:8px 10px;border:1px solid var(--ld-b);border-radius:6px;text-decoration:none;color:inherit}.ld-ticket:hover{border-color:var(--ld-a)}.ld-ticket b{display:block;font-size:13px}
.ld-mail{width:100%;min-height:420px;border:1px solid var(--ld-b);border-radius:6px;background:#fff}.ld-pre{white-space:pre-wrap;font-size:12.5px;max-height:420px;overflow:auto;background:var(--ld-f);padding:10px;border-radius:6px;margin:0}
.ld-pages{display:flex;gap:6px;align-items:center;margin-top:8px}.ld-ombre{color:#fff;background:#5b4bc4;border-radius:4px;padding:1px 7px;font-weight:700;font-size:11.5px}.ld-reel{color:#fff;background:var(--ld-ko);border-radius:4px;padding:1px 7px;font-weight:700;font-size:11.5px}
.ld .btn-primary{background:var(--ld-a);border-color:var(--ld-a);color:#fff}.ld .btn-primary:hover{filter:brightness(1.08)}.ld .btn-outline-primary{color:var(--ld-a);border-color:var(--ld-a);background:transparent}.ld .btn-outline-primary:hover{background:var(--ld-a);color:#fff}
.ld .btn-link,.ld-carte a,.ld-table a{color:var(--ld-a)}.ld .btn-link:hover{color:var(--ld-t)}.ld-inline{display:inline-flex;gap:6px;align-items:center;margin:0}.ld-inline .form-select{width:auto}
@media (max-width:700px){.ld-kpi b{font-size:20px}.ld-g2,.ld-g3{grid-template-columns:1fr}.ld-board{grid-template-columns:repeat(5,80vw)}}
`;

module.exports = { page, badge, pill, kpi, table, carte, champ, input, select, zone, coche, CSS, STATUTS };
