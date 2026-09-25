/* Tables de la plateforme (préfixe ld_). Création idempotente : une table ou
   un champ manquant est ajouté, rien n'est jamais vidé ni modifié.
   Multi-clients : chaque client est un tenant Saltcorn (schéma Postgres séparé). */
"use strict";

const T = {
  reglages: { name: "ld_reglages", desc: "Réglages du client (une seule ligne)", fields: [
    ["crm", "String"], ["crm_reglages", "String"], ["prefixe_secrets", "String"], ["mode", "String"], ["envoi_mails", "Bool"],
    ["consentement_actif", "Bool"], ["consentement_libelle", "String"], ["utiliser_relais", "Bool"],
    ["domaines_agence", "String"], ["sites", "String"], ["objets_campagnes", "String"], ["id_crm_liens", "String"], ["origines_portail", "String"],
    ["boite_ecouteur", "String"], ["maj_le", "Date"]] },
  agences: { name: "ld_agences", desc: "Agences", fields: [["nom", "String", { required: true }], ["crm_id", "String"], ["boites", "String"], ["negociateur_defaut", "String"], ["actif", "Bool"]] },
  personnes: { name: "ld_personnes", desc: "Négociateurs et assistant(e)s", fields: [
    ["nom", "String", { required: true }], ["email", "String"], ["role", "String"], ["crm_id", "String"], ["agence_crm_id", "String"],
    ["assistante", "Integer"], ["temps", "String"], ["jours", "String"], ["remplacant_hors_jours", "String"], ["telephone", "String"], ["actif", "Bool"]] },
  regles: { name: "ld_regles_envoi", desc: "Règles d'envoi par négociateur ou groupe", fields: [
    ["libelle", "String", { required: true }], ["tous", "Bool"], ["negociateurs", "String"], ["couper_negociateur", "Bool"], ["assistante", "String"],
    ["assistante_remplacante", "String"], ["adresses_libres", "String"], ["actif", "Bool"], ["maj_le", "Date"]] },
  absences: { name: "ld_absences", desc: "Congés et absences", fields: [["personne", "Integer", { required: true }], ["debut", "String", { required: true }], ["fin", "String"], ["remplacant", "String"], ["motif", "String"], ["note", "String"], ["actif", "Bool"]] },
  origines: { name: "ld_origines", desc: "Origines du CRM (portails, sites)", fields: [["code", "String", { required: true }], ["libelle", "String"], ["crm_id", "String"]] },
  siege: { name: "ld_siege", desc: "Adresses qui reçoivent toujours", fields: [["email", "String", { required: true }], ["libelle", "String"], ["actif", "Bool"]] },
  leads: { name: "ld_leads", desc: "Leads traités (un par mail)", fields: [
    ["mail_id", "Integer"], ["message_id", "String"], ["recu_le", "Date"], ["traite_le", "Date"], ["expediteur", "String"], ["objet", "String"],
    ["portail", "String"], ["nature", "String"], ["statut", "String"], ["decision", "String"],
    ["contact_nom", "String"], ["contact_email", "String"], ["contact_tel", "String"], ["contact_crm", "String"], ["contact_action", "String"],
    ["reference", "String"], ["bien_crm", "String"], ["bien_ref_crm", "String"], ["bien_methode", "String"], ["bien_confiance", "String"],
    ["agence", "String"], ["negociateur", "String"], ["origine", "String"], ["site", "String"], ["destinataires", "String"],
    ["motifs", "String"], ["alertes", "String"], ["mode", "String"], ["actions", "String"], ["dossier", "String"], ["duree_ms", "Integer"],
    ["ancien_statut", "String"], ["ancien_bien", "String"], ["ancien_destinataires", "String"]] },
  demandes: { name: "ld_demandes", desc: "Demandes d'évolution et incidents", fields: [
    ["titre", "String", { required: true }], ["description", "String"], ["urgence", "String"], ["statut", "String"], ["demandeur", "String"], ["cree_le", "Date"], ["maj_le", "Date"]] },
  etapes: { name: "ld_demande_etapes", desc: "Historique des demandes", fields: [["demande", "Integer", { required: true }], ["statut", "String"], ["quand", "Date"], ["note", "String"], ["par", "String"]] },
};

const STATUTS_DEMANDE = ["Reçue", "Prise en compte", "En cours de traitement", "Terminée", "Mise en ligne"];
const URGENCES = { Bloquant: "alerte immédiate", Important: "dans la journée", Confort: "file normale" };
const MAILS = "ld_mails";

let pret = new Map();
const creer = async () => {
  const Table = require("@saltcorn/data/models/table"), Field = require("@saltcorn/data/models/field");
  const st = require("@saltcorn/data/db/state").getState();
  const out = {};
  for (const [k, d] of Object.entries(T)) {
    let t = Table.findOne({ name: d.name });
    if (!t) { t = await Table.create(d.name, { min_role_read: 40, min_role_write: 40, description: "dysizz-leads · " + d.desc }); for (const [name, type, o] of d.fields) await Field.create({ table: t, name, label: name, type, ...(o || {}) }); await st.refresh_tables(true); t = Table.findOne({ name: d.name }); }
    const have = new Set(t.getFields().map((f) => f.name));
    const manque = d.fields.filter(([n]) => !have.has(n));
    for (const [name, type, o] of manque) await Field.create({ table: t, name, label: name, type, ...(o || {}), required: false });
    if (manque.length) { await st.refresh_tables(true); t = Table.findOne({ name: d.name }); }
    out[k] = t;
  }
  return out;
};
const tables = async () => {
  const key = require("@saltcorn/data/db").getTenantSchema();
  if (!pret.has(key)) pret.set(key, creer().catch((e) => { pret.delete(key); throw e; }));
  return pret.get(key);
};
module.exports = { T, tables, STATUTS_DEMANDE, URGENCES, MAILS };
