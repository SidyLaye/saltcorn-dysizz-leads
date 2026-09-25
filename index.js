/* dysizz-leads 1.1.0 — FICHIER GÉNÉRÉ par tools/build.mjs depuis src/. Ne pas modifier à la main. */
"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// ../src/core.js
var require_core = __commonJS({
  "../src/core.js"(exports2, module2) {
    "use strict";
    var PLUGIN2 = "dysizz-leads";
    var VERSION2 = true ? "1.1.0" : "dev";
    var isAdmin = (req) => !!(req && req.user && req.user.role_id === 1);
    var peutVoir2 = (req) => !!(req && req.user && req.user.role_id <= 40);
    var esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
    var csrf = (req) => {
      try {
        return req.csrfToken ? req.csrfToken() : "";
      } catch (e) {
        return "";
      }
    };
    var hidden = (req) => `<input type="hidden" name="_csrf" value="${esc(csrf(req))}">`;
    var go = (res, url, msg, bad) => res.redirect(`${url}${url.includes("?") ? "&" : "?"}${bad ? "err" : "ok"}=${encodeURIComponent(msg)}`);
    var flowApi = () => {
      const st = require("@saltcorn/data/db/state").getState();
      for (const p of Object.values(st.plugins || {})) if (p && p.dysizz_flow_api && p.dysizz_flow_api.leads) return p.dysizz_flow_api;
      return null;
    };
    var dateFr = (d, heure = true) => {
      if (!d) return "";
      const x = new Date(d);
      return isNaN(x) ? "" : x.toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric", ...heure ? { hour: "2-digit", minute: "2-digit" } : {} });
    };
    var jour = (d) => new Date(d).toISOString().slice(0, 10);
    module2.exports = { PLUGIN: PLUGIN2, VERSION: VERSION2, isAdmin, peutVoir: peutVoir2, esc, csrf, hidden, go, flowApi, dateFr, jour };
  }
});

