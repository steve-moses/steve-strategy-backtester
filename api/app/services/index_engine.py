import numpy as np
import pandas as pd


def compute_index(
    df_pivot: pd.DataFrame,
    weights: dict[str, float] | None = None,
    initial_level: float = 1000.0,
    rebalance: str = "none",
) -> pd.Series:
    assets = [c for c in df_pivot.columns if c != "Index"]

    if weights is None:
        equal_w = 1.0 / len(assets)
        weights = {a: equal_w for a in assets}

    weight_arr = np.array([weights.get(a, 0.0) for a in assets])
    total = weight_arr.sum()
    if total > 0:
        weight_arr = weight_arr / total

    prices = df_pivot[assets].values
    n = len(prices)

    units = (initial_level * weight_arr) / prices[0]
    index_values = np.empty(n)
    index_values[0] = initial_level

    if rebalance == "none":
        for i in range(1, n):
            index_values[i] = float(np.dot(units, prices[i]))
        return pd.Series(index_values, index=df_pivot.index, name="Index")

    rebalance_dates = _get_rebalance_dates(df_pivot.index, rebalance)

    for i in range(1, n):
        index_values[i] = float(np.dot(units, prices[i]))

        if df_pivot.index[i] in rebalance_dates:
            portfolio_value = index_values[i]
            units = (portfolio_value * weight_arr) / prices[i]

    return pd.Series(index_values, index=df_pivot.index, name="Index")


def _get_rebalance_dates(index: pd.DatetimeIndex, freq: str) -> set:
    if freq == "daily":
        return set(index)

    dates = set()
    if freq == "weekly":
        for dt in index:
            if dt.weekday() == 0:
                dates.add(dt)
    elif freq == "monthly":
        prev_month = None
        for dt in index:
            if prev_month is not None and dt.month != prev_month:
                dates.add(dt)
            prev_month = dt.month

    return dates
