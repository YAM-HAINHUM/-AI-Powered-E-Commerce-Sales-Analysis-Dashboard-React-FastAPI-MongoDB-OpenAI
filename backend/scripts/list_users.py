from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017')
db = client['ecommerce_analytics']
print('count', db.users.count_documents({}))
for u in db.users.find().sort([('created_at', -1)]).limit(5):
    print(u)
