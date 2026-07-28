from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import auth, exercises, workouts, plans

app = FastAPI(
    title="Gorilla API",
    description="Backend do zliczania powtórzeń, serii i ciężarów na siłowni",
    version="0.1.0",
)

# CORS - na start otwarte, docelowo ogranicz do domeny swojego frontendu
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(exercises.router)
app.include_router(workouts.router)
app.include_router(plans.router)


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok"}
