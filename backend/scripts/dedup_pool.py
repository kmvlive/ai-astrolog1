import json
import pymorphy2

morph = pymorphy2.MorphAnalyzer()
PUNCT = ' \t\n\r,.!?;:«»"\'()[]{}'

def clean(s):
    return s.strip(PUNCT).lower().replace('ё', 'е')

def lemma(s):
    parts = []
    for w in s.split():
        w = w.strip(PUNCT)
        p = morph.parse(w)
        parts.append(p[0].normal_form if p else w)
    return ' '.join(parts).replace('ё', 'е')

db = set()
for line in open('/tmp/db_keywords.txt', encoding='utf-8'):
    k = clean(line)
    if k:
        db.add(lemma(k))

path = '/var/www/ai-astrolog1/backend/storage/app/dreams-pool.json'
pool = json.load(open(path, encoding='utf-8'))

out, seen, dropped = [], set(), []
for w in pool:
    L = lemma(clean(w))
    if not L or L in db or L in seen:
        dropped.append(f'{w} -> {L}')
        continue
    seen.add(L)
    out.append(L)

json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=4)
print(f'пул был: {len(pool)}, осталось: {len(out)}, отброшено: {len(dropped)}')
print('примеры отброшенных:')
for d in dropped[:20]:
    print('  ', d)
