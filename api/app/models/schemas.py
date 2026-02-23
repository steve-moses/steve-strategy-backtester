from pydantic import BaseModel, Field


class PricePoint(BaseModel):
    timestamp: str
    price: float


class AssetPrices(BaseModel):
    asset: str
    prices: list[PricePoint]


class AssetMetadata(BaseModel):
    symbol: str
    name: str
    color: str


class IndexConfig(BaseModel):
    assets: list[str] = Field(default=["BTC-USD", "ETH-USD", "SOL-USD"])
    weights: dict[str, float] | None = None
    start_time: str = "2021-01-03"
    end_time: str = "2026-02-23"
    initial_level: float = 1000.0
    rebalance: str = Field(default="none", pattern="^(none|daily|weekly|monthly)$")


class IndexResult(BaseModel):
    dates: list[str]
    index_values: list[float]
    component_prices: dict[str, list[float]]


class IndicatorRequest(BaseModel):
    asset: str = "Index"
    indicator: str = Field(pattern="^(sma|rsi|bollinger|macd|volatility)$")
    prices: list[float]
    dates: list[str]
    params: dict[str, float] = {}


class IndicatorResult(BaseModel):
    dates: list[str]
    values: dict[str, list[float | None]]


class VarRequest(BaseModel):
    returns: list[list[float]]
    asset_names: list[str]
    num_simulations: int = Field(default=10000, ge=1000, le=50000)
    confidence_level: float = Field(default=0.95, ge=0.80, le=0.99)
    portfolio_value: float = 1000.0


class VarResult(BaseModel):
    monte_carlo_var: float
    monte_carlo_var_dollar: float
    cholesky_var: float
    cholesky_var_dollar: float
    simulated_returns: list[float]
    cholesky_returns: list[float]


class PresetConfig(BaseModel):
    name: str
    description: str
    config: IndexConfig


class ModelPrediction(BaseModel):
    model_name: str
    dates: list[str]
    predicted: list[float]
    metrics: dict[str, float]


class ForecastModelEntry(BaseModel):
    model_name: str
    predicted: list[float]


class ForecastData(BaseModel):
    dates: list[str]
    trailing_dates: list[str]
    trailing_values: list[float]
    models: list[ForecastModelEntry]


class PredictionsResponse(BaseModel):
    actual_dates: list[str]
    actual_values: list[float]
    predictions: list[ModelPrediction]
    forecast: ForecastData | None = None
    metadata: dict
