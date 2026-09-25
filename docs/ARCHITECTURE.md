# dysizz-leads : architecture

Ce document dit comment la plateforme est construite et pourquoi. Il part de ce qu'on a appris en rejouant les 7 658 mails AMBS (sauvegarde du 25/09/2026) et de la documentation de l'API Immofacile V2.

## 1. Ce qu'on a appris des données

| Constat | Chiffre | Conséquence |
|---|---|---|
| Un même prospect écrit plusieurs fois sur le même bien | 475 couples prospect × bien, 1 175 mails (25 % des leads) | L'unité de travail est le **dossier** (prospect × bien), pas le mail. |
| Le relais Leboncoin (`xxx@messagerie.leboncoin.fr`) est stable pour une conversation | 169 relais sur 170 pointent toujours vers le même bien | C'est la meilleure clé de fil pour Leboncoin. |
| Les négociateurs répondent dans la boîte (« Re: … ») | 91 mails internes, dont 57 « Re: » | Une réponse de négociateur n'est **jamais** un lead : c'est un événement du dossier (le prospect a eu une réponse, et en combien de temps). |
| L'ancien service créait une fiche par mail et renvoyait la réponse du négociateur au négociateur lui-même | 50 cas | À ne pas reproduire. |
| Le bien porte tout : négociateur, agence, projet de recherche, destinataires | 3 839 biens identiques entre ancien et nouveau | Le rapprochement du bien est le cœur ; il doit être fiable et rapide. |
| Immofacile interdit l'interrogation intensive (« intensive polling is prohibited ») et propose des webhooks `PRODUCT_CREATE/UPDATE/DELETE` | doc API § 2.2 | On garde un **catalogue local** des biens, synchronisé par webhook, et on rapproche en local. |
| L'ancien relisait le contact sans `?include=origin,groups` | origine « non relue » 2 081 fois sur 2 127 | Ce n'était pas l'écriture qui échouait, c'était la relecture. Relire avec `include`. |
| Le projet de recherche d'Immofacile se fait **à partir du bien demandé** (doc API, cas d'usage 1, étape 3) | un projet par (contact, bien) chez l'ancien | Un projet par dossier ; son champ `comment` contient toute la conversation, reconstruite à chaque mail. |

## 2. Principes

1. **Chaque étape est une fonction pure** : elle reçoit des données, rend une décision et ses preuves. Les écritures (CRM, mails, tables) sont faites à part, par un exécuteur qui sait rejouer sans doublon.
2. **Rien n'est deviné sans preuve.** Chaque valeur dit d'où elle vient (fiche, portail, citation, catalogue). Un doute part « à vérifier » avec la raison ; il n'est jamais tranché au hasard.
3. **Un nouveau portail s'apprend tout seul.** Règles pour les portails connus, gabarits appris pour le reste, IA en dernier recours ; la lecture de l'IA devient un gabarit (même boucle que l'ancien AMBS). La déclaration à la main reste possible mais n'est jamais nécessaire.
4. **Chaque client choisit ses étapes.** Lecture seule, lecture + CRM, tout avec envoi : ce sont des interrupteurs, pas des versions différentes.
5. **Le CRM est derrière un contrat.** Immofacile, Salesforce, ou un autre demain : même interface, et chaque adaptateur dit ce qu'il sait faire (capacités).
6. **Idempotence partout.** Le même mail rejoué dix fois donne un seul dossier, un seul contact, un seul projet, un seul envoi.

## 3. Modèle de données (par client = par tenant)

```
ld_mails        mail brut, tel que reçu (une ligne par Message-ID)
                + en-têtes de fil : in_reply_to, references, reply_to, cc, empreinte, source .eml
ld_leads        traitement d'un mail : extraction, décisions, preuves, mode (ombre / réel)
ld_dossiers     prospect × bien : clé, contact CRM, bien CRM, négociateur, agence, origine,
                projet de recherche CRM, statut, 1re demande, dernière activité,
                1re réponse du négociateur (délai)
ld_evenements   fil du dossier : demande, relance, réponse du négociateur, réponse du prospect,
                note ; auteur, date, texte, mail d'origine
ld_biens        catalogue local du CRM (référence, prix, surface, pièces, type, ville, CP,
                négociateur, agence, statut web, maj_le) — synchronisé
ld_portails     portails déclarés par le client (en plus de ceux du code)
ld_reglages, ld_agences, ld_personnes, ld_regles_envoi, ld_absences, ld_origines, ld_siege
ld_demandes, ld_demande_etapes
```

Clé d'un dossier, dans l'ordre : relais du portail (Leboncoin, Green-Acres, Properstar) → e-mail du prospect → téléphone ; plus l'identifiant du bien (ou la référence tant que le bien n'est pas trouvé).

