# Journal des versions

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