// ../src/ui.js
var require_ui = __commonJS({
  "../src/ui.js"(exports2, module2) {
    "use strict";
    var { esc, VERSION: VERSION2 } = require_core();
    var ONGLETS = [["", "Tableau de bord", "fas fa-gauge-high"], ["liste", "Leads", "fas fa-inbox"], ["dossiers", "Dossiers", "fas fa-comments"], ["envoi", "Envoi", "fas fa-paper-plane"], ["absences", "Absences", "fas fa-umbrella-beach"], ["demandes", "Demandes", "fas fa-clipboard-list"], ["reglages", "R\xE9glages", "fas fa-sliders-h"], ["chaine", "Cha\xEEne", "fas fa-diagram-project"], ["import", "Import", "fas fa-file-import"]];
    var flash = (req) => {
      const q = req.query || {};
      return q.ok ? `<div class="ld-flash ok">${esc(q.ok)}</div>` : q.err ? `<div class="ld-flash ko">${esc(q.err)}</div>` : "";
    };
    var page = (req, res, titre, actif, html, { bandeau = "" } = {}) => res.sendWrap({ title: titre + " \xB7 Leads", requestFluidLayout: true, headers: [{ css: `/dysizz-leads/a/${VERSION2}/ld.css` }] }, {
      above: [{ type: "blank", isHTML: true, contents: `<div class="ld">
<nav class="ld-nav"><span class="ld-marque"><i class="fas fa-bullseye"></i>Leads</span>${ONGLETS.map(([u, l, i]) => `<a href="/leads${u ? "/" + u : ""}" class="${actif === u ? "on" : ""}"><i class="${i}"></i>${l}</a>`).join("")}</nav>
${bandeau}${flash(req)}<h1 class="ld-titre">${esc(titre)}</h1>${html}</div>`.replace(/\{\{/g, "&#123;&#123;").replace(/\}\}/g, "&#125;&#125;") }]
    });
    var STATUTS = { suivi: ["Suivi (r\xE9ponse)", "info"], pret: ["Pr\xEAt", "ok"], a_verifier: ["\xC0 v\xE9rifier", "warn"], a_trier: ["\xC0 trier", "info"], ignore: ["Ignor\xE9", "mute"], alerte: ["Alerte", "ko"], erreur: ["Erreur", "ko"], traite: ["Trait\xE9", "ok"] };
    var badge = (statut) => {
      const [l, c] = STATUTS[statut] || [statut || "\u2014", "mute"];
      return `<span class="ld-badge ${c}">${esc(l)}</span>`;
    };
    var pill = (texte, c = "mute") => `<span class="ld-badge ${c}">${esc(texte)}</span>`;
    var kpi = (valeur, label, { ton = "", lien = "", detail = "" } = {}) => `<${lien ? `a href="${esc(lien)}"` : "div"} class="ld-kpi ${ton}"><b>${esc(valeur)}</b><span>${esc(label)}</span>${detail ? `<small>${esc(detail)}</small>` : ""}</${lien ? "a" : "div"}>`;
    var table = (entetes, lignes, vide = "Rien pour l'instant.") => lignes.length ? `<div class="ld-table-wrap"><table class="ld-table"><thead><tr>${entetes.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${lignes.map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : `<p class="ld-vide">${vide}</p>`;
    var carte = (titre, contenu, { actions = "", cls = "" } = {}) => `<section class="ld-carte ${cls}"><header><h2>${titre}</h2>${actions}</header>${contenu}</section>`;
    var champ = (label, input2, aide = "") => `<label class="ld-champ"><span>${label}</span>${input2}${aide ? `<small>${aide}</small>` : ""}</label>`;
    var input = (name, value = "", o = {}) => `<input class="form-control form-control-sm" name="${name}" value="${esc(value)}"${o.type ? ` type="${o.type}"` : ""}${o.placeholder ? ` placeholder="${esc(o.placeholder)}"` : ""}${o.required ? " required" : ""}${o.pattern ? ` pattern="${o.pattern}"` : ""}>`;
    var select = (name, options, cur, o = {}) => `<select class="form-select form-select-sm" name="${name}"${o.required ? " required" : ""}>${options.map((x) => {
      const [v, l] = Array.isArray(x) ? x : [x, x];
      return `<option value="${esc(v)}"${String(v) === String(cur) ? " selected" : ""}>${esc(l)}</option>`;
    }).join("")}</select>`;
    var zone = (name, value = "", rows = 3, o = {}) => `<textarea class="form-control form-control-sm" name="${name}" rows="${rows}"${o.placeholder ? ` placeholder="${esc(o.placeholder)}"` : ""}>${esc(value)}</textarea>`;
    var coche = (name, on, label) => `<label class="ld-coche"><input type="checkbox" name="${name}" ${on ? "checked" : ""}> ${label}</label>`;
    var CSS2 = `
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
.ld-trace{margin:0;padding-left:18px;font-size:13px}.ld-trace li{margin:2px 0}.ld-kv{display:grid;grid-template-columns:minmax(120px,max-content) 1fr;gap:4px 14px;font-size:13px}.ld-kv dt{color:var(--ld-m);font-weight:500}.ld-kv dd{margin:0;word-break:break-word}
.ld-semaine td.abs{background:rgba(180,35,24,.08)}.ld-semaine td.hors{background:rgba(161,92,0,.08)}.ld-semaine td{font-size:12.5px}
.ld-board{display:grid;grid-template-columns:repeat(5,minmax(200px,1fr));gap:10px;overflow-x:auto}.ld-col{border:1px solid var(--ld-b);border-radius:8px;min-height:120px}.ld-col h3{font-size:13px;margin:0;padding:8px 10px;border-bottom:1px solid var(--ld-b);background:var(--ld-f)}
.ld-ticket{display:block;margin:8px;padding:8px 10px;border:1px solid var(--ld-b);border-radius:6px;text-decoration:none;color:inherit}.ld-ticket:hover{border-color:var(--ld-a)}.ld-ticket b{display:block;font-size:13px}
.ld-mail{width:100%;min-height:420px;border:1px solid var(--ld-b);border-radius:6px;background:#fff}.ld-pre{white-space:pre-wrap;font-size:12.5px;max-height:420px;overflow:auto;background:var(--ld-f);padding:10px;border-radius:6px;margin:0}
.ld-pages{display:flex;gap:6px;align-items:center;margin-top:8px}.ld-ombre{color:#fff;background:#5b4bc4;border-radius:4px;padding:1px 7px;font-weight:700;font-size:11.5px}.ld-reel{color:#fff;background:var(--ld-ko);border-radius:4px;padding:1px 7px;font-weight:700;font-size:11.5px}
.ld .btn-primary{background:var(--ld-a);border-color:var(--ld-a);color:#fff}.ld .btn-primary:hover{filter:brightness(1.08)}.ld .btn-outline-primary{color:var(--ld-a);border-color:var(--ld-a);background:transparent}.ld .btn-outline-primary:hover{background:var(--ld-a);color:#fff}
.ld .btn-link,.ld-carte a,.ld-table a{color:var(--ld-a)}.ld .btn-link:hover{color:var(--ld-t)}.ld-inline{display:inline-flex;gap:6px;align-items:center;margin:0}.ld-inline .form-select{width:auto}
@media (max-width:700px){.ld-kpi b{font-size:20px}.ld-g2,.ld-g3{grid-template-columns:1fr}.ld-board{grid-template-columns:repeat(5,80vw)}}
`;
    module2.exports = { page, badge, pill, kpi, table, carte, champ, input, select, zone, coche, CSS: CSS2, STATUTS };
  }
});

// ../src/schema.js
var require_schema = __commonJS({
  "../src/schema.js"(exports2, module2) {
    "use strict";
    var T = {
      reglages: { name: "ld_reglages", desc: "R\xE9glages du client (une seule ligne)", fields: [
        ["crm", "String"],
        ["crm_reglages", "String"],
        ["prefixe_secrets", "String"],
        ["mode", "String"],
        ["envoi_mails", "Bool"],
        ["consentement_actif", "Bool"],
        ["consentement_libelle", "String"],
        ["utiliser_relais", "Bool"],
        ["domaines_agence", "String"],
        ["sites", "String"],
        ["objets_campagnes", "String"],
        ["id_crm_liens", "String"],
        ["origines_portail", "String"],
        ["boite_ecouteur", "String"],
        ["maj_le", "Date"],
        ["etapes", "String"],
        ["notifier_relances", "String"],
        ["marges_projet", "String"],
        ["commentaire_max", "Integer"],
        ["retention_jours", "Integer"],
        ["action_lead", "String"],
        ["catalogue_synchro_le", "Date"],
        ["catalogue_etat", "String"]
      ] },
      agences: { name: "ld_agences", desc: "Agences", fields: [["nom", "String", { required: true }], ["crm_id", "String"], ["boites", "String"], ["negociateur_defaut", "String"], ["actif", "Bool"]] },
      personnes: { name: "ld_personnes", desc: "N\xE9gociateurs et assistant(e)s", fields: [
        ["nom", "String", { required: true }],
        ["email", "String"],
        ["role", "String"],
        ["crm_id", "String"],
        ["agence_crm_id", "String"],
        ["assistante", "Integer"],
        ["temps", "String"],
        ["jours", "String"],
        ["remplacant_hors_jours", "String"],
        ["telephone", "String"],
        ["actif", "Bool"],
        ["alias", "String"]
      ] },
      regles: { name: "ld_regles_envoi", desc: "R\xE8gles d'envoi par n\xE9gociateur ou groupe", fields: [
        ["libelle", "String", { required: true }],
        ["tous", "Bool"],
        ["negociateurs", "String"],
        ["couper_negociateur", "Bool"],
        ["assistante", "String"],
        ["assistante_remplacante", "String"],
        ["adresses_libres", "String"],
        ["actif", "Bool"],
        ["maj_le", "Date"]
      ] },
      absences: { name: "ld_absences", desc: "Cong\xE9s et absences", fields: [["personne", "Integer", { required: true }], ["debut", "String", { required: true }], ["fin", "String"], ["remplacant", "String"], ["motif", "String"], ["note", "String"], ["actif", "Bool"]] },
      origines: { name: "ld_origines", desc: "Origines du CRM (portails, sites)", fields: [["code", "String", { required: true }], ["libelle", "String"], ["crm_id", "String"]] },
      siege: { name: "ld_siege", desc: "Adresses qui re\xE7oivent toujours", fields: [["email", "String", { required: true }], ["libelle", "String"], ["actif", "Bool"]] },
      leads: { name: "ld_leads", desc: "Leads trait\xE9s (un par mail)", fields: [
        ["mail_id", "Integer"],
        ["message_id", "String"],
        ["recu_le", "Date"],
        ["traite_le", "Date"],
        ["expediteur", "String"],
        ["objet", "String"],
        ["portail", "String"],
        ["nature", "String"],
        ["statut", "String"],
        ["decision", "String"],
        ["contact_nom", "String"],
        ["contact_email", "String"],
        ["contact_tel", "String"],
        ["contact_crm", "String"],
        ["contact_action", "String"],
        ["reference", "String"],
        ["bien_crm", "String"],
        ["bien_ref_crm", "String"],
        ["bien_methode", "String"],
        ["bien_confiance", "String"],
        ["agence", "String"],
        ["negociateur", "String"],
        ["origine", "String"],
        ["site", "String"],
        ["destinataires", "String"],
        ["motifs", "String"],
        ["alertes", "String"],
        ["mode", "String"],
        ["actions", "String"],
        ["dossier", "String"],
        ["duree_ms", "Integer"],
        ["ancien_statut", "String"],
        ["ancien_bien", "String"],
        ["ancien_destinataires", "String"],
        ["dossier_id", "Integer"],
        ["role", "String"]
      ] },
      dossiers: { name: "ld_dossiers", desc: "Dossiers (un prospect \xD7 un bien)", index: ["email", "relais", "tel9", "bien_crm"], fields: [
        ["relais", "String"],
        ["email", "String"],
        ["telephone", "String"],
        ["tel9", "String"],
        ["reference", "String"],
        ["bien_crm", "String"],
        ["bien_ref", "String"],
        ["contact_crm", "String"],
        ["recherche_crm", "String"],
        ["consentement", "Bool"],
        ["negociateur", "String"],
        ["agence", "String"],
        ["portail", "String"],
        ["nom", "String"],
        ["statut", "String"],
        ["premiere_demande", "Date"],
        ["reponse_le", "Date"],
        ["derniere_activite", "Date"],
        ["nb_mails", "Integer"],
        ["cree_le", "Date"],
        ["maj_le", "Date"]
      ] },
      evenements: { name: "ld_evenements", desc: "Messages des dossiers (conversation)", index: ["dossier"], fields: [
        ["dossier", "Integer", { required: true }],
        ["mail_id", "Integer"],
        ["type", "String"],
        ["role", "String"],
        ["auteur", "String"],
        ["via", "String"],
        ["quand", "Date"],
        ["texte", "String"],
        ["source", "String"],
        ["empreinte", "String"]
      ] },
      biens: { name: "ld_biens", desc: "Catalogue local des biens du CRM (synchronis\xE9)", index: ["crm_id", "reference"], fields: [
        ["crm_id", "String", { required: true }],
        ["reference", "String"],
        ["prix", "Float"],
        ["surface", "Float"],
        ["pieces", "Integer"],
        ["chambres", "Integer"],
        ["type", "String"],
        ["ville", "String"],
        ["code_postal", "String"],
        ["negociateur", "String"],
        ["agence", "String"],
        ["proprietaire", "String"],
        ["supprime", "Bool"],
        ["synchro_le", "Date"]
      ] },
      portails: { name: "ld_portails", desc: "Portails d\xE9clar\xE9s par le client (sans code)", fields: [
        ["nom", "String", { required: true }],
        ["domaines", "String"],
        ["objets_lead", "String"],
        ["objets_non_lead", "String"],
        ["libelles", "String"],
        ["reference", "String"],
        ["nature", "String"],
        ["actif", "Bool"]
      ] },
      demandes: { name: "ld_demandes", desc: "Demandes d'\xE9volution et incidents", fields: [
        ["titre", "String", { required: true }],
        ["description", "String"],
        ["urgence", "String"],
        ["statut", "String"],
        ["demandeur", "String"],
        ["cree_le", "Date"],
        ["maj_le", "Date"]
      ] },
      etapes: { name: "ld_demande_etapes", desc: "Historique des demandes", fields: [["demande", "Integer", { required: true }], ["statut", "String"], ["quand", "Date"], ["note", "String"], ["par", "String"]] }
    };
    var STATUTS_DEMANDE = ["Re\xE7ue", "Prise en compte", "En cours de traitement", "Termin\xE9e", "Mise en ligne"];
    var URGENCES = { Bloquant: "alerte imm\xE9diate", Important: "dans la journ\xE9e", Confort: "file normale" };
    var MAILS = "ld_mails";
    var pret = /* @__PURE__ */ new Map();
    var creer = async () => {
      const Table = require("@saltcorn/data/models/table"), Field = require("@saltcorn/data/models/field");
      const st = require("@saltcorn/data/db/state").getState();
      const out = {};
      for (const [k, d] of Object.entries(T)) {
        let t = Table.findOne({ name: d.name });
        if (!t) {
          t = await Table.create(d.name, { min_role_read: 40, min_role_write: 40, description: "dysizz-leads \xB7 " + d.desc });
          for (const [name, type, o] of d.fields) await Field.create({ table: t, name, label: name, type, ...o || {} });
          await st.refresh_tables(true);
          t = Table.findOne({ name: d.name });
        }
        const have = new Set(t.getFields().map((f) => f.name));
        const manque = d.fields.filter(([n]) => !have.has(n));
        for (const [name, type, o] of manque) await Field.create({ table: t, name, label: name, type, ...o || {}, required: false });
        if (manque.length) {
          await st.refresh_tables(true);
          t = Table.findOne({ name: d.name });
        }
        const db = require("@saltcorn/data/db");
        if (!db.isSQLite) for (const f of d.index || []) await db.query(`create index if not exists "${d.name}_${f}_idx" on "${db.getTenantSchema()}"."${d.name}" ("${f}")`);
        out[k] = t;
      }
      return out;
    };
    var tables = async () => {
      const key = require("@saltcorn/data/db").getTenantSchema();
      if (!pret.has(key)) pret.set(key, creer().catch((e) => {
        pret.delete(key);
        throw e;
      }));
      return pret.get(key);
    };
    module2.exports = { T, tables, STATUTS_DEMANDE, URGENCES, MAILS };
  }
});

// ../src/conf.js
var require_conf = __commonJS({
  "../src/conf.js"(exports2, module2) {
    "use strict";
    var { tables } = require_schema();
    var liste = (s) => String(s || "").split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean);
    var json = (s, def) => {
      if (!s) return def;
      if (typeof s === "object") return s;
      try {
        return JSON.parse(s);
      } catch (e) {
        return def;
      }
    };
    var DEFAUT = {
      crm: "immofacile",
      mode: "ombre",
      envoi_mails: false,
      consentement_actif: true,
      consentement_libelle: "Demande de contact via {portail} du {date}",
      utiliser_relais: true,
      id_crm_liens: "immo-facile-(\\d{8})\\b\n/fiches/[\\w-]*_(\\d{8})/",
      prefixe_secrets: "LEADS_CRM",
      notifier_relances: "negociateur",
      commentaire_max: 6e3,
      retention_jours: 0
    };
    var reglages = async () => {
      const t = await tables();
      const r = (await t.reglages.getRows({}, { orderBy: "id", limit: 1 }))[0] || {};
      const o = { ...DEFAUT };
      for (const [k, v] of Object.entries(r)) if (v !== null && v !== void 0 && v !== "") o[k] = v;
      return o;
    };
    var charger = async () => {
      const t = await tables();
      const R2 = await reglages();
      const [agences, personnes, regles, absences, origines, siege, portails] = await Promise.all([t.agences.getRows({}), t.personnes.getRows({}), t.regles.getRows({}), t.absences.getRows({}), t.origines.getRows({}), t.siege.getRows({}), t.portails.getRows({})]);
      const lignes = (s) => String(s || "").split("\n").map((x) => x.trim()).filter(Boolean);
      const idMoteur = new Map(personnes.map((p) => [p.id, p.crm_id ? String(p.crm_id) : "p" + p.id]));
      const ref = (s) => {
        const v = String(s || "").trim();
        if (!v) return null;
        const m = v.match(/^p:(\d+)$/);
        if (m) return idMoteur.has(+m[1]) ? { personne: idMoteur.get(+m[1]) } : null;
        return /@/.test(v) ? { email: v } : null;
      };
      const conf = {
        domaines_agence: liste(R2.domaines_agence),
        sites: json(R2.sites, []),
        objets_campagnes: String(R2.objets_campagnes || "").split("\n").map((x) => x.trim()).filter(Boolean),
        id_crm_liens: String(R2.id_crm_liens || "").split("\n").map((x) => x.trim()).filter(Boolean),
        origines_portail: json(R2.origines_portail, {}),
        utiliser_relais: R2.utiliser_relais !== false,
        /* étapes coupées par le client (tout est actif par défaut) */
        etapes: json(R2.etapes, {}),
        notifier_relances: R2.notifier_relances || "negociateur",
        marges_projet: json(R2.marges_projet, {}),
        commentaire: { max: +R2.commentaire_max || 6e3 },
        action_lead: (() => {
          const v = R2.action_lead || json(R2.crm_reglages, {}).action_lead;
          return v ? isFinite(+v) ? +v : v : null;
        })(),
        portails: portails.filter((p) => p.actif !== false).map((p) => ({ id: "declare_" + p.id, nom: p.nom, domaines: liste(p.domaines), objets_lead: lignes(p.objets_lead), objets_non_lead: lignes(p.objets_non_lead), libelles: json(p.libelles, {}), reference: p.reference || null, nature: p.nature || "lead" })),
        agences: agences.filter((a) => a.actif !== false).map((a) => ({ id: String(a.crm_id || "a" + a.id), nom: a.nom, boites: liste(a.boites), negociateur_defaut: a.negociateur_defaut ? (ref(a.negociateur_defaut) || {}).personne || a.negociateur_defaut : null })),
        origines: origines.map((o) => ({ id: o.crm_id ? isFinite(+o.crm_id) ? +o.crm_id : o.crm_id : null, code: o.code, libelle: o.libelle })),
        consentement: { actif: !!R2.consentement_actif, libelle: R2.consentement_libelle },
        routage: {
          personnes: personnes.map((p) => ({
            id: idMoteur.get(p.id),
            ligne: p.id,
            nom: p.nom,
            alias: String(p.alias || "").split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean),
            email: p.email,
            role: p.role || "negociateur",
            actif: p.actif !== false,
            agence_id: p.agence_crm_id,
            assistante_id: p.assistante ? idMoteur.get(p.assistante) : null,
            temps: p.temps || "plein",
            jours: liste(p.jours).map(Number).filter((n) => n >= 1 && n <= 7),
            remplacant_hors_jours: ref(p.remplacant_hors_jours)
          })),
          regles: regles.filter((r) => r.actif !== false).map((r) => ({
            id: "r" + r.id,
            libelle: r.libelle,
            cible: r.tous ? { tous: true } : { negociateurs: liste(r.negociateurs).map((x) => (ref(x) || {}).personne || x) },
            couper_negociateur: !!r.couper_negociateur,
            assistante: r.assistante || "garder",
            assistante_remplacante: ref(r.assistante_remplacante),
            adresses_libres: liste(r.adresses_libres)
          })),
          absences: absences.filter((a) => a.actif !== false).map((a) => ({ personne_id: idMoteur.get(a.personne), debut: a.debut, fin: a.fin, remplacant: ref(a.remplacant), motif: a.motif || "cong\xE9s" })),
          siege: siege.filter((s) => s.actif !== false).map((s) => s.email)
        }
      };
      const crm = { type: R2.crm, reglages: json(R2.crm_reglages, {}), prefixe: R2.prefixe_secrets || "LEADS_CRM", mode: R2.mode === "reel" ? "reel" : "ombre" };
      return { conf, crm, reglages: R2, idMoteur };
    };
    module2.exports = { charger, reglages, liste, json, DEFAUT };
  }
});

// ../src/fil.js
var require_fil = __commonJS({
  "../src/fil.js"(exports2, module2) {
    "use strict";
    var { tables } = require_schema();
    var tel9 = (t) => String(t || "").replace(/\D/g, "").slice(-9);
    var MAX_MESSAGES = 300;
    var versMoteur = (row, evts) => ({
      id: row.id,
      relais: row.relais,
      email: row.email,
      telephone: row.telephone,
      reference: row.reference,
      bien_id: row.bien_crm || null,
      bien_ref: row.bien_ref,
      contact_id: row.contact_crm || null,
      recherche_id: row.recherche_crm || null,
      consentement: !!row.consentement,
      negociateur: row.negociateur || null,
      agence_id: row.agence || null,
      portail: row.portail,
      nom: row.nom,
      statut: row.statut,
      premiere_demande: row.premiere_demande,
      reponse_le: row.reponse_le,
      nb_mails: row.nb_mails || 0,
      cree_le: row.cree_le,
      maj_le: row.maj_le,
      messages: evts.map((e) => ({ type: e.type, role: e.role, auteur: e.auteur, via: e.via, date: e.quand ? new Date(e.quand).toISOString() : null, texte: e.texte, source: e.source, empreinte: e.empreinte }))
    });
    var trouver = async (c = {}) => {
      const t = await tables();
      const ou = [];
      if (c.relais) ou.push({ relais: String(c.relais).toLowerCase() });
      if (c.email) ou.push({ email: String(c.email).toLowerCase() });
      if (c.telephone && tel9(c.telephone).length === 9) ou.push({ tel9: tel9(c.telephone) });
      if (!ou.length) return [];
      const rows = await t.dossiers.getRows({ or: ou }, { orderBy: "maj_le", orderDesc: true, limit: 20 });
      const out = [];
      for (const r of rows) out.push(versMoteur(r, await t.evenements.getRows({ dossier: r.id }, { orderBy: "quand", limit: MAX_MESSAGES })));
      return out;
    };
    var enregistrer = (api) => async (d, exec, quand = /* @__PURE__ */ new Date(), mailId = null) => {
      if (!d || !d.dossier) return null;
      const t = await tables();
      const ancienRow = d.dossier.id ? await t.dossiers.getRow({ id: +d.dossier.id }) : null;
      const ancien = ancienRow ? versMoteur(ancienRow, await t.evenements.getRows({ dossier: ancienRow.id }, { orderBy: "quand", limit: MAX_MESSAGES })) : null;
      const n = api.leads.dossiers.miseAJour(ancien, d, exec || {}, quand);
      const ligne = {
        relais: n.relais ? String(n.relais).toLowerCase() : null,
        email: n.email ? String(n.email).toLowerCase() : null,
        telephone: n.telephone || null,
        tel9: n.telephone ? tel9(n.telephone) : null,
        reference: n.reference || null,
        bien_crm: n.bien_id ? String(n.bien_id) : null,
        bien_ref: n.bien_ref || null,
        contact_crm: n.contact_id && !/^ombre-/.test(String(n.contact_id)) ? String(n.contact_id) : null,
        recherche_crm: n.recherche_id ? String(n.recherche_id) : null,
        consentement: !!n.consentement,
        negociateur: n.negociateur ? String(n.negociateur) : null,
        agence: n.agence_id ? String(n.agence_id) : null,
        portail: n.portail || null,
        nom: n.nom ? String(n.nom).slice(0, 200) : null,
        statut: n.statut || "ouvert",
        premiere_demande: n.premiere_demande || null,
        reponse_le: n.reponse_le || null,
        derniere_activite: quand,
        nb_mails: n.nb_mails || 1,
        maj_le: /* @__PURE__ */ new Date()
      };
      let id = ancienRow && ancienRow.id;
      if (id) await t.dossiers.updateRow(ligne, id);
      else id = await t.dossiers.insertRow({ ...ligne, cree_le: /* @__PURE__ */ new Date() });
      const connues = new Set((ancien && ancien.messages || []).map((m) => m.empreinte));
      for (const m of n.messages || []) {
        if (!m.empreinte || connues.has(m.empreinte)) continue;
        connues.add(m.empreinte);
        await t.evenements.insertRow({ dossier: id, mail_id: m.source === "mail" ? mailId : null, type: m.type, role: m.role, auteur: String(m.auteur || "").slice(0, 200), via: m.via || null, quand: m.date || null, texte: String(m.texte || "").slice(0, 2e4), source: m.source, empreinte: m.empreinte });
      }
      return id;
    };
    module2.exports = { trouver, enregistrer, tel9, versMoteur };
  }
});

// ../src/catalogue.js
var require_catalogue = __commonJS({
  "../src/catalogue.js"(exports2, module2) {
    "use strict";
    var { tables } = require_schema();
    var { flowApi } = require_core();
    var { charger } = require_conf();
    var G = globalThis[Symbol.for("dysizz-leads.catalogue")] || (globalThis[Symbol.for("dysizz-leads.catalogue")] = { cache: /* @__PURE__ */ new Map() });
    var tenant = () => {
      try {
        return require("@saltcorn/data/db").getTenantSchema();
      } catch (e) {
        return "public";
      }
    };
    var oublier = () => G.cache.delete(tenant());
    var versLigne = (b) => ({
      crm_id: String(b.id),
      reference: b.reference || null,
      prix: +b.prix || null,
      surface: +b.surface || null,
      pieces: +b.pieces || null,
      chambres: +b.chambres || null,
      type: b.type || null,
      ville: b.ville || null,
      code_postal: b.code_postal || null,
      negociateur: b.negociateur_id != null ? String(b.negociateur_id) : null,
      agence: b.agence_id != null ? String(b.agence_id) : null,
      proprietaire: b.proprietaire_id != null ? String(b.proprietaire_id) : null,
      supprime: false,
      synchro_le: /* @__PURE__ */ new Date()
    });
    var versBien = (r) => ({ id: isFinite(+r.crm_id) ? +r.crm_id : r.crm_id, reference: r.reference || "", prix: r.prix, surface: r.surface, pieces: r.pieces, chambres: r.chambres, type: r.type, ville: r.ville, code_postal: r.code_postal, negociateur_id: r.negociateur, agence_id: r.agence, proprietaire_id: r.proprietaire });
    var enregistrerBiens = async (biens) => {
      const t = await tables();
      for (const b of biens) {
        if (!b || b.id == null) continue;
        const ex = await t.biens.getRow({ crm_id: String(b.id) });
        if (ex) await t.biens.updateRow(versLigne(b), ex.id);
        else await t.biens.insertRow(versLigne(b));
      }
      oublier();
    };
    var crmDuClient = async (modeForce) => {
      const api = flowApi();
      if (!api) throw new Error("dysizz-flow 2.4 ou plus r\xE9cent est n\xE9cessaire");
      const { crm, conf } = await charger();
      return { api, conf, crm, client: api.crmDepuisCoffre(crm.type, crm.reglages, crm.prefixe, modeForce || "ombre") };
    };
    var synchroniser = async ({ complet = false } = {}) => {
      const { api, client } = await crmDuClient("ombre");
      if (!client.catalogue) return { ok: false, message: "ce CRM ne sait pas donner son catalogue" };
      return api.verrou.sous("catalogue", async () => {
        const t = await tables();
        const R2 = (await t.reglages.getRows({}, { orderBy: "id", limit: 1 }))[0];
        const depuis = !complet && R2 && R2.catalogue_synchro_le ? new Date(new Date(R2.catalogue_synchro_le).getTime() - 10 * 6e4) : null;
        const debut = /* @__PURE__ */ new Date();
        let n = 0;
        const vus = /* @__PURE__ */ new Set();
        for await (const lot of client.catalogue({ depuis })) {
          await enregistrerBiens(lot);
          n += lot.length;
          lot.forEach((b) => vus.add(String(b.id)));
        }
        if (!depuis) {
          const tous = await t.biens.getRows({ supprime: false });
          for (const r of tous) if (!vus.has(String(r.crm_id))) await t.biens.updateRow({ supprime: true }, r.id);
        }
        const etat = `${depuis ? "delta" : "complet"} : ${n} bien(s) le ${debut.toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}`;
        if (R2) await t.reglages.updateRow({ catalogue_synchro_le: debut, catalogue_etat: etat }, R2.id);
        oublier();
        return { ok: true, n, complet: !depuis, message: etat };
      }, { attente_ms: 1e3 });
    };
    var evenementBien = async (type, id) => {
      const t = await tables();
      if (/DELETE/i.test(type)) {
        const ex = await t.biens.getRow({ crm_id: String(id) });
        if (ex) await t.biens.updateRow({ supprime: true, synchro_le: /* @__PURE__ */ new Date() }, ex.id);
        oublier();
        return "supprim\xE9";
      }
      const { client } = await crmDuClient("ombre");
      const b = await client.bienParId(id);
      if (b) await enregistrerBiens([b]);
      return b ? "\xE0 jour" : "introuvable";
    };
    var biensLocaux = async () => {
      const k = tenant(), c = G.cache.get(k);
      if (c && Date.now() - c.t < 6e4) return c.biens;
      const t = await tables();
      const biens = (await t.biens.getRows({ supprime: false })).map(versBien);
      G.cache.set(k, { t: Date.now(), biens });
      return biens;
    };
    var avecCatalogue = async (crm) => {
      const biens = await biensLocaux().catch(() => []);
      if (!biens.length) return crm;
      const api = flowApi();
      const local = api.leads.ADAPTATEURS.memoire.creer({ biens });
      return {
        ...crm,
        catalogue_local: biens.length,
        bienParId: async (id) => await local.bienParId(id) || crm.bienParId(id).catch(() => null),
        biensParReference: async (ref) => {
          const l = await local.biensParReference(ref);
          return l.length ? l : crm.biensParReference(ref).catch(() => []);
        },
        biensParCriteres: (q, o) => local.biensParCriteres(q, o)
      };
    };
    module2.exports = { synchroniser, evenementBien, avecCatalogue, biensLocaux, enregistrerBiens, oublier };
  }
});

// ../src/dossier.js
var require_dossier = __commonJS({
  "../src/dossier.js"(exports2, module2) {
    "use strict";
    var { tables, MAILS } = require_schema();
    var { charger } = require_conf();
    var { flowApi } = require_core();
    var fil = require_fil();
    var { avecCatalogue } = require_catalogue();
    var courte = (v, n = 900) => String(v == null ? "" : v).slice(0, n);
    var sansCommentaire = (a) => a && a.donnees && a.donnees.comment ? { ...a, donnees: { ...a.donnees, comment: `(${a.donnees.comment.length} caract\xE8res)` } } : a;
    var versLigne = (d, mail = {}) => {
      const x = d.extraction || {}, c = x.contact || {}, b = d.bien || null;
      const ex = d.execution || {};
      return {
        mail_id: mail.id || null,
        message_id: courte(mail.message_id, 300),
        recu_le: mail.date_envoi || mail.recu_le || /* @__PURE__ */ new Date(),
        traite_le: /* @__PURE__ */ new Date(),
        expediteur: courte(mail.expediteur, 300),
        objet: courte(mail.objet, 400),
        portail: x.portail || "",
        nature: x.nature || "",
        statut: d.statut,
        role: d.role || "",
        contact_nom: courte([c.prenom, c.nom].filter(Boolean).join(" ") || c.nom_complet, 200),
        contact_email: c.email || c.email_relais || "",
        contact_tel: c.telephone || "",
        contact_crm: ex.contactId && !/^ombre-/.test(String(ex.contactId)) ? String(ex.contactId) : d.contact && d.contact.id ? String(d.contact.id) : "",
        contact_action: d.contact && d.contact.action || "",
        reference: x.bien && (x.bien.reference || x.bien.id_crm || x.bien.reference_portail) || "",
        bien_crm: b ? String(b.id) : "",
        bien_ref_crm: b ? String(b.reference || "") : "",
        bien_methode: d.rapprochement && d.rapprochement.methode || "",
        bien_confiance: d.rapprochement && d.rapprochement.confiance || "",
        agence: d.agence ? d.agence.nom : "",
        negociateur: d.negociateur ? String(d.negociateur) : "",
        origine: d.origine ? d.origine.libelle || d.origine.code : "",
        site: x.site || "",
        destinataires: d.destinataires ? d.destinataires.liste.map((l) => l.email).sort().join(", ") : "",
        motifs: (d.motifs || []).join(" \xB7 "),
        alertes: (d.alertes || []).join(" \xB7 "),
        mode: ex.mode || "ombre",
        actions: (d.actions || []).map((a) => a.op).join(", "),
        dossier: JSON.stringify({ ...d, fil: d.fil ? { ...d.fil, messages_dossier: void 0, nb_messages_dossier: (d.fil.messages_dossier || []).length } : void 0, actions: (d.actions || []).map((a) => sansCommentaire({ ...a, preuves: a.preuves && a.preuves.map((p) => p.nom) })) }).slice(0, 2e5),
        duree_ms: d.duree_ms || 0
      };
    };
    var enregistrer = async (d, mail, dossierId = null) => {
      const t = await tables();
      const ligne = { ...versLigne(d, mail), dossier_id: dossierId };
      const ex = mail && mail.id ? await t.leads.getRow({ mail_id: mail.id }) : null;
      if (ex) {
        await t.leads.updateRow({ ...ligne, decision: ex.decision || "", ancien_statut: ex.ancien_statut, ancien_bien: ex.ancien_bien, ancien_destinataires: ex.ancien_destinataires }, ex.id);
        return ex.id;
      }
      return t.leads.insertRow(ligne);
    };
    var versMoteur = (mail) => ({ expediteur: mail.expediteur, destinataire: mail.destinataire, objet: mail.objet, texte: mail.corps_texte, html: mail.corps_html, date: mail.date_envoi, message_id: mail.message_id, in_reply_to: mail.in_reply_to, references: mail.references_fil, source_eml: mail.source_eml || null });
    var cleVerrou = (api, m, conf, mailId) => {
      try {
        const r = api.leads.extraire(m, conf);
        const texte = api.leads.texte.texteMail({ texte: m.texte, html: m.html });
        const k = api.leads.conversation.cles(r, texte, conf);
        const v = k.relais || k.email || k.telephone && String(k.telephone).replace(/\D/g, "").slice(-9);
        return v ? "dossier:" + String(v).toLowerCase() : "mail:" + mailId;
      } catch (e) {
        return "mail:" + mailId;
      }
    };
    var traiterMail = async (mailId, { forcerOmbre = false } = {}) => {
      const api = flowApi();
      if (!api) throw new Error("dysizz-flow 2.4 ou plus r\xE9cent est n\xE9cessaire");
      const Table = require("@saltcorn/data/models/table");
      const tm = Table.findOne({ name: MAILS });
      const mail = tm && await tm.getRow({ id: +mailId });
      if (!mail) throw new Error("mail introuvable");
      const { conf, crm } = await charger();
      const mode = forcerOmbre ? "ombre" : crm.mode;
      const client = await avecCatalogue(api.crmDepuisCoffre(crm.type, crm.reglages, crm.prefixe, mode));
      const m = versMoteur(mail);
      return api.verrou.sous(cleVerrou(api, m, conf, mail.id), async () => {
        const d = await api.leads.traiter(m, client, conf, { dossiers: { trouver: fil.trouver } });
        d.execution = { ...await api.leads.executer(d, client, { mode }), mode };
        if (client.notees) d.execution.ecritures_notees = client.notees.map(sansCommentaire);
        const garder = d.dossier && !(d.statut === "a_trier" && !d.dossier.existant);
        const dossierId = garder ? await fil.enregistrer(api)(d, d.execution, new Date(mail.date_envoi || Date.now()), mail.id) : null;
        const id = await enregistrer(d, mail, dossierId);
        return { id, dossier_id: dossierId, statut: d.statut, dossier: d };
      });
    };
    var retraiter = (mailId, o) => traiterMail(mailId, o);
    module2.exports = { enregistrer, retraiter, traiterMail, versLigne, versMoteur };
  }
});

// ../src/installer.js
var require_installer = __commonJS({
  "../src/installer.js"(exports2, module2) {
    "use strict";
    var { tables, MAILS } = require_schema();
    var { flowApi } = require_core();
    var ECOUTEUR = "leads";
    var WF = {
      name: "ld_traitement",
      when: "DzfMailRecu",
      channel: ECOUTEUR,
      version: 2,
      description: "dysizz-leads v2 : chaque mail re\xE7u par l'\xE9couteur \xAB leads \xBB est trait\xE9 une seule fois (dossier prospect \xD7 bien, catalogue local, CRM selon le mode). Mode ombre par d\xE9faut. Aucun mail n'est envoy\xE9.",
      steps: [
        { name: "une_fois", action_name: "dzf_idempotence", configuration: { cle: "ld-{{id}}", duree_h: 720 } },
        { name: "traiter", action_name: "dzx_leads_traiter", configuration: { id: "{{id}}" } }
      ]
    };
    var aJour = async () => {
      const Trigger = require("@saltcorn/data/models/trigger");
      const t = Trigger.findOne({ name: WF.name });
      return !!(t && String(t.description || "").startsWith("dysizz-leads v" + WF.version));
    };
    var manque = () => {
      const st = require("@saltcorn/data/db/state").getState();
      const need = ["dzf_idempotence", "dzx_leads_traiter"];
      return need.filter((a) => !st.actions || !st.actions[a]);
    };
    var installer = async ({ reecrire = false } = {}) => {
      const log = [];
      await tables();
      log.push("tables ld_* pr\xEAtes");
      const api = flowApi();
      if (!api) throw new Error("dysizz-flow 2.4 (ou plus r\xE9cent) doit \xEAtre install\xE9");
      await api.ecouteurs.tableDest(MAILS);
      log.push(`table ${MAILS} pr\xEAte (mails re\xE7us)`);
      const m = manque();
      if (m.length) throw new Error("blocs manquants : " + m.join(", ") + " (mets \xE0 jour dysizz-flow puis recharge)");
      const Trigger = require("@saltcorn/data/models/trigger"), WS = require("@saltcorn/data/models/workflow_step"), db = require("@saltcorn/data/db");
      let t = Trigger.findOne({ name: WF.name });
      const def = { name: WF.name, description: WF.description, action: "Workflow", when_trigger: WF.when, channel: WF.channel, configuration: {}, min_role: 1 };
      if (!t) {
        t = await Trigger.create(def);
        t = Trigger.findOne({ name: WF.name }) || t;
        log.push("workflow ld_traitement cr\xE9\xE9");
      } else if (reecrire || !await aJour()) {
        await Trigger.update(t.id, def);
        log.push("workflow ld_traitement r\xE9\xE9crit");
      } else {
        log.push("workflow ld_traitement d\xE9j\xE0 l\xE0 (gard\xE9 tel quel)");
      }
      if (reecrire || !(await WS.find({ trigger_id: t.id })).length || !(await WS.find({ trigger_id: t.id, action_name: "dzx_leads_traiter" })).length) {
        await db.deleteWhere("_sc_workflow_steps", { trigger_id: t.id });
        WF.steps.forEach((s, i) => {
          s.next_step = WF.steps[i + 1] ? WF.steps[i + 1].name : "";
        });
        for (let i = 0; i < WF.steps.length; i++) {
          const s = WF.steps[i];
          await WS.create({ trigger_id: t.id, name: s.name, action_name: s.action_name, configuration: s.configuration, next_step: s.next_step, only_if: "", initial_step: i === 0 });
        }
      }
      try {
        await require("@saltcorn/data/db/state").getState().refresh_triggers(true);
      } catch (e) {
      }
      return log;
    };
    var regler_ecouteur = async ({ serveur, port, utilisateur, secret, actif }) => {
      const api = flowApi();
      const Table = require("@saltcorn/data/models/table");
      const E2 = Table.findOne({ name: "dzf_ecouteurs" });
      if (!E2) throw new Error("dysizz-flow n'a pas encore cr\xE9\xE9 ses tables : ouvre une fois /dysizz-flow/ecouteurs");
      const row = { nom: ECOUTEUR, serveur, port: +port || 993, utilisateur, secret: secret || "LEADS_MAIL_MDP", dossier: "INBOX", table_dest: MAILS, marquer_lu: false, actif: !!actif };
      const ex = await E2.getRow({ nom: ECOUTEUR });
      if (ex) await E2.updateRow(row, ex.id);
      else await E2.insertRow({ ...row, dernier_uid: 0, recus: 0 });
      await api.ecouteurs.demarrerTous();
      return row;
    };
    var etat_ecouteur = async () => {
      const Table = require("@saltcorn/data/models/table");
      const E2 = Table.findOne({ name: "dzf_ecouteurs" });
      return E2 ? E2.getRow({ nom: ECOUTEUR }) : null;
    };
    module2.exports = { installer, regler_ecouteur, etat_ecouteur, ECOUTEUR, WF, manque, aJour };
  }
});

// ../src/pages/dossiers.js
var require_dossiers = __commonJS({
  "../src/pages/dossiers.js"(exports2, module2) {
    "use strict";
    var { esc, peutVoir: peutVoir2, go, dateFr, flowApi } = require_core();
    var { tables } = require_schema();
    var { charger } = require_conf();
    var U = require_ui();
    var refuse = (res) => res.status(403).send("Acc\xE8s r\xE9serv\xE9 \xE0 l'\xE9quipe");
    var db = () => require("@saltcorn/data/db");
    var S = () => db().getTenantSchema();
    var duree = (ms) => {
      if (ms == null || isNaN(ms)) return "\u2014";
      const h = ms / 36e5;
      return h < 1 ? Math.round(h * 60) + " min" : h < 48 ? Math.round(h) + " h" : Math.round(h / 24) + " j";
    };
    var liste = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      await tables();
      const q = req.query || {};
      const w = [], p = [];
      const add = (sql, v) => {
        p.push(v);
        w.push(sql.replace("?", "$" + p.length));
      };
      if (q.sans_reponse === "1") w.push("reponse_le is null");
      if (q.negociateur) add("negociateur = ?", q.negociateur);
      if (q.q) {
        p.push("%" + q.q + "%");
        const n = "$" + p.length;
        w.push(`(nom ilike ${n} or email ilike ${n} or bien_ref ilike ${n} or reference ilike ${n})`);
      }
      const where = w.length ? "where " + w.join(" and ") : "";
      const page = Math.max(1, +q.page || 1);
      const total = +(await db().query(`select count(*) n from "${S()}".ld_dossiers ${where}`, p)).rows[0].n;
      const rows = (await db().query(`select * from "${S()}".ld_dossiers ${where} order by derniere_activite desc nulls last limit 50 offset ${(page - 1) * 50}`, p)).rows;
      const { conf } = await charger().catch(() => ({ conf: { routage: { personnes: [] } } }));
      const nom = new Map((conf.routage && conf.routage.personnes || []).map((x) => [String(x.id), x.nom]));
      const qs = (o) => "?" + new URLSearchParams({ ...q, ...o }).toString();
      const html = `<form class="ld-filtres" method="get"><input class="form-control form-control-sm" name="q" value="${esc(q.q || "")}" placeholder="Nom, e-mail, r\xE9f\xE9rence\u2026">
${U.coche("sans_reponse", q.sans_reponse === "1", "sans r\xE9ponse de l'\xE9quipe").replace('name="sans_reponse"', 'name="sans_reponse" value="1"')}<button class="btn btn-sm btn-primary">Filtrer</button> <span class="ld-mute">${total} dossier(s)</span></form>
${U.table(["Derni\xE8re activit\xE9", "Prospect", "Bien", "N\xE9gociateur", "Mails", "R\xE9ponse de l'\xE9quipe"], rows.map((r) => [
        `<a href="/leads/dossier/${r.id}">${esc(dateFr(r.derniere_activite))}</a>`,
        `${esc(r.nom || "")}<br><small class="ld-mute">${esc(r.email || r.relais || r.telephone || "")}</small>`,
        `${esc(r.bien_ref || r.reference || "\u2014")}<br><small class="ld-mute">${esc(r.portail || "")}</small>`,
        esc(nom.get(String(r.negociateur)) || r.negociateur || "\u2014"),
        esc(r.nb_mails || 1),
        r.reponse_le ? `${U.pill("r\xE9pondu", "ok")} <small class="ld-mute">en ${esc(duree(new Date(r.reponse_le) - new Date(r.premiere_demande)))}</small>` : U.pill("pas encore", Date.now() - new Date(r.premiere_demande) > 864e5 ? "ko" : "warn")
      ]), "Aucun dossier.")}
<div class="ld-pages">${page > 1 ? `<a class="btn btn-sm btn-outline-secondary" href="${qs({ page: page - 1 })}">Pr\xE9c\xE9dents</a>` : ""}${page * 50 < total ? `<a class="btn btn-sm btn-outline-secondary" href="${qs({ page: page + 1 })}">Suivants</a>` : ""}</div>`;
      U.page(req, res, "Dossiers", "dossiers", html);
    };
    var fiche = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      const t = await tables();
      const d = await t.dossiers.getRow({ id: +req.params.id });
      if (!d) return go(res, "/leads/dossiers", "Dossier introuvable", true);
      const evts = await t.evenements.getRows({ dossier: d.id }, { orderBy: "quand" });
      const leads = await t.leads.getRows({ dossier_id: d.id }, { orderBy: "recu_le" });
      const api = flowApi();
      const msgs = evts.map((e) => ({ type: e.type, role: e.role, auteur: e.auteur, via: e.via, date: e.quand, texte: e.texte }));
      const comment = api ? api.leads.conversation.commentaire(msgs, { max: 6e3 }) : "";
      const fil = evts.map((e) => `<div style="margin:0 0 12px;padding:8px 10px;border-left:3px solid ${e.role === "equipe" ? "var(--ld-ok)" : "var(--ld-a)"};background:var(--ld-f);border-radius:4px">
<div class="ld-mute" style="font-size:12px">${esc(dateFr(e.quand) || "date inconnue")} \xB7 <b>${esc(e.auteur || "")}</b> ${e.role === "equipe" ? U.pill("agence", "ok") : e.via ? U.pill("via " + e.via, "info") : ""} ${U.pill(e.type, "mute")}${e.source === "citation" ? ' <span class="ld-mute">(recopi\xE9 dans un mail suivant)</span>' : ""}</div>
<div style="white-space:pre-wrap;margin-top:4px">${esc(e.texte)}</div></div>`).join("");
      const html = `<div class="ld-grille ld-g2">
${U.carte("Conversation", fil || '<p class="ld-vide">Aucun message.</p>')}
<div>
${U.carte("Dossier", `<dl class="ld-kv"><dt>Prospect</dt><dd>${esc(d.nom || "\u2014")}</dd><dt>E-mail</dt><dd>${esc(d.email || "\u2014")}</dd><dt>Relais du portail</dt><dd>${esc(d.relais || "\u2014")}</dd><dt>T\xE9l\xE9phone</dt><dd>${esc(d.telephone || "\u2014")}</dd>
<dt>Bien</dt><dd>${esc(d.bien_ref || d.reference || "\u2014")} ${d.bien_crm ? `<span class="ld-mute">(id ${esc(d.bien_crm)})</span>` : ""}</dd><dt>N\xE9gociateur</dt><dd>${esc(d.negociateur || "\u2014")}</dd>
<dt>Contact CRM</dt><dd>${esc(d.contact_crm || "\u2014 (mode ombre)")}</dd><dt>Projet de recherche</dt><dd>${esc(d.recherche_crm || "\u2014")}</dd><dt>Consentement</dt><dd>${d.consentement ? U.pill("pos\xE9", "ok") : U.pill("non", "mute")}</dd>
<dt>1re demande</dt><dd>${esc(dateFr(d.premiere_demande))}</dd><dt>1re r\xE9ponse de l'\xE9quipe</dt><dd>${d.reponse_le ? esc(dateFr(d.reponse_le)) + " \xB7 " + esc(duree(new Date(d.reponse_le) - new Date(d.premiere_demande))) : U.pill("pas encore", "warn")}</dd></dl>`)}
${U.carte("Mails du dossier", U.table(["Re\xE7u", "Nature", "Statut"], leads.map((l) => [`<a href="/leads/l/${l.id}">${esc(dateFr(l.recu_le))}</a>`, esc(l.nature), U.badge(l.decision || l.statut)])))}
${U.carte("Commentaire \xE9crit dans le CRM (projet de recherche)", `<pre class="ld-pre">${esc(comment)}</pre><p class="ld-mute" style="margin:6px 0 0">Reconstruit \xE0 chaque mail \xE0 partir de toute la conversation ; rien n'est ajout\xE9 en double.</p>`)}
</div></div>`;
      U.page(req, res, "Dossier \xB7 " + (d.nom || d.email || d.id), "dossiers", html);
    };
    var chiffres = async () => {
      const r = (await db().query(`select count(*) filter (where cree_le > now() - interval '7 days') nouveaux,
    count(*) filter (where reponse_le is null and premiere_demande < now() - interval '24 hours' and premiere_demande > now() - interval '30 days') sans_reponse,
    percentile_cont(0.5) within group (order by extract(epoch from (reponse_le - premiere_demande))) filter (where reponse_le is not null and premiere_demande > now() - interval '30 days') mediane_s
    from "${S()}".ld_dossiers`)).rows[0] || {};
      return { nouveaux: +r.nouveaux || 0, sans_reponse: +r.sans_reponse || 0, mediane_ms: r.mediane_s != null ? +r.mediane_s * 1e3 : null };
    };
    module2.exports = { liste, fiche, chiffres, duree };
  }
});

// ../src/pages/leads.js
var require_leads = __commonJS({
  "../src/pages/leads.js"(exports2, module2) {
    "use strict";
    var { esc, peutVoir: peutVoir2, isAdmin, hidden, go, dateFr, flowApi } = require_core();
    var { tables, MAILS } = require_schema();
    var { charger } = require_conf();
    var { retraiter } = require_dossier();
    var { etat_ecouteur } = require_installer();
    var U = require_ui();
    var refuse = (res) => res.status(403).send("Acc\xE8s r\xE9serv\xE9 \xE0 l'\xE9quipe");
    var db = () => require("@saltcorn/data/db");
    var nb = async (where, params) => +(await db().query(`select count(*) n from "${db().getTenantSchema()}".ld_leads ${where ? "where " + where : ""}`, params || [])).rows[0].n;
    var bandeau = async () => {
      const { crm, reglages } = await charger().catch(() => ({ crm: {}, reglages: {} }));
      const e = await etat_ecouteur().catch(() => null);
      const ec = !e ? U.pill("\xE9couteur non r\xE9gl\xE9", "warn") : e.etat === "erreur" ? U.pill("\xE9couteur en erreur", "ko") : U.pill(e.etat === "idle" ? "\xE9coute en temps r\xE9el" : e.etat || "en attente", e.etat === "idle" || e.etat === "ok" ? "ok" : "warn");
      return `<div class="ld-bandeau"><span>Mode ${crm.mode === "reel" ? '<span class="ld-reel">R\xC9EL</span>' : '<span class="ld-ombre">OMBRE</span> <span class="ld-mute">le CRM est seulement lu</span>'}</span>
<span>CRM <b>${esc(crm.type || "\u2014")}</b></span><span>Bo\xEEte ${e ? `<b>${esc(e.utilisateur)}</b> ` : ""}${ec}${e && e.vu_le ? ` <span class="ld-mute">vu ${esc(dateFr(e.vu_le))}</span>` : ""}</span>
<span>Envoi des mails ${reglages.envoi_mails ? U.pill("activ\xE9", "warn") : U.pill("coup\xE9", "mute")}</span></div>`;
    };
    var tableau = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      await tables();
      const J = "traite_le > now() - interval '1 day'", S = "traite_le > now() - interval '7 days'";
      const [p1, v1, t1, i1, p7, v7, t7, moy] = await Promise.all([
        nb(`${J} and statut='pret'`),
        nb(`${J} and statut='a_verifier'`),
        nb(`${J} and statut='a_trier'`),
        nb(`${J} and statut in ('ignore','alerte')`),
        nb(`${S} and statut='pret'`),
        nb(`${S} and statut='a_verifier'`),
        nb(`${S} and statut='a_trier'`),
        db().query(`select coalesce(round(avg(duree_ms)),0) m from "${db().getTenantSchema()}".ld_leads where ${S}`).then((r) => +r.rows[0].m)
      ]);
      const parPortail = (await db().query(`select coalesce(nullif(portail,''),'(autre)') p, count(*) n, count(*) filter (where statut='pret') ok, count(*) filter (where statut='a_verifier') v from "${db().getTenantSchema()}".ld_leads where ${S} and nature not in ('non_lead','auto_reponse','interne','alerte_spam') group by 1 order by 2 desc limit 20`)).rows;
      const motifs = (await db().query(`select split_part(motifs,' : ',1) m, count(*) n from "${db().getTenantSchema()}".ld_leads where ${S} and statut='a_verifier' group by 1 order by 2 desc limit 8`)).rows;
      const alertes = (await db().query(`select id, objet, alertes, traite_le from "${db().getTenantSchema()}".ld_leads where alertes <> '' and ${S} order by traite_le desc limit 8`)).rows;
      const t = await tables();
      const dem = await t.demandes.getRows({}, { orderBy: "cree_le", orderDesc: true, limit: 50 });
      const ouvertes = dem.filter((d) => !["Termin\xE9e", "Mise en ligne"].includes(d.statut));
      const DC = await require_dossiers().chiffres().catch(() => ({ nouveaux: 0, sans_reponse: 0, mediane_ms: null }));
      let absents = [];
      try {
        const { conf } = await charger();
        absents = flowApi().leads.absentsSemaine(conf.routage, /* @__PURE__ */ new Date());
      } catch (e) {
      }
      const html = `<div class="ld-kpis">
${U.kpi(p1, "pr\xEAts aujourd'hui", { ton: "ok", lien: "/leads/liste?statut=pret&periode=1" })}${U.kpi(v1, "\xE0 v\xE9rifier aujourd'hui", { ton: v1 ? "warn" : "", lien: "/leads/liste?statut=a_verifier&periode=1" })}${U.kpi(t1, "\xE0 trier aujourd'hui", { ton: "info", lien: "/leads/liste?statut=a_trier&periode=1" })}${U.kpi(i1, "non-leads \xE9cart\xE9s", { lien: "/leads/liste?statut=ignore&periode=1" })}
${U.kpi(DC.nouveaux, "dossiers ouverts sur 7 jours", { lien: "/leads/dossiers" })}${U.kpi(require_dossiers().duree(DC.mediane_ms), "d\xE9lai de 1re r\xE9ponse (m\xE9diane, 30 j)", { ton: DC.mediane_ms != null && DC.mediane_ms > 864e5 ? "warn" : "ok" })}${U.kpi(DC.sans_reponse, "sans r\xE9ponse depuis plus de 24 h", { ton: DC.sans_reponse ? "ko" : "", lien: "/leads/dossiers?sans_reponse=1" })}
${U.kpi(p7, "pr\xEAts sur 7 jours", { lien: "/leads/liste?statut=pret&periode=7" })}${U.kpi(v7, "\xE0 v\xE9rifier sur 7 jours", { ton: v7 ? "warn" : "", lien: "/leads/liste?statut=a_verifier&periode=7" })}${U.kpi(t7, "\xE0 trier sur 7 jours", { lien: "/leads/liste?statut=a_trier&periode=7" })}${U.kpi(moy + " ms", "temps moyen de traitement")}</div>
<div class="ld-grille ld-g2">
${U.carte("Par portail \xB7 7 jours", U.table(["Portail", "Leads", "Pr\xEAts", "\xC0 v\xE9rifier", "Taux"], parPortail.map((r) => [`<a href="/leads/liste?portail=${encodeURIComponent(r.p)}&periode=7">${esc(r.p)}</a>`, r.n, r.ok, r.v ? `<span class="ld-badge warn">${r.v}</span>` : 0, Math.round(100 * r.ok / Math.max(1, r.n)) + " %"])))}
${U.carte("Pourquoi \xAB \xE0 v\xE9rifier \xBB \xB7 7 jours", U.table(["Motif", "Nombre"], motifs.map((m) => [esc(m.m || "\u2014"), m.n])))}
${U.carte("Absents cette semaine", U.table(["Personne", "Relais"], absents.map((a) => [esc(a.personne), esc(a.resume)]), "Personne n'est absent cette semaine."), { actions: '<a href="/leads/absences" class="btn btn-sm btn-outline-secondary">Voir la semaine</a>' })}
${U.carte("Demandes en cours", U.table(["Demande", "Urgence", "Statut"], ouvertes.slice(0, 8).map((d) => [`<a href="/leads/demandes/${d.id}">${esc(d.titre)}</a>`, U.pill(d.urgence, d.urgence === "Bloquant" ? "ko" : d.urgence === "Important" ? "warn" : "mute"), esc(d.statut)]), "Aucune demande en cours."), { actions: '<a href="/leads/demandes" class="btn btn-sm btn-outline-secondary">Toutes</a>' })}
${U.carte("Alertes r\xE9centes", U.table(["Quand", "Mail", "Alerte"], alertes.map((a) => [esc(dateFr(a.traite_le)), `<a href="/leads/l/${a.id}">${esc(String(a.objet).slice(0, 70))}</a>`, esc(a.alertes)])))}
</div>`;
      U.page(req, res, "Tableau de bord", "", html, { bandeau: await bandeau() });
    };
    var liste = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      await tables();
      const q = req.query || {};
      const w = [], p = [];
      const add = (sql, v) => {
        p.push(v);
        w.push(sql.replace("?", "$" + p.length));
      };
      if (q.statut) add("statut = ?", q.statut);
      if (q.portail) add("coalesce(nullif(portail,''),'(autre)') = ?", q.portail);
      if (+q.periode) add("traite_le > now() - (? || ' days')::interval", String(+q.periode));
      if (q.q) {
        p.push("%" + q.q + "%");
        const n = "$" + p.length;
        w.push(`(objet ilike ${n} or contact_email ilike ${n} or contact_nom ilike ${n} or reference ilike ${n} or bien_ref_crm ilike ${n})`);
      }
      if (q.ecart === "1") w.push("ancien_statut is not null and ancien_statut <> '' and ((ancien_bien is distinct from nullif(bien_crm,'')) or (ancien_destinataires is distinct from destinataires))");
      const page = Math.max(1, +q.page || 1);
      const S = db().getTenantSchema();
      const where = w.length ? "where " + w.join(" and ") : "";
      const total = +(await db().query(`select count(*) n from "${S}".ld_leads ${where}`, p)).rows[0].n;
      const rows = (await db().query(`select id, recu_le, portail, nature, statut, decision, contact_nom, contact_email, reference, bien_ref_crm, agence, destinataires, objet, motifs from "${S}".ld_leads ${where} order by recu_le desc nulls last, id desc limit 50 offset ${(page - 1) * 50}`, p)).rows;
      const portails = (await db().query(`select distinct coalesce(nullif(portail,''),'(autre)') p from "${S}".ld_leads order by 1`)).rows.map((r) => r.p);
      const qs = (o) => "?" + new URLSearchParams({ ...q, ...o }).toString();
      const html = `<form class="ld-filtres" method="get">${U.select("statut", [["", "Tous les statuts"], ...Object.entries(U.STATUTS).map(([k, v]) => [k, v[0]])], q.statut || "")}${U.select("portail", [["", "Tous les portails"], ...portails], q.portail || "")}${U.select("periode", [["", "Toute la p\xE9riode"], ["1", "24 h"], ["7", "7 jours"], ["30", "30 jours"]], q.periode || "")}
<input class="form-control form-control-sm" name="q" value="${esc(q.q || "")}" placeholder="Nom, e-mail, r\xE9f\xE9rence\u2026">${U.coche("ecart", q.ecart === "1", "\xE9carts avec l'ancien syst\xE8me").replace('name="ecart"', 'name="ecart" value="1"')}<button class="btn btn-sm btn-primary">Filtrer</button> <span class="ld-mute">${total} r\xE9sultat(s)</span></form>
${U.table(["Re\xE7u", "Portail", "Contact", "R\xE9f\xE9rence \u2192 bien", "Agence", "Statut", "Destinataires"], rows.map((r) => [
        `<a href="/leads/l/${r.id}">${esc(dateFr(r.recu_le))}</a>`,
        esc(r.portail || "\u2014") + `<br><small class="ld-mute">${esc(r.nature)}</small>`,
        `${esc(r.contact_nom || "")}<br><small class="ld-mute">${esc(r.contact_email || "")}</small>`,
        `${esc(r.reference || "\u2014")}${r.bien_ref_crm ? ` \u2192 <b>${esc(r.bien_ref_crm)}</b>` : ""}`,
        esc(r.agence || ""),
        U.badge(r.decision || r.statut) + (r.motifs ? `<br><small class="ld-mute">${esc(String(r.motifs).slice(0, 90))}</small>` : ""),
        `<small>${esc(String(r.destinataires || "").split(", ").filter(Boolean).length)} adresse(s)</small>`
      ]), "Aucun lead ne correspond.")}
<div class="ld-pages">${page > 1 ? `<a class="btn btn-sm btn-outline-secondary" href="${qs({ page: page - 1 })}">Pr\xE9c\xE9dents</a>` : ""}${page * 50 < total ? `<a class="btn btn-sm btn-outline-secondary" href="${qs({ page: page + 1 })}">Suivants</a>` : ""}</div>`;
      U.page(req, res, "Leads", "liste", html, { bandeau: await bandeau() });
    };
    var mailSur = (html) => String(html || "").replace(/<(script|iframe|object|embed|form|meta|link|base)\b[\s\S]*?(<\/\1\s*>|\/?>)/gi, "").replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'\s>]*/gi, "$1=$2#");
    var fiche = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      const t = await tables();
      const l = await t.leads.getRow({ id: +req.params.id });
      if (!l) return go(res, "/leads/liste", "Lead introuvable", true);
      let d = {};
      try {
        d = JSON.parse(l.dossier || "{}");
      } catch (e) {
        d = {};
      }
      const x = d.extraction || {};
      const Table = require("@saltcorn/data/models/table");
      const tm = Table.findOne({ name: MAILS });
      const mail = tm && l.mail_id ? await tm.getRow({ id: l.mail_id }) : null;
      const ligne = (champ, v, pr) => [esc(champ), v === void 0 || v === null || v === "" ? '<span class="ld-mute">\u2014</span>' : esc(typeof v === "object" ? JSON.stringify(v) : v), `<span class="ld-mute ld-mono">${esc(pr || "")}</span>`];
      const P = x.preuves || {};
      const champs = [
        ...["prenom", "nom", "email", "email_relais", "telephone", "civilite", "pays"].map((k) => ligne("contact \xB7 " + k, (x.contact || {})[k], P["contact." + k])),
        ...["reference", "reference_portail", "id_crm", "titre", "type", "prix", "surface", "pieces", "chambres", "ville", "code_postal", "departement"].map((k) => ligne("bien \xB7 " + k, (x.bien || {})[k], P["bien." + k])),
        ...Object.entries(x.recherche || {}).map(([k, v]) => ligne("recherche \xB7 " + k, v, P["recherche." + k])),
        ligne("site d'origine", x.site, P.site),
        ligne("message", x.message, P.message)
      ].filter((r) => !/—<\/span>$/.test(r[1]) || /reference|email|telephone|nom/.test(r[0]));
      const R2 = d.rapprochement || {};
      const nego = d.negociateur ? await t.personnes.getRow({ crm_id: String(d.negociateur) }) : null;
      const etapes = (R2.etapes || []).map((e) => [esc(e.etape), `<span class="ld-mono">${esc(typeof e.requete === "object" ? JSON.stringify(e.requete) : e.requete)}</span>`, esc(e.trouves), (e.candidats || []).map((c) => `${c.ok ? "\u2714" : "\u2716"} ${esc(c.reference)} <span class="ld-mute">(${esc(c.id)})</span> \u2014 ${esc(c.raison)}`).join("<br>")]);
      const D2 = d.destinataires || { liste: [], trace: [] };
      const ex = d.execution && d.execution.resultats || [];
      const html = `<div class="ld-actions" style="margin:-4px 0 12px">${U.badge(l.decision || l.statut)} ${U.pill(l.portail || "portail inconnu")} ${U.pill(l.nature)} ${l.mode === "reel" ? '<span class="ld-reel">R\xC9EL</span>' : '<span class="ld-ombre">OMBRE</span>'}
${l.dossier_id ? `<a class="btn btn-sm btn-outline-secondary" href="/leads/dossier/${l.dossier_id}"><i class="fas fa-comments"></i> Dossier et conversation</a>` : ""}
<form method="post" action="/leads/l/${l.id}/retraiter" class="ld-inline">${hidden(req)}<button class="btn btn-sm btn-outline-primary"><i class="fas fa-redo"></i> Retraiter (ombre)</button></form>
<form method="post" action="/leads/l/${l.id}/decision" class="ld-inline">${hidden(req)}${U.select("decision", [["", "D\xE9cision\u2026"], ["traite", "Trait\xE9 \xE0 la main"], ["ignore", "Pas un lead"], ["a_verifier", "\xC0 revoir"]], "")}<button class="btn btn-sm btn-outline-secondary">Enregistrer</button></form></div>
${l.motifs ? `<div class="ld-flash ko">${esc(l.motifs)}</div>` : ""}${l.alertes ? `<div class="ld-flash" style="background:rgba(161,92,0,.1)">${esc(l.alertes)}</div>` : ""}
<div class="ld-grille ld-g2">
${U.carte("Ce qui a \xE9t\xE9 lu (sans IA)", U.table(["Champ", "Valeur", "Source"], champs))}
<div>
${U.carte("Bien", `<dl class="ld-kv"><dt>R\xE9sultat</dt><dd>${d.bien ? `<b>${esc(d.bien.reference)}</b> (id ${esc(d.bien.id)}) \xB7 ${esc([d.bien.type, d.bien.pieces && d.bien.pieces + " p.", d.bien.surface && d.bien.surface + " m\xB2", d.bien.prix && d.bien.prix.toLocaleString("fr-FR") + " \u20AC", d.bien.ville].filter(Boolean).join(" \xB7 "))}` : `<span class="ld-badge warn">non trouv\xE9</span> ${esc(R2.motif || "")}`}</dd><dt>M\xE9thode</dt><dd>${esc(R2.methode || "\u2014")} ${R2.confiance ? U.pill("confiance " + R2.confiance) : ""}</dd><dt>Agence</dt><dd>${esc(d.agence ? `${d.agence.nom} (par ${d.agence.par})` : "\u2014")}</dd><dt>N\xE9gociateur</dt><dd>${nego ? `<a href="/leads/personne/${nego.id}">${esc(nego.nom)}</a> <span class="ld-mute">(${esc(d.negociateur)})</span>` : esc(d.negociateur || "\u2014")}</dd><dt>Origine</dt><dd>${esc(d.origine ? `${d.origine.libelle || d.origine.code} ${d.origine.id ? "(" + d.origine.id + ")" : "(non reli\xE9e au CRM)"}` : "\u2014")}</dd></dl>`)}
${U.carte("\xC9tapes de recherche du bien", U.table(["\xC9tape", "Requ\xEAte", "Trouv\xE9s", "V\xE9rification"], etapes, "Aucune recherche (pas un lead ou pas de r\xE9f\xE9rence)."))}
${U.carte("Contact", `<dl class="ld-kv"><dt>D\xE9cision</dt><dd>${esc((d.contact || {}).action || "\u2014")}${(d.contact || {}).par ? " (trouv\xE9 par " + esc(d.contact.par) + ")" : ""}${(d.contact || {}).id ? " \xB7 contact " + esc(d.contact.id) : ""}</dd></dl>${((d.contact || {}).trace || []).length ? `<ul class="ld-trace">${d.contact.trace.map((z) => `<li>${esc(z)}</li>`).join("")}</ul>` : ""}`)}
</div>
${U.carte("Destinataires", U.table(["Adresse", "R\xF4le", "Pour", "Pourquoi"], D2.liste.map((z) => [esc(z.email), esc((z.roles || [z.role]).join(", ")), esc(z.pour || ""), esc(z.raison || "")])) + (D2.trace && D2.trace.length ? `<ul class="ld-trace">${D2.trace.map((z) => `<li>${esc(z)}</li>`).join("")}</ul>` : ""))}
${U.carte("Actions CRM", U.table(["Action", "D\xE9tail", "Fait ?"], (d.actions || []).map((a, i) => [esc(a.op), `<span class="ld-mono">${esc(JSON.stringify(a.donnees || { bien: a.bien, motif: a.motif, preuves: a.preuves })).slice(0, 400)}</span>`, ex[i] ? ex[i].fait ? U.pill("fait", "ok") : ex[i].erreur ? U.pill("erreur : " + ex[i].erreur, "ko") : U.pill("not\xE9 (ombre)", "mute") : "\u2014"]), "Aucune action."))}
</div>
${U.carte("Mail d'origine", mail ? `<dl class="ld-kv"><dt>De</dt><dd>${esc(mail.expediteur)}</dd><dt>\xC0</dt><dd>${esc(mail.destinataire)}</dd><dt>Objet</dt><dd>${esc(mail.objet)}</dd><dt>Re\xE7u</dt><dd>${esc(dateFr(mail.date_envoi))}</dd></dl><div style="margin-top:8px">${mail.corps_html ? `<iframe class="ld-mail" sandbox="" referrerpolicy="no-referrer" srcdoc="${esc(mailSur(mail.corps_html))}"></iframe>` : `<pre class="ld-pre">${esc(mail.corps_texte)}</pre>`}</div>` : '<p class="ld-vide">Mail non disponible.</p>')}
${l.ancien_statut ? U.carte("Ancien syst\xE8me (comparaison)", `<dl class="ld-kv"><dt>Statut</dt><dd>${esc(l.ancien_statut)}</dd><dt>Bien</dt><dd>${esc(l.ancien_bien || "\u2014")} ${String(l.ancien_bien || "") === String(l.bien_crm || "") ? U.pill("identique", "ok") : U.pill("diff\xE9rent", "warn")}</dd><dt>Destinataires</dt><dd>${esc(l.ancien_destinataires || "\u2014")}</dd></dl>`) : ""}`;
      U.page(req, res, l.objet || "Lead", "liste", html);
    };
    var retraiterPost = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      const t = await tables();
      const l = await t.leads.getRow({ id: +req.params.id });
      if (!l || !l.mail_id) return go(res, "/leads/liste", "Pas de mail \xE0 retraiter", true);
      try {
        const r = await retraiter(l.mail_id, { forcerOmbre: true });
        go(res, `/leads/l/${r.id}`, "Retrait\xE9 en mode ombre");
      } catch (e) {
        go(res, `/leads/l/${l.id}`, "\xC9chec : " + e.message, true);
      }
    };
    var decisionPost = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      const t = await tables();
      await t.leads.updateRow({ decision: String((req.body || {}).decision || "").slice(0, 30) }, +req.params.id);
      go(res, `/leads/l/${req.params.id}`, "D\xE9cision enregistr\xE9e");
    };
    module2.exports = { tableau, liste, fiche, retraiterPost, decisionPost, bandeau };
  }
});

// ../src/pages/equipe.js
var require_equipe = __commonJS({
  "../src/pages/equipe.js"(exports2, module2) {
    "use strict";
    var { esc, peutVoir: peutVoir2, hidden, go, jour, flowApi } = require_core();
    var { tables } = require_schema();
    var { charger, liste } = require_conf();
    var U = require_ui();
    var refuse = (res) => res.status(403).send("Acc\xE8s r\xE9serv\xE9 \xE0 l'\xE9quipe");
    var JOURS = [[1, "lun"], [2, "mar"], [3, "mer"], [4, "jeu"], [5, "ven"], [6, "sam"], [7, "dim"]];
    var refOptions = (personnes, vide = "\u2014 personne \u2014") => [["", vide], ...personnes.filter((p) => p.actif !== false).sort((a, b) => a.nom.localeCompare(b.nom)).map((p) => [`p:${p.id}`, `${p.nom} (${p.role === "assistante" ? "assistant(e)" : "n\xE9gociateur"})`])];
    var refChamp = (name, cur, personnes, label, aide) => {
      const estEmail = /@/.test(cur || "");
      return U.champ(label, `${U.select(name, refOptions(personnes), estEmail ? "" : cur || "")}<input class="form-control form-control-sm mt-1" name="${name}_email" value="${esc(estEmail ? cur : "")}" placeholder="\u2026ou une adresse e-mail">`, aide);
    };
    var refLire = (b, name) => String(b[name + "_email"] || "").trim() || String(b[name] || "").trim();
    var nomRef = (ref, P) => {
      if (!ref) return "\u2014";
      const m = String(ref).match(/^p:(\d+)$/);
      if (m) {
        const p = P.find((x) => x.id === +m[1]);
        return p ? p.nom : "?";
      }
      return ref;
    };
    var envoi = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      const t = await tables();
      const [P, R2] = await Promise.all([t.personnes.getRows({}), t.regles.getRows({})]);
      const negos = P.filter((p) => p.role !== "assistante" && p.actif !== false).sort((a, b) => a.nom.localeCompare(b.nom));
      const q = req.query || {};
      let resultat = "";
      if (q.tester) {
        const { conf, idMoteur } = await charger();
        const p = P.find((x) => x.id === +q.tester);
        const d = flowApi().leads.destinataires(p ? idMoteur.get(p.id) : q.tester, q.date ? /* @__PURE__ */ new Date(q.date + "T10:00:00") : /* @__PURE__ */ new Date(), conf.routage);
        resultat = U.carte(`Le prochain lead de ${esc(p ? p.nom : q.tester)}${q.date ? " le " + esc(q.date) : " maintenant"} partirait \xE0 :`, U.table(["Adresse", "R\xF4le", "Pourquoi"], d.liste.map((z) => [`<b>${esc(z.email)}</b>`, esc((z.roles || [z.role]).join(", ")), esc(z.raison)])) + (d.trace.length ? `<ul class="ld-trace">${d.trace.map((z) => `<li>${esc(z)}</li>`).join("")}</ul>` : ""), { cls: "ld-resultat" });
      }
      const edit = q.regle ? R2.find((r) => r.id === +q.regle) || {} : {};
      const form = `<form method="post" action="/leads/envoi/regle">${hidden(req)}<input type="hidden" name="id" value="${edit.id || ""}"><div class="ld-form">
${U.champ("Nom de la r\xE8gle", U.input("libelle", edit.libelle || "", { required: true, placeholder: "ex. S\xE9n\xE9gal : assistante seule" }))}
${U.champ("S'applique \xE0", `${U.select("tous", [["", "des n\xE9gociateurs choisis"], ["1", "tous les n\xE9gociateurs"]], edit.tous ? "1" : "")}<select class="form-select form-select-sm mt-1" name="negociateurs" multiple size="5">${negos.map((p) => `<option value="p:${p.id}" ${liste(edit.negociateurs).includes("p:" + p.id) ? "selected" : ""}>${esc(p.nom)}</option>`).join("")}</select>`, "Ctrl/Cmd + clic pour en choisir plusieurs")}
${U.champ("N\xE9gociateur", U.select("couper_negociateur", [["", "re\xE7oit le lead"], ["1", "ne re\xE7oit pas le lead (coup\xE9)"]], edit.couper_negociateur ? "1" : ""))}
${U.champ("Assistant(e)", U.select("assistante", [["garder", "garder la sienne"], ["couper", "couper"], ["remplacer", "remplacer par\u2026"]], edit.assistante || "garder"))}
${refChamp("assistante_remplacante", edit.assistante_remplacante, P, "Rempla\xE7ant(e) de l'assistant(e)", "si \xAB remplacer par\u2026 \xBB")}
${U.champ("Adresses en plus", U.zone("adresses_libres", String(edit.adresses_libres || "").split(/[\s,;]+/).join("\n"), 3, { placeholder: "une adresse par ligne" }), "sans limite, toute combinaison")}
${U.champ("", U.coche("actif", edit.actif !== false, "r\xE8gle active"))}</div>
<div class="ld-actions"><button class="btn btn-sm btn-primary">${edit.id ? "Enregistrer" : "Ajouter la r\xE8gle"}</button>${edit.id ? `<a class="btn btn-sm btn-link" href="/leads/envoi">Annuler</a>` : ""}</div></form>`;
      const html = `${U.carte("Tester : o\xF9 partirait le prochain lead ?", `<form class="ld-filtres" method="get">${U.select("tester", [["", "Choisir un n\xE9gociateur"], ...negos.map((p) => [p.id, p.nom])], q.tester || "", { required: true })}<input class="form-control form-control-sm" type="date" name="date" value="${esc(q.date || "")}"><button class="btn btn-sm btn-primary">Tester</button><span class="ld-mute">Le si\xE8ge re\xE7oit toujours. Cong\xE9s et mi-temps sont pris en compte.</span></form>`)}
${resultat}
${U.carte("R\xE8gles d'envoi", U.table(["R\xE8gle", "Pour", "N\xE9gociateur", "Assistant(e)", "En plus", ""], R2.map((r) => [
        esc(r.libelle) + (r.actif === false ? " " + U.pill("inactive") : ""),
        r.tous ? "tous" : esc(liste(r.negociateurs).map((x) => nomRef(x, P)).join(", ")),
        r.couper_negociateur ? U.pill("coup\xE9", "warn") : "re\xE7oit",
        esc(r.assistante === "remplacer" ? "remplac\xE9e par " + nomRef(r.assistante_remplacante, P) : r.assistante || "garder"),
        esc(liste(r.adresses_libres).join(", ")),
        `<a href="/leads/envoi?regle=${r.id}">modifier</a> \xB7 <form method="post" action="/leads/envoi/regle/${r.id}/supprimer" style="display:inline">${hidden(req)}<button class="btn btn-link btn-sm p-0">supprimer</button></form>`
      ]), "Aucune r\xE8gle : chaque n\xE9gociateur re\xE7oit ses leads avec son assistant(e), plus le si\xE8ge."))}
${U.carte(edit.id ? "Modifier la r\xE8gle" : "Nouvelle r\xE8gle", form)}
${U.carte("\xC9quipe", U.table(["Nom", "R\xF4le", "E-mail", "Assistant(e)", "Temps", ""], P.sort((a, b) => a.nom.localeCompare(b.nom)).map((p) => [esc(p.nom) + (p.actif === false ? " " + U.pill("inactif") : ""), p.role === "assistante" ? "assistant(e)" : "n\xE9gociateur", esc(p.email), esc(p.assistante ? (P.find((x) => x.id === p.assistante) || {}).nom : ""), p.temps === "mi_temps" ? U.pill("mi-temps : " + liste(p.jours).map((j) => (JOURS.find((x) => x[0] === +j) || [])[1]).join(" "), "info") : "temps plein", `<a href="/leads/personne/${p.id}">r\xE9gler</a>`]), "Aucune personne : importe-les (onglet Import) ou ajoute-les."), { actions: '<a class="btn btn-sm btn-outline-secondary" href="/leads/personne/nouvelle">Ajouter</a>' })}`;
      U.page(req, res, "Envoi des leads", "envoi", html);
    };
    var regleSave = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      const b = req.body || {}, t = await tables();
      const negs = [].concat(b.negociateurs || []).join(",");
      const row = { libelle: String(b.libelle || "").slice(0, 200), tous: b.tous === "1", negociateurs: negs, couper_negociateur: b.couper_negociateur === "1", assistante: ["garder", "couper", "remplacer"].includes(b.assistante) ? b.assistante : "garder", assistante_remplacante: refLire(b, "assistante_remplacante"), adresses_libres: liste(b.adresses_libres).filter((e) => /@/.test(e)).join(", "), actif: b.actif === "on", maj_le: /* @__PURE__ */ new Date() };
      if (!row.libelle) return go(res, "/leads/envoi", "Donne un nom \xE0 la r\xE8gle", true);
      if (!row.tous && !negs) return go(res, "/leads/envoi", "Choisis au moins un n\xE9gociateur (ou \xAB tous \xBB)", true);
      if (row.assistante === "remplacer" && !row.assistante_remplacante) return go(res, "/leads/envoi", "Choisis qui remplace l'assistant(e)", true);
      if (b.id) await t.regles.updateRow(row, +b.id);
      else await t.regles.insertRow(row);
      go(res, "/leads/envoi", "R\xE8gle enregistr\xE9e");
    };
    var regleSuppr = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      const t = await tables();
      await t.regles.deleteRows({ id: +req.params.id });
      go(res, "/leads/envoi", "R\xE8gle supprim\xE9e");
    };
    var personne = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      const t = await tables();
      const P = await t.personnes.getRows({});
      const p = req.params.id === "nouvelle" ? { actif: true, role: "negociateur", temps: "plein" } : P.find((x) => x.id === +req.params.id);
      if (!p) return go(res, "/leads/envoi", "Personne introuvable", true);
      const abs = p.id ? await t.absences.getRows({ personne: p.id }, { orderBy: "debut", orderDesc: true }) : [];
      const jours = liste(p.jours).map(Number);
      const html = `${U.carte("Fiche", `<form method="post" action="/leads/personne">${hidden(req)}<input type="hidden" name="id" value="${p.id || ""}"><div class="ld-form">
${U.champ("Nom", U.input("nom", p.nom || "", { required: true }))}${U.champ("E-mail", U.input("email", p.email || "", { type: "email" }))}
${U.champ("R\xF4le", U.select("role", [["negociateur", "n\xE9gociateur"], ["assistante", "assistant(e)"]], p.role))}${U.champ("Identifiant CRM", U.input("crm_id", p.crm_id || ""), "ex. user_id Immofacile")}
${U.champ("Assistant(e)", U.select("assistante", [["", "\u2014 aucun(e) \u2014"], ...P.filter((x) => x.role === "assistante" && x.id !== p.id).map((x) => [x.id, x.nom])], p.assistante || ""))}
${U.champ("Temps de travail", U.select("temps", [["plein", "temps plein"], ["mi_temps", "mi-temps (jours choisis)"]], p.temps || "plein"))}
${U.champ("Jours travaill\xE9s (mi-temps)", `<div class="ld-actions" style="margin:0">${JOURS.map(([n, l]) => U.coche("j" + n, jours.includes(n), l)).join("")}</div>`, "ex. lundi \xE0 mercredi")}
${refChamp("remplacant_hors_jours", p.remplacant_hors_jours, P.filter((x) => x.id !== p.id), "Rempla\xE7ant les autres jours", "re\xE7oit les leads les jours non travaill\xE9s")}
${U.champ("", U.coche("actif", p.actif !== false, "actif(ve)"))}</div><div class="ld-actions"><button class="btn btn-sm btn-primary">Enregistrer</button><a class="btn btn-sm btn-link" href="/leads/envoi">Retour</a></div></form>`)}
${p.id ? U.carte("Cong\xE9s et absences", U.table(["Du", "Au", "Relais", "Motif", ""], abs.map((a) => [esc(a.debut), esc(a.fin || "\u2026"), esc(nomRef(a.remplacant, P)), esc(a.motif || "cong\xE9s"), `<form method="post" action="/leads/absences/${a.id}/supprimer">${hidden(req)}<input type="hidden" name="retour" value="/leads/personne/${p.id}"><button class="btn btn-link btn-sm p-0">supprimer</button></form>`]), "Aucune absence.") + formAbsence(req, P, p.id, `/leads/personne/${p.id}`)) : ""}`;
      U.page(req, res, p.nom || "Nouvelle personne", "envoi", html);
    };
    var personneSave = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      const b = req.body || {}, t = await tables();
      const row = { nom: String(b.nom || "").trim().slice(0, 150), email: String(b.email || "").trim().toLowerCase(), role: b.role === "assistante" ? "assistante" : "negociateur", crm_id: String(b.crm_id || "").trim(), assistante: +b.assistante || null, temps: b.temps === "mi_temps" ? "mi_temps" : "plein", jours: JOURS.filter(([n]) => b["j" + n] === "on").map(([n]) => n).join(","), remplacant_hors_jours: refLire(b, "remplacant_hors_jours"), actif: b.actif === "on" };
      if (!row.nom) return go(res, "/leads/envoi", "Nom obligatoire", true);
      if (row.temps === "mi_temps" && !row.jours) return go(res, `/leads/personne/${b.id || "nouvelle"}`, "Choisis les jours travaill\xE9s", true);
      const id = b.id ? (await t.personnes.updateRow(row, +b.id), +b.id) : await t.personnes.insertRow(row);
      go(res, `/leads/personne/${id}`, "Enregistr\xE9");
    };
    var formAbsence = (req, P, personneId, retour) => `<form method="post" action="/leads/absences" style="margin-top:10px">${hidden(req)}<input type="hidden" name="retour" value="${esc(retour)}"><div class="ld-form">
${personneId ? `<input type="hidden" name="personne" value="${personneId}">` : U.champ("Qui ?", U.select("personne", [["", "Choisir"], ...P.filter((p) => p.actif !== false).sort((a, b) => a.nom.localeCompare(b.nom)).map((p) => [p.id, p.nom])], "", { required: true }))}
${U.champ("Du", U.input("debut", "", { type: "date", required: true }))}${U.champ("Au (inclus)", U.input("fin", "", { type: "date" }), "vide = jusqu'\xE0 nouvel ordre")}
${refChamp("remplacant", "", P.filter((p) => p.id !== personneId), "Les leads vont \xE0", "n\xE9gociateur, assistant(e) ou adresse libre")}
${U.champ("Motif", U.select("motif", ["cong\xE9s", "maladie", "formation", "autre"], "cong\xE9s"))}</div><div class="ld-actions"><button class="btn btn-sm btn-primary">Ajouter l'absence</button><span class="ld-mute">Pendant l'absence : aucune notification pour la personne ; retour automatique \xE0 la normale apr\xE8s la date de fin.</span></div></form>`;
    var absences = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      const t = await tables();
      const P = await t.personnes.getRows({});
      const A = await t.absences.getRows({}, { orderBy: "debut" });
      const q = req.query || {};
      const base = q.semaine ? /* @__PURE__ */ new Date(q.semaine + "T12:00:00Z") : /* @__PURE__ */ new Date();
      const lundi = new Date(base);
      lundi.setUTCDate(lundi.getUTCDate() - (lundi.getUTCDay() + 6) % 7);
      const jours7 = [...Array(7)].map((_, i) => {
        const d = new Date(lundi);
        d.setUTCDate(lundi.getUTCDate() + i);
        return d;
      });
      const { conf, idMoteur } = await charger();
      const L2 = flowApi().leads;
      const lignes = [];
      for (const p of P.filter((x) => x.actif !== false).sort((a, b) => a.nom.localeCompare(b.nom))) {
        const pm = conf.routage.personnes.find((x) => x.id === idMoteur.get(p.id));
        const cells = jours7.map((d) => {
          const r = L2.disponibilite(conf.routage, pm, d);
          return r.dispo ? "" : `<td class="${r.type === "absence" ? "abs" : "hors"}">${r.type === "absence" ? "absent(e)" : "ne travaille pas"}<br><small>\u2192 ${esc(r.remplacant ? r.remplacant.email || (conf.routage.personnes.find((x) => x.id === r.remplacant.personne) || {}).nom : "personne")}</small></td>`;
        });
        if (cells.some(Boolean)) lignes.push(`<tr><td><a href="/leads/personne/${p.id}">${esc(p.nom)}</a></td>${cells.map((c) => c || "<td></td>").join("")}</tr>`);
      }
      const prec = new Date(lundi);
      prec.setUTCDate(prec.getUTCDate() - 7);
      const suiv = new Date(lundi);
      suiv.setUTCDate(suiv.getUTCDate() + 7);
      const aVenir = A.filter((a) => !a.fin || a.fin >= jour(/* @__PURE__ */ new Date()));
      const html = `${U.carte(`Semaine du ${lundi.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} : qui est absent, qui prend le relais`, `<div class="ld-table-wrap"><table class="ld-table ld-semaine"><thead><tr><th>Personne</th>${jours7.map((d) => `<th>${d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })}</th>`).join("")}</tr></thead><tbody>${lignes.join("") || '<tr><td colspan="8" class="ld-mute">Tout le monde est l\xE0 cette semaine.</td></tr>'}</tbody></table></div>`, { actions: `<span><a class="btn btn-sm btn-outline-secondary" href="?semaine=${jour(prec)}">\u2039</a> <a class="btn btn-sm btn-outline-secondary" href="/leads/absences">cette semaine</a> <a class="btn btn-sm btn-outline-secondary" href="?semaine=${jour(suiv)}">\u203A</a></span>` })}
${U.carte("Absences en cours et \xE0 venir", U.table(["Qui", "Du", "Au", "Relais", "Motif", ""], aVenir.map((a) => [esc((P.find((p) => p.id === a.personne) || {}).nom || "?"), esc(a.debut), esc(a.fin || "\u2026"), esc(nomRef(a.remplacant, P)), esc(a.motif || ""), `<form method="post" action="/leads/absences/${a.id}/supprimer">${hidden(req)}<input type="hidden" name="retour" value="/leads/absences"><button class="btn btn-link btn-sm p-0">supprimer</button></form>`]), "Aucune absence pr\xE9vue."))}
${U.carte("Nouvelle absence", formAbsence(req, P, null, "/leads/absences"))}`;
      U.page(req, res, "Absences", "absences", html);
    };
    var absenceSave = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      const b = req.body || {}, t = await tables();
      const retour = /^\/leads\//.test(b.retour || "") ? b.retour : "/leads/absences";
      const row = { personne: +b.personne, debut: String(b.debut || ""), fin: String(b.fin || ""), remplacant: refLire(b, "remplacant"), motif: String(b.motif || "cong\xE9s").slice(0, 40), actif: true };
      if (!row.personne || !/^\d{4}-\d{2}-\d{2}$/.test(row.debut)) return go(res, retour, "Personne et date de d\xE9but obligatoires", true);
      if (row.fin && row.fin < row.debut) return go(res, retour, "La fin est avant le d\xE9but", true);
      if (row.remplacant === `p:${row.personne}`) return go(res, retour, "Une personne ne peut pas se remplacer elle-m\xEAme", true);
      await t.absences.insertRow(row);
      go(res, retour, "Absence ajout\xE9e" + (row.remplacant ? "" : " (sans relais : ses leads iront seulement \xE0 l'assistant(e) et au si\xE8ge)"));
    };
    var absenceSuppr = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      const t = await tables();
      await t.absences.deleteRows({ id: +req.params.id });
      const r = (req.body || {}).retour;
      go(res, /^\/leads\//.test(r || "") ? r : "/leads/absences", "Absence supprim\xE9e");
    };
    module2.exports = { envoi, regleSave, regleSuppr, personne, personneSave, absences, absenceSave, absenceSuppr };
  }
});

// ../src/pages/demandes.js
var require_demandes = __commonJS({
  "../src/pages/demandes.js"(exports2, module2) {
    "use strict";
    var { esc, peutVoir: peutVoir2, isAdmin, hidden, go, dateFr } = require_core();
    var { tables, STATUTS_DEMANDE, URGENCES } = require_schema();
    var U = require_ui();
    var refuse = (res) => res.status(403).send("Acc\xE8s r\xE9serv\xE9 \xE0 l'\xE9quipe");
    var ton = (u) => u === "Bloquant" ? "ko" : u === "Important" ? "warn" : "mute";
    var alerter = async (d) => {
      try {
        const User = require("@saltcorn/data/models/user"), Notification = require("@saltcorn/data/models/notification");
        for (const u of await User.find({ role_id: 1 })) await Notification.create({ user_id: u.id, title: `Demande bloquante : ${d.titre}`, body: String(d.description || "").slice(0, 300), link: `/leads/demandes/${d.id}` });
      } catch (e) {
      }
    };
    var liste = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      const t = await tables();
      const D2 = await t.demandes.getRows({}, { orderBy: "cree_le", orderDesc: true });
      const ordre = { Bloquant: 0, Important: 1, Confort: 2 };
      const col = (s) => D2.filter((d) => (d.statut || "Re\xE7ue") === s).sort((a, b) => (ordre[a.urgence] ?? 3) - (ordre[b.urgence] ?? 3)).map((d) => `<a class="ld-ticket" href="/leads/demandes/${d.id}"><b>${esc(d.titre)}</b>${U.pill(d.urgence || "Confort", ton(d.urgence))} <small class="ld-mute">${esc(dateFr(d.maj_le || d.cree_le, false))}</small></a>`).join("");
      const html = `<div class="ld-board">${STATUTS_DEMANDE.map((s) => `<div class="ld-col"><h3>${esc(s)} <span class="ld-mute">${D2.filter((d) => (d.statut || "Re\xE7ue") === s).length}</span></h3>${col(s)}</div>`).join("")}</div>
${U.carte("Nouvelle demande", `<form method="post" action="/leads/demandes">${hidden(req)}<div class="ld-form">
${U.champ("Titre", U.input("titre", "", { required: true, placeholder: "ex. Les leads Properstar n'arrivent plus" }))}
${U.champ("Urgence", U.select("urgence", Object.entries(URGENCES).map(([k, v]) => [k, `${k} \u2014 ${v}`]), "Confort"))}
${U.champ("Description", U.zone("description", "", 4, { placeholder: "Ce qui se passe, depuis quand, un exemple (r\xE9f\xE9rence, mail\u2026)" }))}</div>
<div class="ld-actions"><button class="btn btn-sm btn-primary">Envoyer la demande</button></div></form>`)}`;
      U.page(req, res, "Demandes", "demandes", html);
    };
    var creer = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      const b = req.body || {}, t = await tables();
      const titre = String(b.titre || "").trim().slice(0, 200);
      if (!titre) return go(res, "/leads/demandes", "Titre obligatoire", true);
      const urgence = Object.keys(URGENCES).includes(b.urgence) ? b.urgence : "Confort";
      const qui = req.user && req.user.email || "";
      const id = await t.demandes.insertRow({ titre, description: String(b.description || "").slice(0, 8e3), urgence, statut: "Re\xE7ue", demandeur: qui, cree_le: /* @__PURE__ */ new Date(), maj_le: /* @__PURE__ */ new Date() });
      await t.etapes.insertRow({ demande: id, statut: "Re\xE7ue", quand: /* @__PURE__ */ new Date(), note: `Urgence : ${urgence}`, par: qui });
      if (urgence === "Bloquant") await alerter({ id, titre, description: b.description });
      go(res, `/leads/demandes/${id}`, urgence === "Bloquant" ? "Demande envoy\xE9e \u2014 alerte imm\xE9diate" : "Demande envoy\xE9e");
    };
    var fiche = async (req, res) => {
      if (!peutVoir2(req)) return refuse(res);
      const t = await tables();
      const d = await t.demandes.getRow({ id: +req.params.id });
      if (!d) return go(res, "/leads/demandes", "Demande introuvable", true);
      const E2 = await t.etapes.getRows({ demande: d.id }, { orderBy: "quand" });
      const suivant = STATUTS_DEMANDE[Math.min(STATUTS_DEMANDE.indexOf(d.statut || "Re\xE7ue") + 1, STATUTS_DEMANDE.length - 1)];
      const html = `<div class="ld-actions" style="margin:-4px 0 12px">${U.pill(d.urgence, ton(d.urgence))} ${U.pill(d.statut || "Re\xE7ue", "info")} <span class="ld-mute">par ${esc(d.demandeur || "?")} le ${esc(dateFr(d.cree_le))}</span></div>
<div class="ld-grille ld-g2">${U.carte("Description", `<pre class="ld-pre">${esc(d.description || "\u2014")}</pre>`)}
${U.carte("Suivi", U.table(["Date", "\xC9tape", "Note", "Par"], E2.map((e) => [esc(dateFr(e.quand)), esc(e.statut), esc(e.note || ""), esc(e.par || "")])) + (isAdmin(req) ? `<form method="post" action="/leads/demandes/${d.id}/etape" style="margin-top:10px">${hidden(req)}<div class="ld-form">${U.champ("Nouvelle \xE9tape", U.select("statut", STATUTS_DEMANDE, suivant))}${U.champ("Note", U.input("note", "", { placeholder: "ce qui a \xE9t\xE9 fait" }))}</div><div class="ld-actions"><button class="btn btn-sm btn-primary">Mettre \xE0 jour</button></div></form>` : ""))}</div>
<a class="btn btn-sm btn-link" href="/leads/demandes">\u2190 Toutes les demandes</a>`;
      U.page(req, res, d.titre, "demandes", html);
    };
    var etape = async (req, res) => {
      if (!isAdmin(req)) return refuse(res);
      const b = req.body || {}, t = await tables();
      const statut = STATUTS_DEMANDE.includes(b.statut) ? b.statut : null;
      if (!statut) return go(res, `/leads/demandes/${req.params.id}`, "Statut inconnu", true);
      await t.demandes.updateRow({ statut, maj_le: /* @__PURE__ */ new Date() }, +req.params.id);
      await t.etapes.insertRow({ demande: +req.params.id, statut, quand: /* @__PURE__ */ new Date(), note: String(b.note || "").slice(0, 2e3), par: req.user && req.user.email || "" });
      go(res, `/leads/demandes/${req.params.id}`, "\xC9tape ajout\xE9e");
    };
    module2.exports = { liste, creer, fiche, etape, alerter };
  }
});

// ../src/pages/reglages.js
var require_reglages = __commonJS({
  "../src/pages/reglages.js"(exports2, module2) {
    "use strict";
    var { esc, isAdmin, hidden, go, flowApi } = require_core();
    var { tables, MAILS } = require_schema();
    var { reglages: lireReglages, json, liste } = require_conf();
    var { installer, regler_ecouteur, etat_ecouteur, manque } = require_installer();
    var { retraiter } = require_dossier();
    var U = require_ui();
    var refuse = (res) => res.status(403).send("R\xE9serv\xE9 aux administrateurs");
    var sitesTexte = (s) => (json(s, []) || []).map((x) => `${x.domaine} | ${(x.noms || []).join(" / ")} | ${x.origine || ""}`).join("\n");
    var sitesLire = (t) => String(t || "").split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[0]).map(([domaine, noms, origine]) => ({ domaine: domaine.toLowerCase().replace(/^www\./, ""), noms: String(noms || "").split("/").map((x) => x.trim()).filter(Boolean), origine: origine || domaine.replace(/[.-]/g, "_") }));
    var page = async (req, res) => {
      if (!isAdmin(req)) return refuse(res);
      const t = await tables();
      const R2 = await lireReglages();
      const C = json(R2.crm_reglages, {});
      const e = await etat_ecouteur().catch(() => null);
      const siege = await t.siege.getRows({});
      const api = flowApi();
      const pre = R2.prefixe_secrets || "LEADS_CRM";
      const a = async (n) => api && await api.hasSecret(n) ? U.pill("rang\xE9", "ok") : U.pill("absent", "warn");
      const m = manque();
      const html = `${m.length ? `<div class="ld-flash ko">Blocs manquants : ${esc(m.join(", "))}. Mets \xE0 jour dysizz-flow.</div>` : ""}
<form method="post" action="/leads/reglages">${hidden(req)}
${U.carte("CRM", `<div class="ld-form">
${U.champ("CRM du client", U.select("crm", [["immofacile", "Immofacile (API V2)"], ["salesforce", "Salesforce"]], R2.crm))}
${U.champ("Immofacile \xB7 site_id", U.input("if_site_id", C.site_id || ""))}${U.champ("Immofacile \xB7 adresse de l'API", U.input("if_base", C.base || "https://v2.immo-facile.com/api"))}
${U.champ(`Immofacile \xB7 identifiants (Basic) ${await a(pre + "_BASIC")}`, U.input("s_basic", "", { type: "password", placeholder: "laisser vide pour garder" }), "rang\xE9 chiffr\xE9 dans le coffre, jamais r\xE9affich\xE9")}
${U.champ("Immofacile \xB7 groupe \xAB Demandeur \xBB (id)", U.input("if_groupe", C.groupe_demandeur || ""))}
${U.champ("Immofacile \xB7 type d'action pour le message du prospect (id)", U.input("if_action", C.action_lead || ""), "facultatif : le message est not\xE9 dans l'historique du contact (GET /actions/types)")}
${U.champ("Salesforce \xB7 domaine", U.input("sf_domaine", C.domaine || "", { placeholder: "https://monentreprise.my.salesforce.com" }))}${U.champ("Salesforce \xB7 objet contact", U.select("sf_objet", ["Lead", "Contact"], (C.contact || {}).objet || "Lead"))}
${U.champ(`Salesforce \xB7 client_id ${await a(pre + "_CLIENT_ID")}`, U.input("s_client_id", "", { type: "password" }))}${U.champ(`Salesforce \xB7 client_secret ${await a(pre + "_CLIENT_SECRET")}`, U.input("s_client_secret", "", { type: "password" }))}
${U.champ(`Salesforce \xB7 refresh_token (facultatif) ${await a(pre + "_REFRESH_TOKEN")}`, U.input("s_refresh_token", "", { type: "password" }))}
${U.champ("R\xE9glages avanc\xE9s (JSON)", U.zone("crm_avance", JSON.stringify(Object.fromEntries(Object.entries(C).filter(([k]) => !["site_id", "base", "groupe_demandeur", "action_lead", "domaine"].includes(k))), null, 1), 4), "ex. correspondance des champs Salesforce, noms des champs du consentement")}
</div>`)}
${U.carte("Mode et envoi", `<div class="ld-form">
${U.champ("Mode", U.select("mode", [["ombre", "OMBRE \u2014 le CRM est seulement lu, les \xE9critures sont not\xE9es"], ["reel", "R\xC9EL \u2014 cr\xE9e / compl\xE8te les contacts, lie les biens, pose le consentement"]], R2.mode))}
${U.champ("Pour passer en r\xE9el, tape REEL", U.input("confirmer", "", { placeholder: "REEL" }))}
${U.champ("", U.coche("envoi_mails", !!R2.envoi_mails, "Envoyer les mails aux n\xE9gociateurs") + `<small class="ld-mute">Phase 1 : l'envoi n'est pas branch\xE9 dans le workflow (le service en production continue d'envoyer).</small>`)}
${U.champ("", U.coche("utiliser_relais", R2.utiliser_relais !== false, "Utiliser l'adresse relais du portail quand le prospect n'a pas donn\xE9 d'e-mail"))}
</div>`)}
${U.carte("Consentement anti-d\xE9marchage", `<div class="ld-form">${U.champ("", U.coche("consentement_actif", !!R2.consentement_actif, "Enregistrer le consentement sur la fiche client \xE0 chaque lead de portail"))}
${U.champ("Libell\xE9", U.input("consentement_libelle", R2.consentement_libelle || ""), "{portail} et {date} sont remplac\xE9s. Le mail d'origine est joint en preuve (.eml). \xC0 valider par le client.")}</div>`)}
${U.carte("Bo\xEEte des leads (\xE9coute en temps r\xE9el)", `<div class="ld-form">
${U.champ("Serveur IMAP", U.input("m_serveur", e ? e.serveur : "", { placeholder: "ssl0.ovh.net, zimbra\u2026" }))}${U.champ("Port", U.input("m_port", e ? e.port : 993))}
${U.champ("Identifiant", U.input("m_utilisateur", e ? e.utilisateur : ""))}${U.champ(`Mot de passe ${await a("LEADS_MAIL_MDP")}`, U.input("s_mail", "", { type: "password", placeholder: "laisser vide pour garder" }))}
${U.champ("", U.coche("m_actif", e ? e.actif : false, "\xC9couter cette bo\xEEte (lecture seule : rien n'est marqu\xE9 lu ni d\xE9plac\xE9)"))}</div>
${e ? `<p class="ld-mute" style="margin:8px 0 0">\xC9tat : ${esc(e.etat || "\u2014")} \xB7 ${+e.recus || 0} mail(s) re\xE7u(s)${e.erreur ? " \xB7 " + esc(e.erreur) : ""}</p>` : ""}`)}
${U.carte("Reconnaissance", `<div class="ld-form">
${U.champ("Domaines de l'agence", U.zone("domaines_agence", liste(R2.domaines_agence).join("\n"), 4), "un par ligne : les mails venant de ces domaines sont internes (transferts d\xE9pli\xE9s)")}
${U.champ("Sites d'agence (leads \xAB AC3 \xBB)", U.zone("sites", sitesTexte(R2.sites), 5, { placeholder: "selectionhabitat.com | SELECTION HABITAT | selectionhabitat_com" }), "domaine | noms affich\xE9s (s\xE9par\xE9s par /) | code de l'origine")}
${U.champ("Objets des campagnes (r\xE9ponses \xE0 trier)", U.zone("objets_campagnes", R2.objets_campagnes || "", 3))}
${U.champ("Identifiant CRM dans les liens (motif)", U.zone("id_crm_liens", R2.id_crm_liens || "", 2), "un motif par ligne ; ex. immo-facile-(\\d{8})\\b (8 chiffres : un bien ; 6 chiffres : c'est une agence)")}
${U.champ("Portail \u2192 origine (JSON)", U.zone("origines_portail", typeof R2.origines_portail === "string" ? R2.origines_portail : JSON.stringify(R2.origines_portail || {}), 4), '{"leboncoin":"leboncoin","seloger":"se_loger"}')}
${U.champ("Si\xE8ge (re\xE7oit toujours)", U.zone("siege", siege.filter((s) => s.actif !== false).map((s) => s.email).join("\n"), 3))}
</div>`)}
<div class="ld-actions"><button class="btn btn-primary">Enregistrer</button></div></form>
${U.carte("Outils", `<div class="ld-actions">
<form method="post" action="/leads/reglages/tester">${hidden(req)}<button class="btn btn-sm btn-outline-primary">Tester la connexion au CRM</button></form>
<form method="post" action="/leads/reglages/installer">${hidden(req)}<button class="btn btn-sm btn-outline-secondary">Installer / r\xE9parer le workflow</button></form>
<form method="post" action="/leads/reglages/installer">${hidden(req)}<input type="hidden" name="reecrire" value="1"><button class="btn btn-sm btn-outline-danger">R\xE9\xE9crire le workflow</button></form>
<a class="btn btn-sm btn-link" href="/dysizz-flow/workflows">Voir les workflows</a><a class="btn btn-sm btn-link" href="/dysizz-flow/ecouteurs">\xC9couteurs</a></div>`)}`;
      U.page(req, res, "R\xE9glages", "reglages", html);
    };
    var enregistrer = async (req, res) => {
      if (!isAdmin(req)) return refuse(res);
      const b = req.body || {}, t = await tables();
      const R2 = await lireReglages();
      const api = flowApi();
      const pre = R2.prefixe_secrets || "LEADS_CRM";
      let avance = {};
      try {
        avance = b.crm_avance ? JSON.parse(b.crm_avance) : {};
      } catch (e) {
        return go(res, "/leads/reglages", "R\xE9glages avanc\xE9s : JSON invalide", true);
      }
      try {
        if (b.origines_portail) JSON.parse(b.origines_portail);
      } catch (e) {
        return go(res, "/leads/reglages", "Portail \u2192 origine : JSON invalide", true);
      }
      const crm = b.crm === "salesforce" ? "salesforce" : "immofacile";
      const C = { ...avance, ...crm === "immofacile" ? { site_id: String(b.if_site_id || "").trim(), base: String(b.if_base || "").trim() || void 0, groupe_demandeur: String(b.if_groupe || "").trim() || void 0, action_lead: String(b.if_action || "").trim() || void 0 } : { domaine: String(b.sf_domaine || "").trim(), contact: { ...avance.contact || {}, objet: b.sf_objet === "Contact" ? "Contact" : "Lead" } } };
      let mode = b.mode === "reel" ? "reel" : "ombre";
      let note = "";
      if (mode === "reel" && R2.mode !== "reel" && String(b.confirmer || "").trim().toUpperCase() !== "REEL") {
        mode = "ombre";
        note = " \u2014 mode r\xE9el NON activ\xE9 (tape REEL pour confirmer)";
      }
      const row = {
        crm,
        crm_reglages: JSON.stringify(C),
        mode,
        envoi_mails: b.envoi_mails === "on",
        utiliser_relais: b.utiliser_relais === "on",
        consentement_actif: b.consentement_actif === "on",
        consentement_libelle: String(b.consentement_libelle || "").slice(0, 300),
        domaines_agence: liste(b.domaines_agence).join(", "),
        sites: JSON.stringify(sitesLire(b.sites)),
        objets_campagnes: String(b.objets_campagnes || ""),
        id_crm_liens: String(b.id_crm_liens || ""),
        origines_portail: String(b.origines_portail || "{}"),
        prefixe_secrets: pre,
        maj_le: /* @__PURE__ */ new Date()
      };
      const ex = (await t.reglages.getRows({}, { limit: 1 }))[0];
      if (ex) await t.reglages.updateRow(row, ex.id);
      else await t.reglages.insertRow(row);
      for (const [champ, suffixe] of [["s_basic", "BASIC"], ["s_client_id", "CLIENT_ID"], ["s_client_secret", "CLIENT_SECRET"], ["s_refresh_token", "REFRESH_TOKEN"]]) if (String(b[champ] || "").trim()) await api.writeSecret(`${pre}_${suffixe}`, String(b[champ]).trim(), "dysizz-leads");
      if (String(b.s_mail || "").trim()) await api.writeSecret("LEADS_MAIL_MDP", String(b.s_mail).trim(), "dysizz-leads : bo\xEEte des leads");
      const siege = liste(b.siege).filter((x) => /@/.test(x));
      await t.siege.deleteRows({});
      for (const email of siege) await t.siege.insertRow({ email: email.toLowerCase(), libelle: "Si\xE8ge", actif: true });
      if (String(b.m_serveur || "").trim() && String(b.m_utilisateur || "").trim()) {
        try {
          await regler_ecouteur({ serveur: b.m_serveur.trim(), port: b.m_port, utilisateur: b.m_utilisateur.trim(), secret: "LEADS_MAIL_MDP", actif: b.m_actif === "on" });
        } catch (e) {
          return go(res, "/leads/reglages", "R\xE9glages enregistr\xE9s, mais \xE9couteur : " + e.message, true);
        }
      }
      go(res, "/leads/reglages", "R\xE9glages enregistr\xE9s" + note, !!note);
    };
    var tester = async (req, res) => {
      if (!isAdmin(req)) return refuse(res);
      try {
        const { charger } = require_conf();
        const { crm } = await charger();
        const c = flowApi().crmDepuisCoffre(crm.type, crm.reglages, crm.prefixe, "ombre");
        await c.tester();
        go(res, "/leads/reglages", `Connexion ${crm.type} r\xE9ussie (lecture seule)`);
      } catch (e) {
        go(res, "/leads/reglages", "Connexion impossible : " + e.message, true);
      }
    };
    var installerPost = async (req, res) => {
      if (!isAdmin(req)) return refuse(res);
      try {
        const log = await installer({ reecrire: (req.body || {}).reecrire === "1" });
        go(res, "/leads/reglages", log.join(" \xB7 "));
      } catch (e) {
        go(res, "/leads/reglages", e.message, true);
      }
    };
    var importPage = async (req, res) => {
      if (!isAdmin(req)) return refuse(res);
      const t = await tables();
      const n = { agences: (await t.agences.getRows({})).length, personnes: (await t.personnes.getRows({})).length, origines: (await t.origines.getRows({})).length };
      const Table = require("@saltcorn/data/models/table");
      const tm = Table.findOne({ name: MAILS });
      const S = require("@saltcorn/data/db").getTenantSchema();
      const sans = tm ? +(await require("@saltcorn/data/db").query(`select count(*) n from "${S}".${MAILS} m where not exists (select 1 from "${S}".ld_leads l where l.mail_id = m.id)`)).rows[0].n : 0;
      const html = `${U.carte("Reprendre les r\xE9f\xE9rentiels d'une sauvegarde Saltcorn", `<p>Dans le dossier <code>tables/</code> d'une sauvegarde, choisis : <code>agence.json</code>, <code>contact_negociateur.json</code>, <code>origine.json</code>, <code>destinataire_custom.json</code>, <code>destinataire_custom_nego.json</code>. Seuls ces fichiers sont lus ; les secrets des sauvegardes (config SMTP, jetons\u2026) ne sont jamais import\xE9s.</p>
<p>Pour comparer avec l'ancien syst\xE8me, ajoute le fichier <code>comparaison-ancien.json</code> (fabriqu\xE9 depuis la sauvegarde par <code>tools/comparaison-sauvegarde.py</code>) : chaque lead est reli\xE9 au r\xE9sultat de l'ancien (statut, bien, destinataires) par le num\xE9ro du mail dans la bo\xEEte.</p>
<p class="ld-mute">Aujourd'hui : ${n.agences} agence(s), ${n.personnes} personne(s), ${n.origines} origine(s). L'import compl\xE8te et met \xE0 jour, il ne supprime rien.</p>
<form method="post" action="/leads/import" enctype="multipart/form-data">${hidden(req)}<input class="form-control form-control-sm" type="file" name="fichiers" multiple accept=".json" required>
<div class="ld-actions">${U.coche("senegal", false, "Reprendre la r\xE8gle cod\xE9e en dur de l'ancien syst\xE8me (n\xE9gociateurs @selectionsenegal.com \u2192 assistante seule gemma@selectionhabitat.com)")}</div>
<div class="ld-actions"><button class="btn btn-sm btn-primary">Importer</button></div></form>`)}
${U.carte("Rejouer en ombre", `<p>${sans} mail(s) re\xE7u(s) n'ont pas encore de lead. Ils sont trait\xE9s en mode ombre (CRM lu, rien d'\xE9crit), par lots de 50.</p><form method="post" action="/leads/import/rejouer">${hidden(req)}<button class="btn btn-sm btn-outline-primary" ${sans ? "" : "disabled"}>Traiter 50 mails</button></form>`)}`;
      U.page(req, res, "Import", "import", html);
    };
    var lireFichiers = (req) => {
      const f = req.files && req.files.fichiers;
      const out = {};
      for (const x of [].concat(f || [])) {
        const nom = String(x.name || "").toLowerCase().replace(/\.json$/, "");
        try {
          const buf = x.data && x.data.length ? x.data : x.tempFilePath ? require("fs").readFileSync(x.tempFilePath) : Buffer.alloc(0);
          out[nom] = JSON.parse(buf.toString("utf8"));
        } catch (e) {
        }
      }
      return out;
    };
    var importPost = async (req, res) => {
      if (!isAdmin(req)) return refuse(res);
      const F = lireFichiers(req), t = await tables(), log = [];
      const upsert = async (T, cle, row) => {
        const ex = await T.getRow({ [cle]: row[cle] });
        if (ex) {
          await T.updateRow(row, ex.id);
          return ex.id;
        }
        return T.insertRow(row);
      };
      if (Array.isArray(F.agence)) {
        for (const a of F.agence) await upsert(t.agences, "crm_id", { nom: a.nom, crm_id: String(a.agency_id || ""), boites: [...new Set([a.boite].concat(String(a.emails || "").match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g) || []).filter(Boolean).map((x) => String(x).toLowerCase()))].join(", "), actif: true });
        log.push(`${F.agence.length} agences`);
      }
      if (Array.isArray(F.origine)) {
        for (const o of F.origine) await upsert(t.origines, "code", { code: o.code, libelle: o.libelle, crm_id: String(o.origin_id || "") });
        log.push(`${F.origine.length} origines`);
      }
      if (Array.isArray(F.contact_negociateur)) {
        const assist = /* @__PURE__ */ new Map();
        for (const c of F.contact_negociateur) {
          const e = String(c.email_secretaire || "").toLowerCase().trim();
          if (e && !assist.has(e)) {
            const ex = await t.personnes.getRow({ email: e });
            assist.set(e, ex ? ex.id : await t.personnes.insertRow({ nom: c.nom_secretaire || e, email: e, role: "assistante", temps: "plein", actif: true }));
          }
        }
        for (const c of F.contact_negociateur) {
          const e = String(c.email_secretaire || "").toLowerCase().trim();
          await upsert(t.personnes, "crm_id", { nom: c.nom || c.nom_immofacile, email: String(c.email_negociateur || "").toLowerCase(), role: "negociateur", crm_id: String(c.user_id), agence_crm_id: String(c.agency_id || ""), assistante: e ? assist.get(e) : null, telephone: c.telephone || "", actif: c.actif !== false });
        }
        log.push(`${F.contact_negociateur.length} n\xE9gociateurs, ${assist.size} assistant(e)s`);
      }
      if (Array.isArray(F.destinataire_custom)) {
        const P = await t.personnes.getRows({});
        for (const d of F.destinataire_custom.filter((x) => x.actif)) {
          if (d.portee === "tous") {
            if (!await t.siege.getRow({ email: d.email })) await t.siege.insertRow({ email: d.email, libelle: d.libelle || "Si\xE8ge", actif: true });
            continue;
          }
          const ids = (F.destinataire_custom_nego || []).filter((x) => x.custom === d.id).map((x) => (P.find((p) => p.crm_id === String(x.user_id)) || {}).id).filter(Boolean);
          if (ids.length && !await t.regles.getRow({ libelle: d.libelle })) await t.regles.insertRow({ libelle: d.libelle || d.email, tous: false, negociateurs: ids.map((i) => "p:" + i).join(","), couper_negociateur: false, assistante: "garder", adresses_libres: d.email, actif: true, maj_le: /* @__PURE__ */ new Date() });
        }
        log.push("destinataires en plus \u2192 si\xE8ge et r\xE8gles");
      }
      if ((req.body || {}).senegal === "on" && !await t.regles.getRow({ libelle: "S\xE9n\xE9gal : assistante seule" })) {
        const P = await t.personnes.getRows({});
        const ids = P.filter((p) => /@selectionsenegal\.com$/.test(p.email || "") && p.role !== "assistante" && ["voury", "christophe", "claude", "josephine"].includes(String(p.email).split("@")[0])).map((p) => "p:" + p.id);
        if (ids.length) {
          await t.regles.insertRow({ libelle: "S\xE9n\xE9gal : assistante seule", tous: false, negociateurs: ids.join(","), couper_negociateur: true, assistante: "remplacer", assistante_remplacante: "gemma@selectionhabitat.com", adresses_libres: "", actif: true, maj_le: /* @__PURE__ */ new Date() });
          log.push("r\xE8gle S\xE9n\xE9gal");
        }
      }
      const comp = Object.entries(F).find(([k, v]) => /^comparaison/.test(k) && Array.isArray(v));
      if (comp) {
        const db = require("@saltcorn/data/db"), S = db.getTenantSchema();
        let n = 0;
        for (const c of comp[1]) {
          if (!c || c.uid === void 0 || c.uid === null || !c.statut) continue;
          const r = await db.query(`update "${S}".ld_leads l set ancien_statut = $1, ancien_bien = $2, ancien_destinataires = $3 from "${S}".${MAILS} m where m.id = l.mail_id and m.uid = $4 and trim(m.objet) = trim($5)`, [String(c.statut), c.bien ? String(c.bien) : "", String(c.destinataires || "").split(/,\s*/).filter(Boolean).sort().join(", "), +c.uid, String(c.objet || "")]);
          n += r.rowCount || 0;
        }
        log.push(`${n} lead(s) reli\xE9s aux r\xE9sultats de l'ancien syst\xE8me`);
      }
      go(res, "/leads/import", log.length ? "Import\xE9 : " + log.join(", ") : "Aucun fichier reconnu", !log.length);
    };
    var rejouer = async (req, res) => {
      if (!isAdmin(req)) return refuse(res);
      const db = require("@saltcorn/data/db"), S = db.getTenantSchema();
      const ids = (await db.query(`select m.id from "${S}".${MAILS} m where not exists (select 1 from "${S}".ld_leads l where l.mail_id = m.id) order by m.date_envoi, m.id limit 50`)).rows.map((r) => r.id);
      let ok = 0, ko = 0;
      for (const id of ids) {
        try {
          await retraiter(id, { forcerOmbre: true });
          ok++;
        } catch (e) {
          ko++;
        }
      }
      go(res, "/leads/import", `${ok} mail(s) trait\xE9(s) en ombre${ko ? `, ${ko} en \xE9chec` : ""}`, !!ko && !ok);
    };
    module2.exports = { page, enregistrer, tester, installerPost, importPage, importPost, rejouer, sitesLire };
  }
});

// ../src/pages/chaine.js
var require_chaine = __commonJS({
  "../src/pages/chaine.js"(exports2, module2) {
    "use strict";
    var { esc, isAdmin, hidden, go, dateFr, flowApi } = require_core();
    var { tables } = require_schema();
    var { reglages: lireReglages, json, liste } = require_conf();
    var { synchroniser, evenementBien } = require_catalogue();
    var U = require_ui();
    var refuse = (res) => res.status(403).send("R\xE9serv\xE9 aux administrateurs");
    var db = () => require("@saltcorn/data/db");
    var ETAPES = [
      ["bien", "Rapprocher le bien", "sans cette \xE9tape, pas de n\xE9gociateur tir\xE9 du bien"],
      ["contact", "Retrouver ou cr\xE9er le contact", ""],
      ["suivi", "Lier le contact au bien (suivi)", ""],
      ["projet", "Projet de recherche (crit\xE8res du bien demand\xE9)", ""],
      ["commentaire", "Commentaire = conversation enti\xE8re", "reconstruit \xE0 chaque mail"],
      ["consentement", "Consentement anti-d\xE9marchage", "un par contact, preuve .eml jointe"],
      ["action", "Action \xAB message re\xE7u \xBB dans l'historique", "si un type d'action est r\xE9gl\xE9"],
      ["notification", "Calculer les destinataires", "l'envoi reste \xE0 part (r\xE9glage \xAB Envoyer les mails \xBB)"]
    ];
    var page = async (req, res) => {
      if (!isAdmin(req)) return refuse(res);
      const t = await tables();
      const R2 = await lireReglages();
      const E2 = json(R2.etapes, {});
      const M = { prix: 0.1, surface: 0.2, pieces: 1, ...json(R2.marges_projet, {}) };
      const portails = await t.portails.getRows({}, { orderBy: "nom" });
      const S = db().getTenantSchema();
      const nouveaux = (await db().query(`select lower(substring(expediteur from '@([A-Za-z0-9.-]+)')) d, count(*) n, max(objet) o, max(id) id from "${S}".ld_leads
    where (portail = 'inconnu' or statut = 'a_trier') and traite_le > now() - interval '30 days' group by 1 order by 2 desc limit 15`).catch(() => ({ rows: [] }))).rows;
      const nbBiens = +(await db().query(`select count(*) n from "${S}".ld_biens where supprime is not true`).catch(() => ({ rows: [{ n: 0 }] }))).rows[0].n;
      const url = `${req.protocol}://${req.get("host")}/leads/crochet/crm`;
      const pre = R2.prefixe_secrets || "LEADS_CRM";
      const api = flowApi();
      const aSecret = api ? await api.hasSecret(pre + "_WEBHOOK") : false;
      const html = `<form method="post" action="/leads/chaine">${hidden(req)}
${U.carte("\xC9tapes de la cha\xEEne", `<p class="ld-mute" style="margin:0 0 8px">Tout est actif par d\xE9faut. Un client qui ne veut qu'une partie coupe le reste ; la lecture des mails et le tableau de bord restent toujours l\xE0.</p>
<div class="ld-form">${ETAPES.map(([k, l, a]) => U.champ("", U.coche("e_" + k, E2[k] !== false, esc(l)) + (a ? `<small class="ld-mute">${esc(a)}</small>` : ""))).join("")}</div>`)}
${U.carte("Relances et commentaire", `<div class="ld-form">
${U.champ("Relance d'un dossier d\xE9j\xE0 suivi", U.select("notifier_relances", [["negociateur", "au n\xE9gociateur et \xE0 son assistant(e) seulement"], ["tous", "\xE0 tous les destinataires (comme un nouveau lead)"], ["non", "\xE0 personne (seulement dans le CRM)"]], R2.notifier_relances || "negociateur"))}
${U.champ("Taille maximale du commentaire", U.input("commentaire_max", R2.commentaire_max || 6e3, { type: "number" }), "au-del\xE0 : la 1re demande et les messages les plus r\xE9cents")}
${U.champ("Projet de recherche \xB7 prix max", U.input("m_prix", Math.round(M.prix * 100), { type: "number" }), "en % au-dessus du prix du bien")}
${U.champ("Projet de recherche \xB7 surface min", U.input("m_surface", Math.round(M.surface * 100), { type: "number" }), "en % en dessous de la surface du bien")}
${U.champ("Projet de recherche \xB7 pi\xE8ces min", U.input("m_pieces", M.pieces, { type: "number" }), "pi\xE8ces en moins")}
${U.champ("Conserver le texte des mails", U.input("retention_jours", R2.retention_jours || 0, { type: "number" }), "en jours ; 0 = toujours. Au-del\xE0, le corps est effac\xE9 (l'empreinte et la preuve restent dans le CRM).")}
</div>`)}
<div class="ld-actions"><button class="btn btn-primary">Enregistrer</button></div></form>

${U.carte("Catalogue local des biens", `<p style="margin:0 0 8px">${nbBiens} bien(s) \xB7 ${esc(R2.catalogue_etat || "jamais synchronis\xE9")}</p>
<p class="ld-mute" style="margin:0 0 8px">Le rapprochement se fait sur ce catalogue (rapide, sans appel au CRM). Mise \xE0 jour : une fois par heure (biens modifi\xE9s), et en temps r\xE9el par webhook si le CRM le permet.</p>
<div class="ld-actions"><form method="post" action="/leads/catalogue">${hidden(req)}<button class="btn btn-sm btn-outline-primary">Mettre \xE0 jour maintenant</button></form>
<form method="post" action="/leads/catalogue">${hidden(req)}<input type="hidden" name="complet" value="1"><button class="btn btn-sm btn-outline-secondary">Tout recharger</button></form></div>
<p style="margin:12px 0 4px"><b>Webhook Immofacile</b> ${aSecret ? U.pill("cl\xE9 rang\xE9e", "ok") : U.pill("cl\xE9 absente", "warn")}</p>
<p class="ld-mute ld-mono" style="margin:0">POST /hooks { "url": "${esc(url)}", "origines": ["PRODUCT_CREATE","PRODUCT_UPDATE","PRODUCT_DELETE"], "headers": { "X-Api-Key": "&lt;la cl\xE9&gt;" } }</p>
<form method="post" action="/leads/chaine/webhook" class="ld-inline" style="margin-top:8px">${hidden(req)}${U.input("cle", "", { type: "password", placeholder: "cl\xE9 du webhook (rang\xE9e chiffr\xE9e)" })}<button class="btn btn-sm btn-outline-secondary">Ranger la cl\xE9</button></form>`)}

${U.carte("Portails d\xE9clar\xE9s (sans code)", `${U.table(["Nom", "Domaines", "Objets qui sont des leads", "R\xE9f\xE9rence", ""], portails.map((p) => [
        esc(p.nom),
        `<span class="ld-mono">${esc(p.domaines)}</span>`,
        `<span class="ld-mono">${esc(String(p.objets_lead || "").split("\n").join(" \xB7 "))}</span>`,
        `<span class="ld-mono">${esc(p.reference || "")}</span>`,
        `<form method="post" action="/leads/portails/${p.id}/supprimer" class="ld-inline">${hidden(req)}<button class="btn btn-sm btn-link">retirer</button></form>`
      ]), "Aucun portail d\xE9clar\xE9 : ceux du code suffisent pour l'instant.")}
<form method="post" action="/leads/portails" style="margin-top:10px">${hidden(req)}<div class="ld-form">
${U.champ("Nom", U.input("nom", req.query.domaine || "", { required: true }))}
${U.champ("Domaines de l'exp\xE9diteur", U.input("domaines", req.query.domaine || "", { placeholder: "exemple-immo.fr", required: true }), "s\xE9par\xE9s par des virgules")}
${U.champ("Objets qui sont des leads", U.zone("objets_lead", "", 2, { placeholder: "nouveau contact\ndemande d'information" }), "un par ligne (vide = tous les mails de ce portail)")}
${U.champ("Objets qui ne sont pas des leads", U.zone("objets_non_lead", "", 2, { placeholder: "facture\nnewsletter" }))}
${U.champ("Libell\xE9s en plus (JSON)", U.zone("libelles", "", 2, { placeholder: '{"t\xE9l. perso": "telephone", "n\xB0 client": "ignorer"}' }), "champs : email, telephone, nom, prenom, reference, prix, ville, code_postal, message\u2026")}
${U.champ("R\xE9f\xE9rence (expression)", U.input("reference", "", { placeholder: "R\xE9f\\\\.?\\\\s*:\\\\s*(\\\\S+)" }))}
</div><div class="ld-actions"><button class="btn btn-sm btn-primary">D\xE9clarer ce portail</button></div></form>`)}

${U.carte("Nouveaux exp\xE9diteurs \xB7 30 jours", U.table(["Domaine", "Mails", "Exemple", ""], nouveaux.filter((n) => n.d).map((n) => [esc(n.d), n.n, `<a href="/leads/l/${n.id}">${esc(String(n.o || "").slice(0, 70))}</a>`, `<a class="btn btn-sm btn-link" href="/leads/chaine?domaine=${encodeURIComponent(n.d)}">d\xE9clarer comme portail</a>`]), "Aucun exp\xE9diteur inconnu."))}`;
      U.page(req, res, "Cha\xEEne et portails", "chaine", html);
    };
    var enregistrer = async (req, res) => {
      if (!isAdmin(req)) return refuse(res);
      const b = req.body || {}, t = await tables();
      const etapes = Object.fromEntries(ETAPES.map(([k]) => [k, b["e_" + k] === "on"]).filter(([, v]) => v === false));
      const marges = { prix: Math.max(0, +b.m_prix || 0) / 100, surface: Math.max(0, Math.min(90, +b.m_surface || 0)) / 100, pieces: Math.max(0, +b.m_pieces || 0) };
      const row = {
        etapes: JSON.stringify(etapes),
        notifier_relances: ["negociateur", "tous", "non"].includes(b.notifier_relances) ? b.notifier_relances : "negociateur",
        commentaire_max: Math.max(1e3, Math.min(6e4, +b.commentaire_max || 6e3)),
        marges_projet: JSON.stringify(marges),
        retention_jours: Math.max(0, +b.retention_jours || 0),
        maj_le: /* @__PURE__ */ new Date()
      };
      const ex = (await t.reglages.getRows({}, { limit: 1 }))[0];
      if (ex) await t.reglages.updateRow(row, ex.id);
      else await t.reglages.insertRow(row);
      go(res, "/leads/chaine", "Cha\xEEne enregistr\xE9e");
    };
    var portailAjouter = async (req, res) => {
      if (!isAdmin(req)) return refuse(res);
      const b = req.body || {}, t = await tables();
      if (b.libelles) {
        try {
          JSON.parse(b.libelles);
        } catch (e) {
          return go(res, "/leads/chaine", "Libell\xE9s : JSON invalide", true);
        }
      }
      for (const x of [...String(b.objets_lead || "").split("\n"), ...String(b.objets_non_lead || "").split("\n"), b.reference || ""].filter((s) => s.trim())) {
        try {
          new RegExp(x, "i");
        } catch (e) {
          return go(res, "/leads/chaine", `Expression invalide : ${x}`, true);
        }
      }
      await t.portails.insertRow({ nom: String(b.nom).slice(0, 100), domaines: liste(b.domaines).map((x) => x.toLowerCase()).join(", "), objets_lead: String(b.objets_lead || ""), objets_non_lead: String(b.objets_non_lead || ""), libelles: String(b.libelles || ""), reference: String(b.reference || ""), nature: "lead", actif: true });
      go(res, "/leads/chaine", "Portail d\xE9clar\xE9 : les prochains mails seront reconnus. \xAB Retraiter \xBB les anciens depuis leur fiche.");
    };
    var portailRetirer = async (req, res) => {
      if (!isAdmin(req)) return refuse(res);
      const t = await tables();
      await t.portails.deleteRows({ id: +req.params.id });
      go(res, "/leads/chaine", "Portail retir\xE9");
    };
    var catalogue = async (req, res) => {
      if (!isAdmin(req)) return refuse(res);
      try {
        const r = await synchroniser({ complet: (req.body || {}).complet === "1" });
        go(res, "/leads/chaine", r.message, !r.ok);
      } catch (e) {
        go(res, "/leads/chaine", "Catalogue : " + e.message, true);
      }
    };
    var webhookCle = async (req, res) => {
      if (!isAdmin(req)) return refuse(res);
      const cle = String((req.body || {}).cle || "").trim();
      if (cle.length < 24) return go(res, "/leads/chaine", "Cl\xE9 trop courte (24 caract\xE8res au moins)", true);
      const R2 = await lireReglages();
      await flowApi().writeSecret((R2.prefixe_secrets || "LEADS_CRM") + "_WEBHOOK", cle, "dysizz-leads : webhook du CRM");
      go(res, "/leads/chaine", "Cl\xE9 du webhook rang\xE9e");
    };
    var crochet = async (req, res) => {
      try {
        const R2 = await lireReglages();
        const ok = await flowApi().secretEgal((R2.prefixe_secrets || "LEADS_CRM") + "_WEBHOOK", req.get("x-api-key"));
        if (!ok) return res.status(401).json({ error: "cl\xE9 invalide" });
        const b = req.body || {};
        const type = String(b.event_type || b.type || ""), id = b.resource_id || b.id;
        if (!/^PRODUCT_/i.test(type) || !id) return res.status(200).json({ ignore: true });
        res.status(200).json({ recu: true });
        const db_ = require("@saltcorn/data/db"), tenant = db_.getTenantSchema();
        setImmediate(() => db_.runWithTenant(tenant, () => evenementBien(type, id)).catch(() => {
        }));
      } catch (e) {
        if (!res.headersSent) res.status(500).json({ error: "erreur interne" });
      }
    };
    module2.exports = { page, enregistrer, portailAjouter, portailRetirer, catalogue, webhookCle, crochet };
  }
});

// ../src/blocks.js
var require_blocks = __commonJS({
  "../src/blocks.js"(exports2, module2) {
    "use strict";
    var { charger } = require_conf();
    var { enregistrer, traiterMail } = require_dossier();
    module2.exports = [
      {
        name: "dzx_leads_conf",
        label: "Leads : charger la configuration",
        category: "Leads immobiliers",
        icon: "fas fa-sliders-h",
        output: "leads_conf",
        description: "Lit agences, n\xE9gociateurs, assistant(e)s, r\xE8gles d'envoi, absences, origines, sites et r\xE9glages du client. Donne leads_conf (moteur) et leads_crm (type, r\xE9glages, mode).",
        params: [],
        run: async () => {
          const { conf, crm, reglages } = await charger();
          return { __merge: { leads_conf: conf, leads_crm: crm, leads_reglages: { envoi_mails: !!reglages.envoi_mails, mode: crm.mode } } };
        }
      },
      {
        name: "dzx_leads_traiter",
        label: "Leads : traiter un mail re\xE7u",
        category: "Leads immobiliers",
        icon: "fas fa-bullseye",
        output: "lead",
        description: "Traite un mail de ld_mails de bout en bout : lecture sans IA, fil de conversation (dossier prospect \xD7 bien), bien (catalogue local), contact, plan CRM ex\xE9cut\xE9 selon le mode (ombre par d\xE9faut), destinataires. Deux mails du m\xEAme prospect ne sont jamais trait\xE9s en m\xEAme temps.",
        params: [{ name: "id", label: "Id du mail (ld_mails)", type: "text", default: "{{id}}", required: true }],
        run: async (p) => {
          const r = await traiterMail(+p.id);
          return { id: r.id, dossier_id: r.dossier_id, statut: r.statut };
        }
      },
      {
        name: "dzx_leads_enregistrer",
        label: "Leads : enregistrer le dossier",
        category: "Leads immobiliers",
        icon: "fas fa-save",
        output: "lead_id",
        description: "Range le r\xE9sultat du traitement dans ld_leads (un lead par mail, mis \xE0 jour si le mail est retrait\xE9).",
        params: [{ name: "dossier", label: "Dossier", type: "json", default: "{{dossier}}" }, { name: "mail", label: "Mail", type: "json", default: "{{mail}}" }],
        run: async (p) => enregistrer(typeof p.dossier === "string" ? JSON.parse(p.dossier) : p.dossier, typeof p.mail === "string" ? JSON.parse(p.mail) : p.mail)
      }
    ];
  }
});

// ../src/taches.js
var require_taches = __commonJS({
  "../src/taches.js"(exports2, module2) {
    "use strict";
    var cluster = require("cluster");
    var G = globalThis[Symbol.for("dysizz-leads.taches")] || (globalThis[Symbol.for("dysizz-leads.taches")] = { minuteurs: /* @__PURE__ */ new Map() });
    var log = (m) => {
      try {
        require("@saltcorn/data/db/state").getState().log(4, "[dysizz-leads] " + m);
      } catch (e) {
      }
    };
    var heure = async () => {
      const { flowApi } = require_core();
      const api = flowApi();
      if (!api) return;
      const jeton = await api.verrou.prendre("leads-taches-horaires").catch(() => null);
      if (!jeton) return;
      try {
        const { reglages } = require_conf();
        const R2 = await reglages();
        const crm = (() => {
          try {
            return JSON.parse(R2.crm_reglages || "{}");
          } catch (e) {
            return {};
          }
        })();
        if (crm.site_id || crm.domaine) {
          try {
            const r = await require_catalogue().synchroniser({ complet: !R2.catalogue_synchro_le });
            if (r && r.ok) log("catalogue " + r.message);
          } catch (e) {
            log("catalogue : " + e.message);
          }
        }
        try {
          const db = require("@saltcorn/data/db"), S = db.getTenantSchema();
          const ids = (await db.query(`select m.id from "${S}".ld_mails m where m.recu_le < now() - interval '10 minutes' and m.recu_le > now() - interval '7 days'
        and not exists (select 1 from "${S}".ld_leads l where l.mail_id = m.id) order by m.date_envoi, m.id limit 100`)).rows.map((r) => r.id);
          let ok = 0;
          for (const id of ids) {
            try {
              await require_dossier().traiterMail(id);
              ok++;
            } catch (e) {
              log(`reprise du mail ${id} : ${e.message}`);
            }
          }
          if (ids.length) log(`reprise : ${ok}/${ids.length} mail(s) retrait\xE9(s)`);
        } catch (e) {
          log("reprise : " + e.message);
        }
        const j = +R2.retention_jours || 0;
        if (j > 0) {
          const db = require("@saltcorn/data/db");
          const r = await db.query(`update "${db.getTenantSchema()}".ld_mails set corps_texte = '', corps_html = '', source_eml = '' where date_envoi < now() - ($1 || ' days')::interval and (corps_texte <> '' or corps_html <> '' or source_eml <> '')`, [String(j)]).catch((e) => ({ rowCount: 0, e }));
          if (r.rowCount) log(`r\xE9tention : texte de ${r.rowCount} mail(s) effac\xE9`);
        }
      } finally {
        await jeton.rendre();
      }
    };
    var planifier = () => {
      if (cluster.isWorker) return;
      const db = require("@saltcorn/data/db");
      const tenant = db.getTenantSchema();
      if (G.minuteurs.has(tenant)) clearInterval(G.minuteurs.get(tenant));
      G.minuteurs.set(tenant, setInterval(() => db.runWithTenant(tenant, heure).catch(() => {
      }), 3600 * 1e3));
      setTimeout(() => db.runWithTenant(tenant, heure).catch(() => {
      }), 60 * 1e3);
    };
    module2.exports = { planifier, heure };
  }
});

// ../src/index.js
var { PLUGIN, VERSION, peutVoir } = require_core();
var { CSS } = require_ui();
var L = require_leads();
var E = require_equipe();
var D = require_demandes();
var R = require_reglages();
var DO = require_dossiers();
var CH = require_chaine();
var asset = (req, res) => {
  if (req.params.file !== "ld.css") return res.status(404).send("");
  res.setHeader("Content-Type", "text/css; charset=utf-8");
  res.setHeader("Cache-Control", req.params.ver === VERSION ? "public, max-age=31536000, immutable" : "public, max-age=300");
  res.end(CSS);
};
var garde = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    res.status(500).send(`<p>Erreur : ${String(e.message).replace(/[<>&]/g, "")}</p>`);
  }
};
module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: PLUGIN,
  dysizz_flow_blocks: () => require_blocks(),
  dysizz_hub: async (req) => peutVoir(req) ? [{ group: "Mes applis", label: "Leads", sub: "leads immobiliers : portails, biens, envoi", url: "/leads", icon: "fas fa-bullseye", color: "#2457d6", size: "m", min_role: 40 }] : [],
  onLoad: async () => {
    try {
      await require_schema().tables();
    } catch (e) {
    }
    try {
      require_taches().planifier();
    } catch (e) {
    }
    try {
      const api = require_core().flowApi();
      if (api && api.enregistrerBlocsExternes) api.enregistrerBlocsExternes();
    } catch (e) {
    }
  },
  routes: [
    { url: "/leads", method: "get", callback: garde(L.tableau) },
    { url: "/leads/liste", method: "get", callback: garde(L.liste) },
    { url: "/leads/l/:id", method: "get", callback: garde(L.fiche) },
    { url: "/leads/l/:id/retraiter", method: "post", callback: garde(L.retraiterPost) },
    { url: "/leads/l/:id/decision", method: "post", callback: garde(L.decisionPost) },
    { url: "/leads/dossiers", method: "get", callback: garde(DO.liste) },
    { url: "/leads/dossier/:id", method: "get", callback: garde(DO.fiche) },
    { url: "/leads/chaine", method: "get", callback: garde(CH.page) },
    { url: "/leads/chaine", method: "post", callback: garde(CH.enregistrer) },
    { url: "/leads/chaine/webhook", method: "post", callback: garde(CH.webhookCle) },
    { url: "/leads/portails", method: "post", callback: garde(CH.portailAjouter) },
    { url: "/leads/portails/:id/supprimer", method: "post", callback: garde(CH.portailRetirer) },
    { url: "/leads/catalogue", method: "post", callback: garde(CH.catalogue) },
    /* webhook du CRM : appelé de l'extérieur (clé dans X-Api-Key), donc sans jeton CSRF */
    { url: "/leads/crochet/crm", method: "post", noCsrf: true, callback: CH.crochet },
    { url: "/leads/envoi", method: "get", callback: garde(E.envoi) },
    { url: "/leads/envoi/regle", method: "post", callback: garde(E.regleSave) },
    { url: "/leads/envoi/regle/:id/supprimer", method: "post", callback: garde(E.regleSuppr) },
    { url: "/leads/personne/:id", method: "get", callback: garde(E.personne) },
    { url: "/leads/personne", method: "post", callback: garde(E.personneSave) },
    { url: "/leads/absences", method: "get", callback: garde(E.absences) },
    { url: "/leads/absences", method: "post", callback: garde(E.absenceSave) },
    { url: "/leads/absences/:id/supprimer", method: "post", callback: garde(E.absenceSuppr) },
    { url: "/leads/demandes", method: "get", callback: garde(D.liste) },
    { url: "/leads/demandes", method: "post", callback: garde(D.creer) },
    { url: "/leads/demandes/:id", method: "get", callback: garde(D.fiche) },
    { url: "/leads/demandes/:id/etape", method: "post", callback: garde(D.etape) },
    { url: "/leads/reglages", method: "get", callback: garde(R.page) },
    { url: "/leads/reglages", method: "post", callback: garde(R.enregistrer) },
    { url: "/leads/reglages/tester", method: "post", callback: garde(R.tester) },
    { url: "/leads/reglages/installer", method: "post", callback: garde(R.installerPost) },
    { url: "/leads/import", method: "get", callback: garde(R.importPage) },
    { url: "/leads/import", method: "post", callback: garde(R.importPost) },
    { url: "/leads/import/rejouer", method: "post", callback: garde(R.rejouer) },
    { url: "/dysizz-leads/a/:ver/:file", method: "get", callback: asset }
  ]
};
