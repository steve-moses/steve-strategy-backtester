from fastapi import APIRouter, Query

from api.app.services.yahoo import fetch_prices, get_available_assets

router = APIRouter(prefix="/api/market-data", tags=["market-data"])


@router.get("/assets")
def list_assets():
    return get_available_assets()


@router.get("/prices")
def get_prices(
    assets: str = Query(default="BCH-USD,ETH-USD,XRP-USD,LTC-USD,DOT-USD"),
    start_time: str = Query(default="2021-01-03"),
    end_time: str = Query(default="2026-02-23"),
    interval: str = Query(default="1d"),
):
    asset_list = [a.strip() for a in assets.split(",")]
    df = fetch_prices(asset_list, start_time, end_time)

    result = {}
    for asset in asset_list:
        asset_df = df[df["asset"] == asset].sort_values("timestamp")
        result[asset] = {
            "dates": asset_df["timestamp"].dt.strftime("%Y-%m-%d").tolist(),
            "prices": asset_df["price"].tolist(),
        }
    return result
