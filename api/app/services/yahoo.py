import pandas as pd
import numpy as np
import yfinance as yf

from api.app.cache.memory import cache

ASSET_METADATA = {
    "BTC-USD": {"name": "Bitcoin", "color": "#F7931A", "category": "crypto"},
    "ETH-USD": {"name": "Ethereum", "color": "#627EEA", "category": "crypto"},
    "XRP-USD": {"name": "Ripple", "color": "#00AAE4", "category": "crypto"},
    "SOL-USD": {"name": "Solana", "color": "#9945FF", "category": "crypto"},
    "ADA-USD": {"name": "Cardano", "color": "#0033AD", "category": "crypto"},
    "LINK-USD": {"name": "Chainlink", "color": "#2A5ADA", "category": "crypto"},
    "AVAX-USD": {"name": "Avalanche", "color": "#E84142", "category": "crypto"},
    "DOT-USD": {"name": "Polkadot", "color": "#E6007A", "category": "crypto"},
    "LTC-USD": {"name": "Litecoin", "color": "#BFBBBB", "category": "crypto"},
    "BCH-USD": {"name": "Bitcoin Cash", "color": "#8DC351", "category": "crypto"},
    "MATIC-USD": {"name": "Polygon", "color": "#8247E5", "category": "crypto"},
    "UNI-USD": {"name": "Uniswap", "color": "#FF007A", "category": "crypto"},
    "ATOM-USD": {"name": "Cosmos", "color": "#2E3148", "category": "crypto"},
    "XLM-USD": {"name": "Stellar", "color": "#14B6E7", "category": "crypto"},
    "ALGO-USD": {"name": "Algorand", "color": "#6B7280", "category": "crypto"},
    "AAPL": {"name": "Apple", "color": "#A2AAAD", "category": "equity"},
    "MSFT": {"name": "Microsoft", "color": "#00A4EF", "category": "equity"},
    "GOOGL": {"name": "Alphabet", "color": "#4285F4", "category": "equity"},
    "AMZN": {"name": "Amazon", "color": "#FF9900", "category": "equity"},
    "NVDA": {"name": "Nvidia", "color": "#76B900", "category": "equity"},
    "META": {"name": "Meta", "color": "#0668E1", "category": "equity"},
    "TSLA": {"name": "Tesla", "color": "#CC0000", "category": "equity"},
    "JPM": {"name": "JPMorgan", "color": "#003087", "category": "equity"},
    "V": {"name": "Visa", "color": "#1A1F71", "category": "equity"},
    "JNJ": {"name": "Johnson & Johnson", "color": "#D51900", "category": "equity"},
    "SPY": {"name": "S&P 500 ETF", "color": "#22C55E", "category": "etf"},
    "QQQ": {"name": "Nasdaq 100 ETF", "color": "#3B82F6", "category": "etf"},
    "IWM": {"name": "Russell 2000 ETF", "color": "#EAB308", "category": "etf"},
    "URTH": {"name": "MSCI World ETF", "color": "#A855F7", "category": "etf"},
    "CASH": {"name": "Cash", "color": "#9CA3AF", "category": "cash"},
}


def get_available_assets() -> list[dict]:
    return [
        {"symbol": sym, "name": meta["name"], "color": meta["color"], "category": meta["category"]}
        for sym, meta in ASSET_METADATA.items()
    ]


def _generate_cash_series(start: str, end: str) -> pd.DataFrame:
    dates = pd.bdate_range(start=start, end=end)
    return pd.DataFrame({
        "timestamp": dates,
        "price": np.ones(len(dates)),
        "asset": "CASH",
    })


def fetch_prices(
    assets: list[str],
    start_date: str,
    end_date: str,
) -> pd.DataFrame:
    start = start_date[:10]
    end = end_date[:10]

    frames: list[pd.DataFrame] = []

    for asset in assets:
        if asset == "CASH":
            frames.append(_generate_cash_series(start, end))
            continue

        cache_key = f"yf:{asset}:{start}:{end}"
        cached = cache.get(cache_key)
        if cached is not None:
            frames.append(cached)
            continue

        ticker = yf.Ticker(asset)
        hist = ticker.history(start=start, end=end, interval="1d")

        if hist.empty:
            continue

        df = pd.DataFrame({
            "timestamp": hist.index.tz_localize(None),
            "price": hist["Close"].values,
            "asset": asset,
        })
        cache.set(cache_key, df)
        frames.append(df)

    if not frames:
        return pd.DataFrame(columns=["timestamp", "price", "asset"])

    return pd.concat(frames, ignore_index=True)
