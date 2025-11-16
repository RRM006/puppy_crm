# CRM System Frontend Web (Phase 1 Setup)

This is the React (Vite) web frontend for the CRM system.

## 1. Project Structure
```
frontend-web/
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   ├── assets/
│   ├── App.js
│   └── index.js
├── public/
├── index.html
├── package.json
├── .env.example
└── .gitignore
```

## 2. Install Dependencies
From the repository root:
```powershell
cd frontend-web
npm install
```

Additional dependencies already added:
- `react-router-dom`
- `axios`
- `react-icons`

## 3. Environment Variables
Create a `.env` file in `frontend-web/` based on `.env.example`.

For Vite builds, use:
```
VITE_API_URL=http://localhost:8000/api
```
CRA-style variable is also included for compatibility:
```
REACT_APP_API_URL=http://localhost:8000/api
```

## 4. Run the Dev Server (Not starting now per Phase 1)
When ready:
```powershell
npm run dev
```
The app will be available at the URL shown in the terminal (typically `http://localhost:5173/`).

## 5. Available Routes (Phase 1)
- `/` — Landing page (placeholder)
- `/login` — Login page (placeholder)
- `/signup` — Signup page (placeholder)

## 6. Backend Connection Test
On load, the app calls `GET /api/health/` to display backend connection status. Configure the API base URL using `.env` as above.

## 7. Notes
- Built with Vite + React for fast development.
- Static assets can be placed in `public/` or `src/assets/`.
