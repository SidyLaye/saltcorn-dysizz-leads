/* dysizz-leads — constantes et petits utilitaires partagés */
"use strict";
const PLUGIN = "dysizz-leads";
const VERSION = typeof __DZL_VERSION__ !== "undefined" ? __DZL_VERSION__ : "dev";
const isAdmin = (req) => !!(req && req.user && req.user.role_id === 1);
/* accès : administrateurs et rôle « staff » (40) de Saltcorn ; lecture seule en dessous */
const peutVoir = (req) => !!(req && req.user && req.user.role_id <= 40);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const csrf = (req) => { try { return req.csrfToken ? req.csrfToken() : ""; } catch (e) { return ""; } };
const hidden = (req) => `<input type="hidden" name="_csrf" value="${esc(csrf(req))}">`;
const go = (res, url, msg, bad) => res.redirect(`${url}${url.includes("?") ? "&" : "?"}${bad ? "err" : "ok"}=${encodeURIComponent(msg)}`);
const flowApi = () => {
  const st = require("@saltcorn/data/db/state").getState();
  for (const p of Object.values(st.plugins || {})) if (p && p.dysizz_flow_api && p.dysizz_flow_api.leads) return p.dysizz_flow_api;
  return null;
};
const dateFr = (d, heure = true) => { if (!d) return ""; const x = new Date(d); return isNaN(x) ? "" : x.toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric", ...(heure ? { hour: "2-digit", minute: "2-digit" } : {}) }); };
const jour = (d) => new Date(d).toISOString().slice(0, 10);
module.exports = { PLUGIN, VERSION, isAdmin, peutVoir, esc, csrf, hidden, go, flowApi, dateFr, jour };
