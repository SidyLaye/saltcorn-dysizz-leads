# Journal des versions

## 1.3.3

- **Correctif** : sur une installation neuve, chaque mail échouait (« column source of relation ld_leads does not exist ») : la colonne `source` manquait au schéma de `ld_leads`. Elle est ajoutée au démarrage. Un test vérifie désormais que chaque colonne écrite existe.
- **Rejouer en ombre** : en cas d'échec, l'écran donne la première erreur au lieu de « 50 en échec » seul.
- Dépôt public : la règle propre à un client (adresses codées en dur) est retirée de l'import ; elle se crée dans l'écran Envoi comme toute autre règle. Exemples neutres dans les réglages et les tests.
- Description du plugin : accents réparés.

## 1.2.0

- **Lecture des mails** (nouvel onglet) : part des mails lus par les règles, par un gabarit appris, complétés par l'IA ; appels d'IA du jour et plafond ; liste des gabarits appris (champs lus, observations, échecs, suspendre / activer) ; import de `gabarit_version.json` de l'ancien AMBS.
- **IA** : réglable par client (plugin Saltcorn déjà réglé, OpenAI ou API compatible, Anthropic), clé rangée dans le coffre (`LEADS_IA_CLE`), plafond d'appels par jour (`ld_ia`) ; les mails laissés de côté au plafond sont relus le lendemain.
- **Gabarits appris** (`ld_gabarits`) : rien à déclarer à la main pour un nouveau portail. Bibliothèque commune facultative entre clients : seule la forme des mails de portails est partagée, jamais une donnée de prospect.
- « Dossiers » renommé **Conversations** (un prospect × un bien : sa demande, ses relances, les réponses de l'agence). Les portails déclarés à la main deviennent facultatifs.
- Fiche d'un lead : « Lu par » (règles, gabarit, IA), justification de l'IA et valeurs refusées car absentes du mail.

## 1.1.0

- **Dossiers** (prospect × bien) : tous les mails d'un même prospect sur un même bien sont regroupés ; la conversation complète est gardée (`ld_dossiers`, `ld_evenements`) et visible dans l'écran Dossiers.
- **Réponse d'un négociateur** : n'est plus jamais traitée comme un lead ; elle rejoint le dossier et donne le délai de première réponse (tableau de bord : délai médian, dossiers sans réponse depuis 24 h).
- **Commentaire CRM** = conversation entière, reconstruit à chaque mail (pas de doublon), dans le projet de recherche du dossier.
- **Catalogue local des biens** (`ld_biens`) : synchronisation complète puis chaque heure, webhook `POST /leads/crochet/crm` (clé X-Api-Key), rapprochement en local.
- **Chaîne à la carte** : étapes actives par client, notification des relances, marges du projet de recherche, taille du commentaire, conservation des mails.
- **Portails déclarés sans code** et liste des nouveaux expéditeurs à déclarer.
- **Plusieurs serveurs** : verrou par dossier, un seul serveur pour les tâches horaires ; reprise automatique des mails restés sans traitement.
- Correction : l'installation échouait au 2e démarrage (création d'index dans la transaction d'installation) ; les blocs `dzx_leads_*` sont enregistrés quel que soit l'ordre de chargement des plugins.
- Workflow `ld_traitement` v2 (un seul bloc `dzx_leads_traiter`), réécrit par « Installer / réparer ».
- Documentation : `docs/ARCHITECTURE.md`.

## 1.0.2

- Import : les boîtes des agences sont lues proprement depuis le champ JSON « emails » de la sauvegarde.
- Motif par défaut de l'identifiant CRM dans les liens : 8 chiffres (un bien), plus 6 (une agence) ; un motif par ligne.

## 1.0.1

- Réglages Immofacile : type d'action pour noter le message du prospect dans l'historique du contact.
- Les leads « recherche » (Figaro, Page Pro Leboncoin…) créent une recherche d'acquéreur dans le CRM.

## 1.0.0

- Première version : plateforme de leads immobiliers multi-clients (un client = un tenant Saltcorn), CRM Immofacile ou Salesforce.
- Écoute de la boîte en temps réel (écouteur de dysizz-flow), lecture des mails sans IA (30 portails), rapprochement du bien (procédure « non-conformes »), contact (priorité e-mail puis le plus récent), consentement anti-démarchage avec preuve, origine = site de l'agence pour les leads AC3.
- Envoi : règles par négociateur ou groupe (couper, garder / couper / remplacer l'assistant(e), adresses en plus), bouton « tester », siège toujours destinataire.
- Équipe : temps plein ou mi-temps (jours travaillés, remplaçant les autres jours), congés avec relais et retour automatique ; vue « qui est absent cette semaine ».
- Demandes : suivi par étapes avec date et note, urgence Bloquant (alerte immédiate) / Important / Confort.
- Mode ombre par défaut (CRM lu seulement, aucun mail envoyé) ; comparaison avec l'ancien système depuis une sauvegarde (`tools/comparaison-sauvegarde.py`).
