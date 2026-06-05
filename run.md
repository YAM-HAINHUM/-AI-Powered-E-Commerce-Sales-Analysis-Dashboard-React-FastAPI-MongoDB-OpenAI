# Backend
cd backend
python seed_data.py      # seed sample data once
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm run dev


python -m uvicorn app.main:app --reload --port 8000