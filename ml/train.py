import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

from ml.data.fetcher import fetch_yahoo_data
from ml.data.features import build_features, build_index_series
from ml.models.xgboost_model import XGBoostForecast
from ml.models.rf_model import RandomForestForecast
from ml.models.prophet_model import ProphetForecast

ASSETS = ["BTC-USD"]
ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
TRAIN_CUTOFF = "2025-01-01"
FORECAST_HORIZON = 60


def iterative_forecast(model, series: pd.Series, horizon: int) -> np.ndarray:
    extended = series.copy()
    preds = []
    for step in range(horizon):
        features = build_features(extended)
        last_row = features.iloc[[-1]]
        pred = model.predict(1, features=last_row)[0]
        preds.append(pred)
        next_date = extended.index[-1] + pd.Timedelta(days=1)
        extended = pd.concat([extended, pd.Series([pred], index=[next_date])])
    return np.array(preds)


def main() -> None:
    print("Fetching data from Yahoo Finance...")
    df = fetch_yahoo_data(ASSETS)

    print("Building index series...")
    index_series = build_index_series(df, ASSETS)
    dates = index_series.index

    cutoff = pd.Timestamp(TRAIN_CUTOFF)
    train_mask = dates < cutoff
    test_mask = dates >= cutoff
    train_values = index_series.values[train_mask]
    test_values = index_series.values[test_mask]
    train_dates = dates[train_mask]
    test_dates = dates[test_mask]
    split_idx = int(train_mask.sum())
    horizon = len(test_values)

    print(f"Train: {train_dates[0].date()} — {train_dates[-1].date()} ({len(train_values)} days)")
    print(f"Test:  {test_dates[0].date()} — {test_dates[-1].date()} ({len(test_values)} days)")

    print("Building features...")
    all_features = build_features(index_series)
    train_features = all_features.loc[all_features.index < cutoff]
    test_features = all_features.loc[all_features.index >= cutoff]

    models = [
        XGBoostForecast(),
        RandomForestForecast(),
        ProphetForecast(),
    ]

    predictions_output = []
    metadata: dict = {
        "trained_at": datetime.now().isoformat(),
        "train_end": str(train_dates[-1]),
        "test_start": str(test_dates[0]),
        "assets": ASSETS,
        "models": {},
    }

    for model in models:
        print(f"Training {model.name} (backtest)...")
        try:
            if model.name in ("XGBoost", "Random Forest"):
                train_vals_aligned = index_series.values[:split_idx]
                offset = len(train_vals_aligned) - len(train_features)
                model.fit(train_dates, train_vals_aligned[offset:], features=train_features)
                preds = model.predict(min(horizon, len(test_features)), features=test_features)
            else:
                model.fit(train_dates, train_values)
                preds = model.predict(horizon)

            actual_for_eval = test_values[: len(preds)]
            metrics = model.evaluate(actual_for_eval, preds)
            print(f"  {model.name}: MAE={metrics['mae']:.2f}, RMSE={metrics['rmse']:.2f}, MAPE={metrics['mape']:.4f}")

            predictions_output.append({
                "model_name": model.name,
                "dates": [str(d)[:10] for d in test_dates[: len(preds)]],
                "predicted": [float(v) for v in preds],
                "metrics": metrics,
            })
            metadata["models"][model.name] = metrics
        except Exception as e:
            print(f"  {model.name} failed: {e}", file=sys.stderr)
            predictions_output.append({
                "model_name": model.name,
                "dates": [],
                "predicted": [],
                "metrics": {},
            })

    # --- 60-day forward forecast ---
    print(f"\nGenerating {FORECAST_HORIZON}-day forward forecast...")

    last_date = dates[-1]
    forecast_dates = [
        (last_date + pd.Timedelta(days=i + 1)).strftime("%Y-%m-%d")
        for i in range(FORECAST_HORIZON)
    ]

    full_features = build_features(index_series)
    full_values = index_series.values
    offset_full = len(full_values) - len(full_features)

    forecast_models = []
    for model_cls in [XGBoostForecast, RandomForestForecast, ProphetForecast]:
        model = model_cls()
        print(f"Training {model.name} (full data for forecast)...")
        try:
            if model.name in ("XGBoost", "Random Forest"):
                model.fit(dates, full_values[offset_full:], features=full_features)
                preds = iterative_forecast(model, index_series, FORECAST_HORIZON)
            else:
                model.fit(dates, index_series.values)
                preds = model.predict(FORECAST_HORIZON)

            forecast_models.append({
                "model_name": model.name,
                "predicted": [float(v) for v in preds],
            })
            print(f"  {model.name}: forecast range [{preds.min():.2f}, {preds.max():.2f}]")
        except Exception as e:
            print(f"  {model.name} forecast failed: {e}", file=sys.stderr)
            forecast_models.append({
                "model_name": model.name,
                "predicted": [],
            })

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    trailing_n = 90
    trailing_dates = [str(d)[:10] for d in dates[-trailing_n:]]
    trailing_values = [float(v) for v in index_series.values[-trailing_n:]]

    output = {
        "actual_dates": [str(d)[:10] for d in test_dates],
        "actual_values": [float(v) for v in test_values],
        "predictions": predictions_output,
        "forecast": {
            "dates": forecast_dates,
            "trailing_dates": trailing_dates,
            "trailing_values": trailing_values,
            "models": forecast_models,
        },
        "metadata": metadata,
    }

    (ARTIFACTS_DIR / "predictions.json").write_text(json.dumps(output, indent=2))
    (ARTIFACTS_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2))
    print(f"Artifacts written to {ARTIFACTS_DIR}")


if __name__ == "__main__":
    main()
