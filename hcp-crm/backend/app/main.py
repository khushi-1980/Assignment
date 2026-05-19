from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.interactions import router as interaction_router
from app.api.chat import router as chat_router
from app.models.database import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB tables on startup."""
    create_tables()
    # Seed sample HCPs for demo
    _seed_demo_data()
    yield


def _seed_demo_data():
    """Insert sample HCPs if the table is empty."""
    from app.models.database import get_db, HCP
    
    db = next(get_db())
    try:
        if db.query(HCP).count() == 0:
            sample_hcps = [
                HCP(name="Dr. Priya Sharma", specialty="Oncology",
                    institution="Apollo Hospital", territory="North"),
                HCP(name="Dr. Rahul Patel", specialty="Cardiology",
                    institution="Fortis Health", territory="West"),
                HCP(name="Dr. Ananya Singh", specialty="Neurology",
                    institution="AIIMS Delhi", territory="Central"),
                HCP(name="Dr. Vikram Nair", specialty="Endocrinology",
                    institution="Manipal Hospital", territory="South"),
                HCP(name="Dr. Meera Kapoor", specialty="Rheumatology",
                    institution="Max Healthcare", territory="East"),
            ]
            db.add_all(sample_hcps)
            db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


app = FastAPI(
    title="HCP CRM API",
    description="AI-First CRM for Healthcare Professional Interaction Management",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interaction_router, prefix="/api", tags=["Interactions & HCPs"])
app.include_router(chat_router, prefix="/api", tags=["AI Chat Agent"])


@app.get("/")
def root():
    return {
        "message": "HCP CRM API is running",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
