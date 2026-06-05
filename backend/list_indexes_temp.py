from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017')
db = client['ecommerce_analytics']
print('Indexes:')
for idx in db.users.list_indexes():
    print(idx)
