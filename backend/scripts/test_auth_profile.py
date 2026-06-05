import requests
import time

base = "http://localhost:8001"
email = f"testuser+{int(time.time())}@example.com"
password = "password123"
username = "testuser"

print('Signup:', email)
resp = requests.post(f"{base}/api/auth/signup", json={"username": username, "email": email, "password": password, "full_name": "Test User"}, timeout=10)
print('signup status', resp.status_code)
try:
    print(resp.json())
except Exception:
    print(resp.text)

if resp.status_code not in (200,201):
    print('Signup failed, aborting')
    raise SystemExit(1)

# Login
resp = requests.post(f"{base}/api/auth/login", json={"email": email, "password": password}, timeout=10)
print('login status', resp.status_code)
print(resp.text)
if resp.status_code != 200:
    print('Login failed, aborting')
    raise SystemExit(1)

token = resp.json().get('access_token')
headers = {"Authorization": f"Bearer {token}"}

# Update profile
profile = {
    "personal_info": {"full_name": "Updated Test User", "bio": "Automated test"},
    "account_settings": {"timezone": "UTC", "receive_newsletter": True}
}
resp = requests.post(f"{base}/api/user-tracking/profile", json=profile, headers=headers, timeout=10)
print('update profile status', resp.status_code)
try:
    print(resp.json())
except Exception:
    print(resp.text)

# Get profile
resp = requests.get(f"{base}/api/user-tracking/profile", headers=headers, timeout=10)
print('get profile status', resp.status_code)
try:
    print(resp.json())
except Exception:
    print(resp.text)
