from abc import ABC, abstractmethod

import numpy as np
import pandas as pd


class ForecastModel(ABC):
    name: str

    @abstractmethod
    def fit(self, train_dates: pd.DatetimeIndex, train_values: np.ndarray, features: pd.DataFrame | None = None) -> None:
        ...

    @abstractmethod
    def predict(self, horizon: int, features: pd.DataFrame | None = None) -> np.ndarray:
        ...

    def evaluate(self, actual: np.ndarray, predicted: np.ndarray) -> dict[str, float]:
        mae = float(np.mean(np.abs(actual - predicted)))
        rmse = float(np.sqrt(np.mean((actual - predicted) ** 2)))
        mape = float(np.mean(np.abs((actual - predicted) / np.where(actual == 0, 1, actual))))
        return {"mae": mae, "rmse": rmse, "mape": mape}
