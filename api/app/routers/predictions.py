import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from api.app.models.schemas import PredictionsResponse

router = APIRouter(prefix="/api/predictions", tags=["predictions"])

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "ml" / "artifacts"


@router.get("")
def get_predictions() -> PredictionsResponse:
    predictions_file = ARTIFACTS_DIR / "predictions.json"
    if not predictions_file.exists():
        raise HTTPException(404, "No predictions available. Run the ML pipeline first.")

    data = json.loads(predictions_file.read_text())
    return PredictionsResponse(**data)
