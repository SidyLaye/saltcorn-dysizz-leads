# dysizz-leads

Plateforme de leads immobiliers pour Saltcorn. Un mail arrive d'un portail (Leboncoin, SeLoger, Green-Acres, Figaro, Bien'ici, Properstar, French-Property, Rightmove, site de l'agence…) ; en moins d'une seconde on sait qui est le prospect, de quel bien il parle, à quelle agence et à quel négociateur il revient, et à qui le lead doit partir.

Elle est construite avec les deux autres briques :

- **dysizz-flow** (2.4 ou plus récent) : le moteur (lecture des mails, rapprochement du bien, contact, routage, CRM), l'écouteur de boîte mail en temps réel, et les blocs du workflow ;
- **dysizz-ui** : l'apparence générale.

Ce plugin apporte les tables, les écrans, le workflow `ld_traitement` et deux blocs (`dzx_leads_conf`, `dzx_leads_enregistrer`).

## Multi-clients

Un client = un tenant Saltcorn (sous-domaine, schéma Postgres séparé). Chaque client a ses agences, son équipe, ses règles, son CRM et ses secrets. Aucune donnée ne passe d'un client à l'autre.

CRM disponibles : **Immofacile** (API V2) et **Salesforce** (objets et champs réglables : Lead ou Contact, Product2 ou objet « Bien » personnalisé).

## Ce qui se passe pour chaque mail

1. **Écoute** : la boîte est écoutée en temps réel (IMAP IDLE), en lecture seule. Le mail est rangé dans `ld_mails`, puis le workflow `ld_traitement` démarre.
2. **Lecture sans IA** : 30 portails reconnus. Chaque champ dit d'où il vient (« fiche:email », « portail:seloger », « lien »…). Les réponses automatiques, les rapports anti-spam et les newsletters sont écartés ; les transferts internes (« TR: ») sont dépliés ; un lead venant du site de l'agence (AC3) prend comme origine **le site** (selectionhabitat.com, agence-hamilton.com…), plus « ac3 ».
3. **Bien** (procédure « non-conformes ») : identifiant CRM s'il est donné → référence complète → référence moins le dernier caractère → segments de droite à gauche → critères un par un (type, pièces, surface, prix, ville ; retour arrière si zéro, arrêt dès qu'il en reste un). Chaque bien trouvé est comparé au mail (prix, ville, code postal, surface, pièces) : contradiction = rejet et on continue.
4. **Contact** : priorité à l'e-mail, puis au contact le plus récemment créé. On complète les champs vides, on n'écrase jamais.
5. **Consentement anti-démarchage** : « Demande de contact via Leboncoin du 09/09/2026 », avec le mail d'origine joint en preuve (.eml). Libellé réglable, à valider par le client.
6. **Destinataires** : négociateur du bien, son assistant(e), les règles d'envoi, les congés et le mi-temps, le siège.

Tout est gardé dans la fiche du lead : ce qui a été lu, les étapes de recherche du bien, la décision sur le contact, les actions CRM, les destinataires et pourquoi.

## Mode ombre (par défaut)

Le CRM est **seulement lu** ; les écritures sont notées (et bloquées au niveau HTTP). Aucun mail n'est envoyé : le service en production continue de le faire. On compare, puis on passe en réel dans Réglages (il faut taper REEL).

## Écrans (`/leads`)

| Écran | Rôle |
|---|---|
| Tableau de bord | prêts, à vérifier, à trier, temps de traitement ; par portail ; motifs ; absents de la semaine ; demandes en cours ; alertes |
| Leads | liste filtrable (statut, portail, période, recherche, écarts avec l'ancien système) et fiche complète de chaque lead, bouton « retraiter » |
| Envoi | **tester** : les adresses exactes du prochain lead d'un négociateur, à une date donnée ; règles par négociateur ou groupe (couper le négociateur, garder / couper / remplacer l'assistant(e), adresses en plus sans limite) ; l'équipe |
| Personne | temps plein ou mi-temps (jours travaillés, remplaçant les autres jours), congés |
| Absences | semaine : qui est absent, qui prend le relais ; retour automatique après la date de fin |
| Demandes | suivi Reçue → Prise en compte → En cours → Terminée → Mise en ligne, date et note à chaque étape ; urgence Bloquant (alerte immédiate), Important, Confort |
| Réglages | CRM et secrets (rangés chiffrés dans le coffre de dysizz-flow), mode, boîte écoutée, consentement, sites d'agence, domaines, siège |
| Import | référentiels depuis une sauvegarde Saltcorn (agences, négociateurs, assistant(e)s, origines, destinataires) ; rejouer en ombre les mails reçus |

Accès : administrateurs et rôle « staff » ; les réglages, l'import et les étapes des demandes sont réservés aux administrateurs.

## Mise en route

1. Installer dysizz-ui, dysizz-flow (2.4+), puis dysizz-leads.
2. `/leads/import` : charger les fichiers de la sauvegarde (dossier `tables/`).
3. `/leads/reglages` : CRM (site_id et identifiants), boîte à écouter, sites d'agence, siège ; « Installer / réparer le workflow » ; « Tester la connexion au CRM ».
4. Laisser tourner en ombre, comparer dans Leads (filtre « écarts avec l'ancien système ») ; passer en réel quand tout est bon.

## Développer

```
cd tools && npm install && node build.mjs   # index.js généré depuis src/
node tests/run.cjs
```
Les tests du moteur sont dans dysizz-flow (`tests/leads.test.cjs`, mails fictifs).
