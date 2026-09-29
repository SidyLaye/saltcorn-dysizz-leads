# dysizz-leads

Plateforme de leads immobiliers pour Saltcorn. Un mail arrive d'un portail (Leboncoin, SeLoger, Green-Acres, Figaro, Bien'ici, Properstar, French-Property, Rightmove, site de l'agence…) ; en moins d'une seconde on sait qui est le prospect, de quel bien il parle, à quelle agence et à quel négociateur il revient, et à qui le lead doit partir.

Elle est construite avec les deux autres briques :

- **dysizz-flow** (2.10 ou plus récent) : le moteur (lecture des mails, rapprochement du bien, contact, routage, CRM), l'écouteur de boîte mail en temps réel, et les blocs du workflow ;
- **dysizz-ui** : l'apparence générale.

Ce plugin apporte les tables, les écrans, le workflow `ld_traitement` et ses blocs (`dzx_leads_*`). Le workflow montre chaque étape dans l'éditeur de dysizz-flow : déjà traité ? → préparer → attendre son tour → lire → bien → contact → consentement → qui reçoit ? → CRM → enregistrer.

## Multi-clients

Un client = un tenant Saltcorn (sous-domaine, schéma Postgres séparé). Chaque client a ses agences, son équipe, ses règles, son CRM et ses secrets. Aucune donnée ne passe d'un client à l'autre.

CRM disponibles : **Immofacile** (API V2) et **Salesforce** (objets et champs réglables : Lead ou Contact, Product2 ou objet « Bien » personnalisé).

## Ce qui se passe pour chaque mail

L'unité de travail est le **dossier** : un prospect × un bien. Un mail crée un dossier, le complète (relance, réponse du prospect) ou y ajoute la réponse de l'équipe. Le détail et les raisons sont dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

