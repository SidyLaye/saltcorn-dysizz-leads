/* Tâches de fond, une fois par heure et par client : mise à jour du catalogue (biens modifiés),
   effacement du texte des vieux mails (rétention). Un seul serveur les fait (verrou Postgres),
   dans le processus principal seulement. Reprend aussi les mails restés sans traitement. */
"use strict";
const cluster = require("cluster");
const G = globalThis[Symbol.for("dysizz-leads.taches")] || (globalThis[Symbol.for("dysizz-leads.taches")] = { minuteurs: new Map() });
const log = (m) => { try { require("@saltcorn/data/db/state").getState().log(4, "[dysizz-leads] " + m); } catch (e) { /* rien */ } };

const heure = async () => {
  const { flowApi } = require("./core");
  const api = flowApi();
  if (!api) return;
  const jeton = await api.verrou.prendre("leads-taches-horaires").catch(() => null);
  if (!jeton) return; /* un autre serveur s'en occupe */
  try {
    const { reglages } = require("./conf");
    const R = await reglages();
    const crm = (() => { try { return JSON.parse(R.crm_reglages || "{}"); } catch (e) { return {}; } })();
    if (crm.site_id || crm.domaine) {
      try { const r = await require("./catalogue").synchroniser({ complet: !R.catalogue_synchro_le }); if (r && r.ok) log("catalogue " + r.message); } catch (e) { log("catalogue : " + e.message); }
    }
    /* reprise : un mail reçu sans trace dans ld_leads (panne, redémarrage pendant le traitement) est retraité */
    try {
      const db = require("@saltcorn/data/db"), S = db.getTenantSchema();
      const ids = (await db.query(`select m.id from "${S}".ld_mails m where m.recu_le < now() - interval '10 minutes' and m.recu_le > now() - interval '7 days'
        and not exists (select 1 from "${S}".ld_leads l where l.mail_id = m.id) order by m.date_envoi, m.id limit 100`)).rows.map((r) => r.id);
      let ok = 0;
      for (const id of ids) { try { await require("./dossier").traiterMail(id); ok++; } catch (e) { log(`reprise du mail ${id} : ${e.message}`); } }
      if (ids.length) log(`reprise : ${ok}/${ids.length} mail(s) retraité(s)`);
    } catch (e) { log("reprise : " + e.message); }
    const j = +R.retention_jours || 0;
    if (j > 0) {
      const db = require("@saltcorn/data/db");
      const r = await db.query(`update "${db.getTenantSchema()}".ld_mails set corps_texte = '', corps_html = '', source_eml = '' where date_envoi < now() - ($1 || ' days')::interval and (corps_texte <> '' or corps_html <> '' or source_eml <> '')`, [String(j)]).catch((e) => ({ rowCount: 0, e }));
      if (r.rowCount) log(`rétention : texte de ${r.rowCount} mail(s) effacé`);
    }
  } finally { await jeton.rendre(); }
};

const planifier = () => {
  if (cluster.isWorker) return;
  const db = require("@saltcorn/data/db");
  const tenant = db.getTenantSchema();
  if (G.minuteurs.has(tenant)) clearInterval(G.minuteurs.get(tenant));
  G.minuteurs.set(tenant, setInterval(() => db.runWithTenant(tenant, heure).catch(() => {}), 3600 * 1000));
  setTimeout(() => db.runWithTenant(tenant, heure).catch(() => {}), 60 * 1000);
};

module.exports = { planifier, heure };
