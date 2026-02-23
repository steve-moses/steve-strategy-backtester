from fastapi import APIRouter
import pandas as pd

from api.app.models.schemas import IndexConfig, IndexResult, PresetConfig
from api.app.services.yahoo import fetch_prices
from api.app.services.index_engine import compute_index

router = APIRouter(prefix="/api/index", tags=["index"])

PRESETS = [
    PresetConfig(
        name="Original 5",
        description="Top 5 non-BTC/non-stablecoin by market cap (Jan 2021)",
        config=IndexConfig(),
    ),
    PresetConfig(
        name="Smart Contract Platforms",
        description="ETH, SOL, ADA, AVAX, DOT",
        config=IndexConfig(
            assets=["ETH-USD", "SOL-USD", "ADA-USD", "AVAX-USD", "DOT-USD"],
        ),
    ),
    PresetConfig(
        name="Legacy Payments",
        description="BCH, XRP, LTC, XLM",
        config=IndexConfig(
            assets=["BCH-USD", "XRP-USD", "LTC-USD", "XLM-USD"],
        ),
    ),
]


@router.get("/presets")
def get_presets() -> list[PresetConfig]:
    return PRESETS


@router.post("/compute")
def compute(config: IndexConfig) -> IndexResult:
    df = fetch_prices(config.assets, config.start_time, config.end_time)
    df_pivot = df.pivot_table(
        index="timestamp", columns="asset", values="price", aggfunc="first"
    )
    df_pivot.sort_index(inplace=True)
    df_pivot.ffill(inplace=True)
    df_pivot.dropna(inplace=True)

    index_series = compute_index(
        df_pivot,
        weights=config.weights,
        initial_level=config.initial_level,
        rebalance=config.rebalance,
    )

    dates = df_pivot.index.strftime("%Y-%m-%d").tolist()
    component_prices = {
        col: df_pivot[col].tolist() for col in df_pivot.columns
    }

    return IndexResult(
        dates=dates,
        index_values=index_series.tolist(),
        component_prices=component_prices,
    )