1. **Écoute** : la boîte est écoutée en temps réel (IMAP IDLE), en lecture seule, par un seul serveur à la fois. Le mail est rangé dans `ld_mails` avec ses en-têtes de fil et sa source `.eml`.
2. **Lecture des mails en trois étages** : règles pour les 30 portails du code ; gabarits appris tout seuls pour les nouveaux portails et les nouvelles mises en page ; IA seulement quand le mail reste inconnu ou incomplet, et sa lecture apprend un gabarit (au 3e mail de la même forme, plus d'IA). Rien à déclarer à la main. Chaque valeur de l'IA est revérifiée dans le mail ; chaque champ dit d'où il vient.
3. **Fil** : le mail est rattaché au dossier du prospect (relais du portail, e-mail, téléphone, référence citée). Deux mails du même prospect ne sont jamais traités en même temps.
   - Une réponse d'un négociateur **n'est jamais un lead** : elle rejoint le dossier et donne le délai de réponse.
   - Une réponse du prospect sans référence reprend le bien du dossier.
4. **Bien** : rapprochement sur le **catalogue local** (`ld_biens`, mis à jour chaque heure et par webhook), le CRM seulement en secours. Procédure « non-conformes » : identifiant CRM → référence complète → moins le dernier caractère → segments → critères. Une preuve faible doit être confirmée par un fait qui distingue le bien.
5. **Contact** : priorité à l'e-mail, puis au plus récemment créé ; on complète, on n'écrase jamais ; un contact sans négociateur est rattaché à celui du bien.
6. **CRM** : suivi du bien ; **projet de recherche** créé une fois par dossier à partir des critères du bien demandé (marges réglables) ; son **commentaire contient toute la conversation**, reconstruite à chaque mail (pas de doublon) ; consentement anti-démarchage une fois par contact, avec le vrai `.eml` en preuve.
7. **Destinataires** : négociateur du bien, assistant(e), règles, congés, mi-temps, siège. Une relance d'un dossier suivi ne va qu'au négociateur (réglable).

Chaque étape peut être coupée par client (écran Chaîne) : un client peut ne prendre que la lecture et le tableau de bord, un autre tout.

## Mode ombre (par défaut)

Le CRM est **seulement lu** ; les écritures sont notées (et bloquées au niveau HTTP). Aucun mail n'est envoyé : le service en production continue de le faire. On compare, puis on passe en réel dans Réglages (il faut taper REEL).

## Écrans (`/leads`)

| Écran | Rôle |
|---|---|
| Tableau de bord | prêts, à vérifier, à trier, temps de traitement ; par portail ; motifs ; absents de la semaine ; demandes en cours ; alertes |
| Dossiers | un dossier par prospect × bien : conversation complète, commentaire écrit dans le CRM, délai de première réponse, dossiers sans réponse depuis plus de 24 h |
| Leads | liste filtrable (statut, portail, période, recherche, écarts avec l'ancien système) et fiche complète de chaque lead, bouton « retraiter » |
| Envoi | **tester** : les adresses exactes du prochain lead d'un négociateur, à une date donnée ; règles par négociateur ou groupe (couper le négociateur, garder / couper / remplacer l'assistant(e), adresses en plus sans limite) ; l'équipe |
| Personne | temps plein ou mi-temps (jours travaillés, remplaçant les autres jours), congés |
| Absences | semaine : qui est absent, qui prend le relais ; retour automatique après la date de fin |
| Demandes | suivi Reçue → Prise en compte → En cours → Terminée → Mise en ligne, date et note à chaque étape ; urgence Bloquant (alerte immédiate), Important, Confort |
| Chaîne | étapes actives, relances, marges du projet de recherche, taille du commentaire, conservation des mails, catalogue des biens et webhook, portails déclarés, nouveaux expéditeurs |
| Réglages | CRM et secrets (rangés chiffrés dans le coffre de dysizz-flow), mode, boîte écoutée, consentement, sites d'agence, domaines, siège |
| Import | référentiels depuis une sauvegarde Saltcorn (agences, négociateurs, assistant(e)s, origines, destinataires) ; rejouer en ombre les mails reçus |

Accès : administrateurs et rôle « staff » ; les réglages, l'import et les étapes des demandes sont réservés aux administrateurs.

## Mise en route

1. Installer dysizz-ui, dysizz-flow (2.10+), puis dysizz-leads.
2. `/leads/import` : charger les fichiers de la sauvegarde (dossier `tables/`).
3. `/leads/reglages` : CRM (site_id et identifiants), boîte à écouter, sites d'agence, siège ; « Installer / réparer le workflow » ; « Tester la connexion au CRM ».
4. Laisser tourner en ombre, comparer dans Leads (filtre « écarts avec l'ancien système ») ; passer en réel quand tout est bon.

## Exploitation

- Plusieurs serveurs derrière un répartiteur : une boîte n'est écoutée que par un serveur (verrou Postgres) ; un mail n'est traité qu'une fois (Message-ID + idempotence) ; un dossier n'est modifié que par un traitement à la fois.
- Chaque heure (un seul serveur) : biens modifiés dans le CRM, reprise des mails restés sans traitement, effacement du texte des vieux mails si une durée de conservation est réglée.
- Webhook du CRM : `POST /leads/crochet/crm`, clé dans l'en-tête `X-Api-Key` (rangée chiffrée), réponse immédiate.

## Développer

```
cd tools && npm install && node build.mjs   # index.js généré depuis src/
node tests/run.cjs
```
Les tests du moteur sont dans dysizz-flow : `tests/leads.test.cjs` (portails), `tests/mutations.test.cjs` (chaque mail abîmé exprès : fins de ligne, lignes recoupées, HTML seul, tableaux, espaces insécables, champ manquant), `tests/fil.test.cjs` (conversation complète et Immofacile en réel contre un faux serveur).

Non-régression sur un corpus réel (jamais versionné, données personnelles) :

```
node ../saltcorn-dysizz-flow/tools/corpus.cjs --mails mails.jsonl --conf conf.json --biens biens.json --reference reference.json
```
