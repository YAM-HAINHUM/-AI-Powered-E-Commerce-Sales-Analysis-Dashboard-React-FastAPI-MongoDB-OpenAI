from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017')
db = client['ecommerce_analytics']

# Drop non-sparse email index
try:
    db.users.drop_index("email_1")
    print("Dropped email_1 index")
except Exception as e:
    print(f"Error dropping email_1: {e}")

# Create sparse email unique index
try:
    db.users.create_index([("email", 1)], unique=True, sparse=True)
    print("Created sparse email_1 index")
except Exception as e:
    print(f"Error creating sparse email index: {e}")

# List remaining indexes
print("\nRemaining indexes:")
for idx in db.users.list_indexes():
    print(f"  {idx['name']}: {idx.get('key')}, unique={idx.get('unique', False)}, sparse={idx.get('sparse', False)}")
