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
│   └── tsconfig.json
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── core/            # Configuration & database
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/        # API routes
│   │   ├── services/       # Business logic
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

## Local Development Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL (local or use Railway)

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy the environment file and configure:
   ```bash
   cp .env.example .env
   # Edit .env with your database URL
   ```

5. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

6. The API will be available at http://localhost:8000

7. View API documentation at http://localhost:8000/docs

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://username:password@hostname:port/database_name
APP_NAME=WorkSight
APP_VERSION=1.0.0
DEBUG=False
```

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

1. **Create a Railway account** at https://railway.app

2. **Create a new project**:
   - Click "New Project"
   - Select "Deploy a PostgreSQL database"
   - Note the `DATABASE_URL` from the Variables tab

3. **Link your GitHub repository**:
   - Go to your project on Railway
   - Click "GitHub" under "Deploy"
   - Select your repository

4. **Add environment variables**:
   - Go to the "Variables" tab
   - Add `DATABASE_URL` with your PostgreSQL connection string

5. **Deploy**:
   - Push your code to the `main` branch
   - GitHub Actions will automatically deploy to Railway

### Vercel (Frontend)

1. **Create a Vercel account** at https://vercel.com

2. **Import your project**:
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the `frontend` directory as the root

3. **Configure**:
   - Framework Preset: Vite
   - Build Command: npm run build
   - Output Directory: dist

4. **Deploy**:
   - Click "Deploy"
   - Push changes to main branch to trigger automatic deployments

## GitHub Actions Secrets

Add these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

### For Frontend (Vercel)

- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### For Backend (Railway)

- `RAILWAY_TOKEN`: Your Railway API token
- `DATABASE_URL`: Your PostgreSQL connection string (for migrations)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/` | Root endpoint |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.
