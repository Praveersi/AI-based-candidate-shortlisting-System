# ⚡ TalentAI — Candidate Shortlisting System

AI-powered candidate shortlisting using OpenRouter GPT-3.5 Turbo + MongoDB Atlas.

---

## 📁 Project Structure

```
candidate-shortlister/
├── backend/                  # Node.js + Express API
│   ├── models/Candidate.js
│   ├── routes/candidates.js
│   ├── routes/match.js
│   ├── routes/ai.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── frontend/                 # React App
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddCandidate.js
│   │   │   ├── CandidateList.js
│   │   │   ├── MatchForm.js
│   │   │   └── ShortlistedResults.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── public/index.html
│   ├── .env.example
│   └── package.json
├── render.yaml               # Render deployment config
├── .gitignore
└── README.md
```

---

## 🚀 Local Setup (VS Code)

### Step 1 — Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and fill in:
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/talentai
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxx
```

Start the backend:
```bash
npm run dev
```
Backend runs at: http://localhost:5000

---

### Step 2 — Frontend

Open a NEW terminal:
```bash
cd frontend
npm install
cp .env.example .env
```

The `.env` already has:
```
REACT_APP_API_URL=http://localhost:5000
```

Start the frontend:
```bash
npm start
```
Frontend runs at: http://localhost:3000

---

## 🌐 Deploy on Render

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/candidate-shortlister.git
git push -u origin main
```

### Step 2 — Deploy Backend on Render

1. Go to https://render.com → **New** → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Add Environment Variables:
   - `MONGO_URI` → your MongoDB Atlas connection string
   - `OPENROUTER_API_KEY` → your key
5. Click **Deploy**
6. Copy the backend URL e.g. `https://candidate-shortlister-api.onrender.com`

### Step 3 — Deploy Frontend on Render

1. Go to Render → **New** → **Static Site**
2. Connect the same repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Add Environment Variable:
   - `REACT_APP_API_URL` → your backend URL from Step 2
5. Add Redirect/Rewrite Rule:
   - Source: `/*` → Destination: `/index.html` (for React routing)
6. Click **Deploy**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/candidates` | Add a candidate |
| GET | `/api/candidates` | Get all candidates |
| GET | `/api/candidates?search=React` | Search candidates |
| DELETE | `/api/candidates/:id` | Delete a candidate |
| POST | `/api/match` | Basic skill matching |
| POST | `/api/ai/shortlist` | AI-powered shortlisting |
| POST | `/api/ai/interview-questions` | Generate interview questions |

---

## 🔑 Getting API Keys

### OpenRouter API Key
1. Go to https://openrouter.ai
2. Sign up / Log in
3. Go to **Keys** → Create new key
4. Copy and paste into your `.env`

### MongoDB Atlas
1. Go to https://mongodb.com/atlas
2. Create free cluster
3. Database Access → Add user
4. Network Access → Allow 0.0.0.0/0
5. Connect → Driver → Copy connection string

---

## 🧪 Test the API (using curl)

```bash
# Add candidate
curl -X POST http://localhost:5000/api/candidates \
  -H "Content-Type: application/json" \
  -d '{"name":"Rahul Sharma","email":"rahul@test.com","skills":["React","Node.js","MongoDB"],"experience":2}'

# Basic match
curl -X POST http://localhost:5000/api/match \
  -H "Content-Type: application/json" \
  -d '{"requiredSkills":["React","Node.js"],"minExperience":1}'

# AI match
curl -X POST http://localhost:5000/api/ai/shortlist \
  -H "Content-Type: application/json" \
  -d '{"requiredSkills":["React","Node.js"],"minExperience":1}'
```
