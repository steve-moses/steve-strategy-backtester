from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.app.config import get_settings
from api.app.routers import market_data, index, indicators, var, predictions

app = FastAPI(title="Crypto Index API", version="1.0.0")

settings = get_settings()
origins = [o.strip() for o in settings.allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market_data.router)
app.include_router(index.router)
app.include_router(indicators.router)
app.include_router(var.router)
app.include_router(predictions.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
