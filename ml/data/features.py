import numpy as np
import pandas as pd


def build_features(index_series: pd.Series, lags: int = 14) -> pd.DataFrame:
    df = pd.DataFrame({"index_level": index_series})
    df["days_from_start"] = np.arange(len(df))

    for lag in [1, 3, 7, 14]:
        if lag <= lags:
            df[f"lag_{lag}"] = df["index_level"].shift(lag)

    for w in [7, 14, 30]:
        df[f"rolling_mean_{w}"] = df["index_level"].rolling(w).mean()
        df[f"rolling_std_{w}"] = df["index_level"].rolling(w).std()

    df["return_1d"] = df["index_level"].pct_change()
    df["return_7d"] = df["index_level"].pct_change(7)

    delta = df["index_level"].diff()
    gain = delta.where(delta > 0, 0.0)
    loss = (-delta.where(delta < 0, 0.0))
    avg_gain = gain.rolling(14, min_periods=1).mean()
    avg_loss = loss.rolling(14, min_periods=1).mean()
    rs = avg_gain / avg_loss
    df["rsi_14"] = 100.0 - (100.0 / (1.0 + rs))

    sma_50 = df["index_level"].rolling(50).mean()
    df["sma_ratio"] = df["index_level"] / sma_50

    df.dropna(inplace=True)
    return df.drop(columns=["index_level"])


def build_index_series(df: pd.DataFrame, assets: list[str]) -> pd.Series:
    df_pivot = df.pivot_table(index="timestamp", columns="asset", values="price", aggfunc="first")
    df_pivot.sort_index(inplace=True)
    df_pivot.ffill(inplace=True)
    df_pivot.dropna(inplace=True)
    initial_avg = df_pivot[assets].iloc[0].mean()
    divisor = initial_avg / 1000.0
    avg_price = df_pivot[assets].mean(axis=1)
    return avg_price / divisor
