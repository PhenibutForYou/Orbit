import random
import json

def accident_probability(data):
        if random.randint(1, 100) > data['chance']:
            data['chance'] = min(100, data['chance'] + random.randint(2, 8))
            return 0
        else:
            data['chance'] = max(0, data['chance'] - 30)
            return 1

with open('data.json', 'r') as f:
    data = json.load(f)

for row in data:
    result = accident_probability(row)

with open('data.json', 'w') as f:
    json.dump(data, f,ensure_ascii = False, indent = 2)


