from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime

client = MongoClient('mongodb://localhost:27017')
db = client['ecommerce_analytics']
user_doc = {
    'user_id': str(ObjectId()),
    'username': 'dbg_user',
    'email': f'dbg_{int(datetime.utcnow().timestamp())}@example.com',
    'full_name': 'Debug User',
    'personal_info': {'email': f'dbg_{int(datetime.utcnow().timestamp())}@example.com', 'full_name': 'Debug User'},
    'hashed_password': 'x',
    'created_at': datetime.utcnow(),
    'role': 'analyst'
}
try:
    res = db.users.insert_one(user_doc)
    print('inserted', res.inserted_id)
except Exception as e:
    import traceback
    print('exception', type(e).__name__, e)
    traceback.print_exc()
