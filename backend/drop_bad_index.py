from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017')
db = client['ecommerce_analytics']
# Drop the problematic non-sparse personal_info.email index
try:
    db.users.drop_index("personal_info.email_1")
    print("Dropped personal_info.email_1 index")
except Exception as e:
    print(f"Error dropping index: {e}")

# List remaining indexes
print("\nRemaining indexes:")
for idx in db.users.list_indexes():
    print(idx['name'], idx.get('key'))
