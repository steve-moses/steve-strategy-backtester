from fastapi import APIRouter
import pandas as pd

from api.app.models.schemas import IndicatorRequest, IndicatorResult
from api.app.services.technical import (
    compute_sma,
    compute_rsi,
    compute_bollinger,
    compute_macd,
    compute_volatility,
)

router = APIRouter(prefix="/api/indicators", tags=["indicators"])


def _to_nullable_list(s: pd.Series) -> list[float | None]:
    return [None if pd.isna(v) else float(v) for v in s]


@router.post("/compute")
def compute(req: IndicatorRequest) -> IndicatorResult:
    prices = pd.Series(req.prices, index=pd.to_datetime(req.dates))
    params = req.params

    if req.indicator == "sma":
        window = int(params.get("window", 50))
        sma = compute_sma(prices, window)
        return IndicatorResult(
            dates=req.dates,
            values={"price": req.prices, "sma": _to_nullable_list(sma)},
        )

    if req.indicator == "rsi":
        window = int(params.get("window", 14))
        rsi = compute_rsi(prices, window)
        return IndicatorResult(
            dates=req.dates,
            values={"rsi": _to_nullable_list(rsi)},
        )

    if req.indicator == "bollinger":
        window = int(params.get("window", 20))
        num_std = float(params.get("num_std", 2.0))
        sma, upper, lower = compute_bollinger(prices, window, num_std)
        return IndicatorResult(
            dates=req.dates,
            values={
                "price": req.prices,
                "sma": _to_nullable_list(sma),
                "upper": _to_nullable_list(upper),
                "lower": _to_nullable_list(lower),
            },
        )

    if req.indicator == "macd":
        short_w = int(params.get("short_window", 12))
        long_w = int(params.get("long_window", 26))
        signal_w = int(params.get("signal_window", 9))
        macd_line, signal_line, histogram = compute_macd(
            prices, short_w, long_w, signal_w
        )
        return IndicatorResult(
            dates=req.dates,
            values={
                "macd": _to_nullable_list(macd_line),
                "signal": _to_nullable_list(signal_line),
                "histogram": _to_nullable_list(histogram),
            },
        )

    if req.indicator == "volatility":
        window = int(params.get("window", 30))
        vol = compute_volatility(prices, window)
        return IndicatorResult(
            dates=req.dates,
            values={"volatility": _to_nullable_list(vol)},
        )

    return IndicatorResult(dates=[], values={})