## 4. La chaîne

```
Boîte mail ──IMAP IDLE──▶ ld_mails ──événement──▶ traitement (verrou par dossier)
   1. reconnaître   portail (code ou déclaré) / inconnu ; nature ; rôle de l'expéditeur
   2. lire          fiche « libellé : valeur » + règles du portail + normalisation
   3. fil           rattacher à un dossier existant (en-têtes, relais, e-mail, référence citée)
   4. bien          catalogue local → CRM si besoin ; preuve forte / faible ; faits comparés
   5. contact       e-mail d'abord, puis le plus récemment créé ; on complète, on n'écrase pas
   6. plan CRM      contact, suivi du bien, projet de recherche (critères du bien),
                    commentaire = conversation entière, consentement, action
   7. destinataires négociateur du bien, assistant(e), règles, congés, mi-temps, siège
   8. exécuter      selon le mode ; relecture ; chaque écriture notée
   9. notifier      (phase 2) même rendu que l'ancien service
```

Selon la nature :

| Nature | Dossier | CRM | Notification |
|---|---|---|---|
| lead / relance / recherche / estimation | créé ou repris | contact, suivi, projet, commentaire, consentement | oui |
| réponse du négociateur | repris (jamais créé) | commentaire mis à jour ; « répondu le » | non |
| réponse du prospect (Re:) | repris | commentaire mis à jour | négociateur du dossier seulement |
| interne, auto-réponse, non-lead | aucun | rien | non |
| inconnu, réponse à une campagne | aucun | rien | « à trier » |

## 5. Le bien

