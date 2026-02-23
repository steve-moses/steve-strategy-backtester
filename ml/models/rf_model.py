import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import RandomizedSearchCV

from ml.models.base import ForecastModel


class RandomForestForecast(ForecastModel):
    name = "Random Forest"

    def __init__(self) -> None:
        self._model: RandomForestRegressor | None = None

    def fit(self, train_dates: pd.DatetimeIndex, train_values: np.ndarray, features: pd.DataFrame | None = None) -> None:
        if features is None:
            raise ValueError("Random Forest requires feature DataFrame")

        param_grid = {
            "n_estimators": [100, 200, 300],
            "max_depth": [5, 10, 15, None],
            "min_samples_split": [2, 5, 10],
            "min_samples_leaf": [1, 2, 4],
        }
        base = RandomForestRegressor(random_state=42)
        search = RandomizedSearchCV(
            base, param_grid, n_iter=15, cv=3, random_state=42, n_jobs=-1
        )
        search.fit(features.values, train_values[: len(features)])
        self._model = search.best_estimator_

    def predict(self, horizon: int, features: pd.DataFrame | None = None) -> np.ndarray:
        if self._model is None:
            raise RuntimeError("Model not fitted")
        if features is None:
            raise ValueError("Random Forest requires feature DataFrame for prediction")
        return self._model.predict(features.values[:horizon])
