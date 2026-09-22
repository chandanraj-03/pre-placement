import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.gd_routes import router as gd_router
from app.routes.hr_routes import router as hr_router
from app.routes.resume_routes import router as resume_router
from app.routes.history_routes import router as history_router
from app.routes.stt_routes import router as stt_router
from app.routes.note_routes import router as note_router
from app.config import PORT, HOST

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

app = FastAPI(
    title="Personal AI Pre-Placement Preparation Assistant API",
    description="Backend API for GD practice, HR interviews, Resume mock rounds, notes management, and speech communication coaching.",
    version="1.0.0",
)

# Allow CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits localhost Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(gd_router)
app.include_router(hr_router)
app.include_router(resume_router)
app.include_router(history_router)
app.include_router(stt_router)
app.include_router(note_router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Personal AI Pre-Placement Assistant Backend",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