- **Catalogue local** `ld_biens` : synchronisation complète au démarrage (`POST /products/search` par curseur avec `?fetch=`), puis mise à jour par webhook (`PRODUCT_*`) et une passe de rattrapage par `last_modified` une fois par heure (pas d'interrogation intensive).
- **Rapprochement** : identifiant CRM (lien, « ID de ton CRM », 8 chiffres cachés dans une référence) → référence complète → référence moins le dernier caractère → segments de droite à gauche → critères un par un. Preuve forte : un écart toléré si deux faits concordent. Preuve faible : il faut un fait qui distingue le bien (prix, surface, CP, ville).
- **Projet de recherche** : créé une fois par dossier, à partir des critères du bien (type, zone, pièces, surface, prix avec une marge réglable) ou des critères donnés par le portail s'il y en a ; son `comment` contient la conversation entière.

## 6. La conversation et le commentaire

- Chaque mail ajoute des événements au dossier : le message du jour, plus l'historique que le portail recopie (« Messages précédents » chez Leboncoin, citations « Le … a écrit : »). Les doublons sont écartés par empreinte (auteur + date + début du texte).
- Le commentaire du projet est **reconstruit** à chaque fois à partir de ces événements (du plus ancien au plus récent), pas ajouté au bout : rejouer ne duplique rien, et une correction se propage.
- Taille bornée (réglable) : si ça dépasse, on garde la première demande et les plus récents, avec « … N messages plus anciens ».

## 7. Robustesse face aux mails qui changent

- **Normalisation** avant lecture : fins de ligne, espaces insécables, libellés coupés sur deux lignes (« Ref. de / l'annonce : »), HTML → texte, citations séparées.
- **Lecture par libellés** dans un dictionnaire unique (FR / EN / NL / ES…), valeur sur la même ligne ou la suivante : un champ déplacé ou un saut de ligne en plus ne casse rien.
- **Champs manquants** : jamais bloquants à la lecture ; c'est l'étape d'après qui décide (pas de bien → « à vérifier » avec la raison).
- **Portail inconnu ou mise en page nouvelle** : lecture en trois étages (`lecture.js` dans dysizz-flow).
  1. Règles des portails connus.
  2. Gabarits appris (`ld_gabarits`) : signature = domaine de l'expéditeur + phrase stable ; motifs par champ.
  3. IA si le mail reste inconnu, ou s'il manque le moyen de joindre le prospect, son nom ou la référence (portail non reconnu) ; pour un portail connu, seulement si les coordonnées manquent (sa mise en page a sans doute changé).
  L'IA propose des motifs ; chaque motif est rejoué et doit retrouver la valeur lue, sans contenir aucune donnée du mail. Validé 2 fois dans une forme vue 3 fois → gabarit actif (règle d'AMBS, qui a fait passer l'IA seule de 19 % à 6 % des leads en six semaines). Trois échecs de suite → suspendu, l'IA réapprend. Chaque valeur de l'IA doit se retrouver dans le mail. Plafond d'appels par jour et par client (`ld_ia`).
- **Bibliothèque commune** (facultative) : un gabarit de portail activé chez un client peut servir aux autres (`public.dzl_gabarits_communs`) ; seule la forme est partagée, jamais une donnée de prospect ; un client qui voit un gabarit commun échouer en garde une copie locale suspendue.
- **Tests de mutation** : chaque mail de test est cassé exprès (sauts de ligne, retours chariot, texte recoupé à 40 colonnes, espaces insécables, champ retiré, majuscules, HTML seul) et le résultat doit rester le même.
- **Non-régression sur corpus réel** : `tools/corpus.cjs` rejoue un corpus privé (jamais dans le dépôt) et compare aux chiffres de référence ; la CI le lance quand le corpus est fourni en secret.

## 8. Plusieurs clients, plusieurs CRM, à la carte

- Un client = un tenant Saltcorn : schéma Postgres séparé, réglages et secrets séparés.
- `ld_reglages.etapes` : `lecture`, `bien`, `contact`, `projet`, `commentaire`, `consentement`, `notification`. Un client qui ne veut que la lecture et le tableau de bord coupe le reste.
- Contrat CRM (tous les adaptateurs) : `tester`, `bienParId`, `biensParReference`, `biensParCriteres`, `catalogue(depuis)`, `contactsParEmail`, `contactsParTelephone`, `contact(id)`, `creerContact`, `majContact`, `lierBien`, `creerRecherche`, `majRecherche`, `ajouterConsentement`, `ajouterAction`, et `capacites` (ce qu'il sait faire). Une étape que le CRM ne sait pas faire est simplement notée « non disponible ».
- Nouveau CRM = un fichier dans `flow/src/lib/leads/crm/` + ses tests avec un faux serveur.

## 9. Montée en charge et exploitation

- **Écouteur IMAP** : un seul nœud tient la connexion d'une boîte (verrou consultatif Postgres, `pg_try_advisory_lock`). Si le nœud tombe, un autre prend la main au passage suivant (30 s).
- **Traitement** : chaque mail est traité sous un verrou par dossier (deux mails du même prospect qui arrivent en même temps ne créent pas deux dossiers). Plusieurs nœuds Saltcorn peuvent traiter en parallèle derrière un répartiteur de charge.
- **CRM** : jeton mis en cache, limite de débit par client, respect de `429 Retry-After`, relance avec attente croissante, arrêt propre après 3 échecs (le lead reste « à reprendre »).
- **Idempotence** : Message-ID unique par boîte ; 409 de l'API (doublon, suivi déjà là) traité comme « déjà fait ».
- **Webhooks entrants** : route signée par un secret dans l'en-tête, comparaison à temps constant, réponse en moins de 10 s, traitement en différé.

## 10. Sécurité et données personnelles

- Secrets uniquement dans le coffre chiffré de dysizz-flow ou en variables d'environnement ; jamais en clair dans une table.
- Mode ombre : écritures bloquées au niveau HTTP (liste blanche des lectures).
- IA : le texte du mail part chez le fournisseur choisi par le client (données personnelles du prospect). À couvrir par un contrat de sous-traitance (RGPD) ou un fournisseur hébergé en Europe / interne (adresse d'API compatible OpenAI). Seuls les mails que les règles et les gabarits n'ont pas su lire sont envoyés. Le prompt dit que le mail est une donnée ; la réponse ne peut rien déclencher, elle ne fait que remplir des champs revérifiés dans le mail.
- HTML des mails jamais affiché tel quel : nettoyé (pas de script, pas d'images distantes par défaut).
- Rétention réglable : le corps des mails est effacé après N jours (l'empreinte et la preuve de consentement restent).
- Journal de qui a fait quoi (décisions manuelles, passage en réel).
- Accès : administrateur et « staff » ; réglages et import réservés aux administrateurs.

## 11. Qualité et livraison

- CI GitHub à chaque push : construction, vérification que `index.js` est à jour, tests unitaires, tests de mutation, chargement du plugin ; Node 18, 20 et 22.
- Publication sur étiquette `vX.Y.Z` : archive `.tgz` attachée à la version GitHub.
- Versions SemVer, journal des versions en français simple.

## 12. Décisions prises et questions ouvertes

Prises :

- Réponse du négociateur = événement du dossier, jamais un lead ni une notification.
- Le commentaire du projet est reconstruit à chaque mail.
- Le rapprochement se fait sur le catalogue local, le CRM ne sert qu'en secours.

À valider avec le client :

- Marges du projet de recherche créé depuis le bien (par défaut : prix max +10 %, surface min −20 %, pièces min −1).
- Prospects Giraffe (visite virtuelle) comptés comme leads.
- Durée de conservation des mails.
