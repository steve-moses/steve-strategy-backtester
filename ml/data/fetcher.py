from datetime import date

import pandas as pd
import yfinance as yf


def fetch_yahoo_data(
    tickers: list[str],
    start_date: str = "2021-01-01",
    end_date: str | None = None,
) -> pd.DataFrame:
    if end_date is None:
        end_date = date.today().isoformat()
    frames: list[pd.DataFrame] = []
    for ticker in tickers:
        t = yf.Ticker(ticker)
        hist = t.history(start=start_date, end=end_date, interval="1d")
        if hist.empty:
            continue
        df = pd.DataFrame({
            "timestamp": hist.index.tz_localize(None),
            "price": hist["Close"].values,
            "asset": ticker,
        })
        frames.append(df)

    if not frames:
        return pd.DataFrame(columns=["timestamp", "price", "asset"])
    return pd.concat(frames, ignore_index=True)
