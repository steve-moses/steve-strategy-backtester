from fastapi import APIRouter
import numpy as np

from api.app.models.schemas import VarRequest, VarResult
from api.app.services.var_engine import simulate_var

router = APIRouter(prefix="/api/var", tags=["var"])


@router.post("/simulate")
def simulate(req: VarRequest) -> VarResult:
    returns_matrix = np.array(req.returns)
    result = simulate_var(
        returns_matrix,
        num_simulations=req.num_simulations,
        confidence_level=req.confidence_level,
        portfolio_value=req.portfolio_value,
    )
    return VarResult(**result)
