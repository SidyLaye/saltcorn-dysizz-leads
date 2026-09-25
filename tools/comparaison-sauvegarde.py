#!/usr/bin/env python3
"""Prépare la comparaison avec l'ancien système à partir d'une sauvegarde Saltcorn.

  python3 comparaison-sauvegarde.py <dossier de la sauvegarde> [sortie.json]

Lit (en flux, sans tout charger en mémoire) la table des mails bruts, puis lead
et notification, et écrit un petit fichier [{uid, objet, date_envoi, issue,
statut, bien, destinataires}] à charger dans /leads/import. Aucune donnée
secrète n'est lue (config, jetons, utilisateurs restent de côté)."""
import json, sys, os, glob, collections

def lignes(chemin):
    dec = json.JSONDecoder(); buf = ''; debut = False
    with open(chemin, encoding='utf-8') as f:
        while True:
            morceau = f.read(1 << 20)
            buf += morceau
            if not debut:
                i = buf.find('[')
                if i < 0:
                    if not morceau: return
                    continue
                buf = buf[i + 1:]; debut = True
            while True:
                s = buf.lstrip(' ,\n\r\t')
                if not s or s[0] == ']': buf = s; break
                try: obj, fin = dec.raw_decode(s)
                except ValueError: buf = s; break
                yield obj; buf = s[fin:]
            if not morceau: return

def main():
    dossier = sys.argv[1]; sortie = sys.argv[2] if len(sys.argv) > 2 else 'comparaison-ancien.json'
    T = os.path.join(dossier, 'tables') if os.path.isdir(os.path.join(dossier, 'tables')) else dossier
    brut = [p for p in glob.glob(os.path.join(T, 'email_brut*.json'))]
    if not brut: sys.exit("table email_brut*.json introuvable dans " + T)
    leads = {}
    for l in lignes(os.path.join(T, 'lead.json')):
        if l.get('email_brut') is not None: leads[l['email_brut']] = l
    dest = collections.defaultdict(set)
    for n in lignes(os.path.join(T, 'notification.json')):
        if n.get('role') != 'quarantaine' and n.get('statut') == 'envoye': dest[n.get('lead')].add(str(n.get('destinataire') or '').lower())
    out = []
    for e in lignes(max(brut, key=os.path.getsize)):
        l = leads.get(e.get('id')) or {}
        out.append({'uid': e.get('uid'), 'objet': (e.get('objet') or '')[:300], 'date_envoi': e.get('date_envoi'), 'issue': e.get('issue'),
                    'statut': l.get('statut'), 'bien': l.get('product_id'), 'destinataires': ', '.join(sorted(dest.get(l.get('id'), [])))})
    json.dump(out, open(sortie, 'w'), ensure_ascii=False)
    print(len(out), 'mails ;', sum(1 for x in out if x['statut']), 'avec un lead ->', sortie)

main()
