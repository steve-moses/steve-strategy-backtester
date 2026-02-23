import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import RandomizedSearchCV

from ml.models.base import ForecastModel


class XGBoostForecast(ForecastModel):
    name = "XGBoost"

    def __init__(self) -> None:
        self._model: xgb.XGBRegressor | None = None
        self._last_features: pd.DataFrame | None = None

    def fit(self, train_dates: pd.DatetimeIndex, train_values: np.ndarray, features: pd.DataFrame | None = None) -> None:
        if features is None:
            raise ValueError("XGBoost requires feature DataFrame")

        param_grid = {
            "n_estimators": [50, 100, 150, 200],
            "learning_rate": [0.01, 0.05, 0.1],
            "max_depth": [3, 4, 5, 6],
            "colsample_bytree": [0.7, 0.8, 0.9, 1.0],
            "gamma": [0, 0.1, 0.2],
        }
        base = xgb.XGBRegressor(objective="reg:squarederror", random_state=42)
        search = RandomizedSearchCV(
            base, param_grid, n_iter=15, cv=3, random_state=42, n_jobs=-1
        )
        search.fit(features.values, train_values[: len(features)])
        self._model = search.best_estimator_
        self._last_features = features

    def predict(self, horizon: int, features: pd.DataFrame | None = None) -> np.ndarray:
        if self._model is None:
            raise RuntimeError("Model not fitted")
        if features is None:
            raise ValueError("XGBoost requires feature DataFrame for prediction")
        return self._model.predict(features.values[:horizon])
