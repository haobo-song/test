from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import aiohttp
import asyncio
import json
from datetime import datetime, timedelta
import time
from typing import Dict, Any, List, Tuple
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# List of symbols to track
SYMBOLS = ["AAPL", "GOOGL", "MSFT", "AMZN", "META", "^GSPC"]

# Headers for Yahoo Finance API
YAHOO_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def get_unix_timestamp(days_ago: int = 365) -> Tuple[int, int]:
    """Get Unix timestamp for start and end dates."""
    end = datetime.now()
    start = end - timedelta(days=days_ago)
    return int(start.timestamp()), int(end.timestamp())

async def fetch_stock_history(symbol: str) -> Dict[str, Any]:
    """Fetch historical daily stock data from Yahoo Finance."""
    try:
        start_time, end_time = get_unix_timestamp()
        
        async with aiohttp.ClientSession() as session:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&period1={start_time}&period2={end_time}"
            async with session.get(url, headers=YAHOO_HEADERS) as response:
                if response.status != 200:
                    raise Exception(f"Yahoo Finance API returned status {response.status}")
                
                data = await response.json()
                result = data["chart"]["result"][0]
                timestamps = result["timestamp"]
                quotes = result["indicators"]["quote"][0]
                
                # Get current price and metadata
                meta = result["meta"]
                current_price = meta["regularMarketPrice"]
                
                # Calculate daily price history
                history = []
                for i in range(len(timestamps)):
                    close_price = quotes["close"][i]
                    if close_price is not None:  # Skip any null values
                        history.append({
                            "date": datetime.fromtimestamp(timestamps[i]).strftime("%Y-%m-%d"),
                            "price": close_price,
                            "volume": quotes["volume"][i]
                        })
                
                # Calculate previous close from history
                if len(history) >= 2:
                    previous_close = history[-2]["price"]  # Use second to last price as previous close
                else:
                    previous_close = current_price  # Fallback to current price if no history
                
                return {
                    "symbol": symbol,
                    "name": meta.get("shortName", symbol),
                    "current_price": current_price,
                    "change": current_price - previous_close,
                    "change_percent": ((current_price - previous_close) / previous_close) * 100,
                    "volume": meta.get("regularMarketVolume", 0),
                    "history": history
                }
                
    except Exception as e:
        print(f"Error fetching data for {symbol}: {str(e)}")
        return {
            "symbol": symbol,
            "name": symbol,
            "current_price": None,
            "change": None,
            "change_percent": None,
            "volume": None,
            "history": []
        }

async def get_market_data():
    """Fetch historical market data for all symbols."""
    tasks = [fetch_stock_history(symbol) for symbol in SYMBOLS]
    results = await asyncio.gather(*tasks)
    return {result["symbol"]: result for result in results}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            market_data = await get_market_data()
            await websocket.send_json(market_data)
            await asyncio.sleep(5)  # Update every 5 seconds
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

@app.get("/api/market-data")
async def get_current_market_data():
    """REST endpoint for getting market data with price history."""
    return await get_market_data()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 