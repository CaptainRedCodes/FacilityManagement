# WorkSight - Intelligent Workforce & Facility Management

A full-stack web application for intelligent workforce and facility management, built with React, FastAPI, and PostgreSQL.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL (Railway)
- **Hosting**: Vercel (Frontend) + Railway (Backend)
- **CI/CD**: GitHub Actions

## Project Structure

```
worksight/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/      # UI components
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── lib/             # Utilities
│   │   ├── App.tsx          # Main application
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env.example
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── core/            # Configuration & database
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API routes
│   │   ├── services/        # Business logic
│   │   └── main.py          # FastAPI app
│   ├── alembic/             # Database migrations
│   ├── requirements.txt
│   └── .env.example
├── .github/
│   └── workflows/
│       ├── frontend.yml     # Vercel deployment
│       └── backend.yml      # Railway deployment
└── README.md
```

## Development Workflow

### Feature Branch Workflow (Recommended)

```
1. Create a new branch:
   git checkout -b feature/your-feature-name

2. Make your changes and commit:
   git add .
   git commit -m "Add: description of changes"

3. Push and create PR:
   git push -u origin feature/your-feature-name
   # Create Pull Request on GitHub

4. After review and approval:
   # Merge to main (via GitHub UI or CLI)
   # GitHub Actions will auto-deploy to Vercel + Railway
```

### Running Locally (Frontend + Backend)

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your DATABASE_URL
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The frontend will be at http://localhost:5173 and API calls will proxy to the backend automatically.

## Environment Variables

### Frontend (.env)

```env
# For local development - leave empty to use proxy
VITE_API_URL=

# For production - set in Vercel dashboard
VITE_API_URL=https://your-backend.railway.app
```

### Backend (.env)

```env
DATABASE_URL=postgresql://username:password@hostname:port/database_name
APP_NAME=WorkSight
APP_VERSION=1.0.0
DEBUG=False
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/` | Root endpoint |
| POST | `/api/v1/waitlist` | Join waitlist |
| GET | `/api/v1/waitlist/count` | Get waitlist count |

## Database Migrations

### Create a new migration

```bash
cd backend
alembic revision --autogenerate -m "description"
```

### Run migrations

```bash
alembic upgrade head
```

### Rollback migration

```bash
alembic downgrade -1
```

## Deployment

### Railway (Backend)

1. Create a Railway project at https://railway.app
2. Deploy PostgreSQL service
3. Link your GitHub repository
4. Add environment variable `DATABASE_URL`
5. GitHub Actions auto-deploys on push to `main`

### Vercel (Frontend)

1. Import your GitHub repository on https://vercel.com
2. Set root directory to `frontend`
3. Add environment variable `VITE_API_URL` = your Railway backend URL
4. GitHub Actions auto-deploys on push to `main`

## GitHub Actions Secrets

Add these in Repository Settings → Secrets and variables → Actions:

### Frontend (Vercel)
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

### Backend (Railway)
- `RAILWAY_TOKEN` - Railway API token
- `DATABASE_URL` - PostgreSQL connection string

## How to Get Secrets

### Vercel
1. Go to Settings → Tokens → Create Token
2. Go to Settings → General → Copy Organization ID
3. Go to Settings → Projects → Copy Project ID

### Railway
1. Go to Account Settings → Tokens → Generate Token

## License

This project is proprietary and confidential.
