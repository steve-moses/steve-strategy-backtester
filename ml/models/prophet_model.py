import logging

import numpy as np
import pandas as pd
from prophet import Prophet

from ml.models.base import ForecastModel

logging.getLogger("cmdstanpy").setLevel(logging.WARNING)


class ProphetForecast(ForecastModel):
    name = "Prophet"

    def __init__(self) -> None:
        self._model: Prophet | None = None
        self._last_date: pd.Timestamp | None = None
        self._scale: float = 1.0

    def fit(self, train_dates: pd.DatetimeIndex, train_values: np.ndarray, features: pd.DataFrame | None = None) -> None:
        self._scale = float(np.mean(train_values))
        scaled = train_values / self._scale
        df = pd.DataFrame({"ds": train_dates, "y": scaled})
        self._model = Prophet(
            daily_seasonality=False,
            yearly_seasonality=True,
            weekly_seasonality=True,
            changepoint_prior_scale=0.05,
        )
        self._model.fit(df)
        self._last_date = train_dates[-1]

    def predict(self, horizon: int, features: pd.DataFrame | None = None) -> np.ndarray:
        if self._model is None or self._last_date is None:
            raise RuntimeError("Model not fitted")
        future = self._model.make_future_dataframe(periods=horizon)
        forecast = self._model.predict(future)
        return forecast["yhat"].values[-horizon:] * self._scale
