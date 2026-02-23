# Crypto Index Dashboard

#Claude Notes:
- Do not commit to my github, keep all changes locally

## Project Overview
Single-page dashboard for a configurable cryptocurrency portfolio index. Next.js 15 frontend + FastAPI backend, deployed on Vercel. Fetches daily close prices from Yahoo Finance (no API key needed). Features: user-configurable indices (assets, weights, rebalancing), technical indicators (SMA, RSI, Bollinger, MACD, Volatility), and Monte Carlo VaR.

## Tech Stack
- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Charts**: TradingView Lightweight Charts v5 (financial), Recharts (stats)
- **State**: Zustand (index config), SWR (data fetching)
- **Backend**: FastAPI (Python 3.12) — serverless on Vercel
- **Data**: Yahoo Finance via yfinance (daily close prices, no API key required)

## Project Structure
```
frontend/              Next.js 15 app
  src/app/             Single page: / (dashboard + config)
  src/components/      charts/, configure/, ui/ (shadcn)
  src/lib/             api.ts, types.ts, constants.ts
  src/hooks/           SWR hooks per data domain
  src/store/           Zustand index config store
api/                   FastAPI serverless backend
  index.py             Vercel entrypoint
  app/main.py          FastAPI app with CORS + routers
  app/routers/         market_data, index, indicators, var
  app/services/        yahoo, index_engine, technical, var_engine
  app/models/          Pydantic schemas
  app/cache/           In-memory TTL cache
docker-compose.yml     Local Docker orchestration
vercel.json            Deployment config
```

## Running Locally
```bash
# Docker (easiest)
docker compose up

# Or manually:
# Frontend
cd frontend && npm install && npm run dev

# Backend (separate terminal, from project root)
pip install -r api/requirements.txt
uvicorn api.app.main:app --reload
```

## Asset Symbols
Uses Yahoo Finance ticker format: `ETH-USD`, `BTC-USD`, `SOL-USD`, etc.

## Key Patterns
- Dashboard page (/) includes collapsible index configuration panel
- Next.js rewrites `/api/*` to FastAPI (dev: localhost:8000, prod: Vercel serverless)
- Lightweight Charts v5 API: use `chart.addSeries(LineSeries, opts)` not `addLineSeries()`
- Single page client component ("use client") using SWR hooks
- Dark theme via `<html className="dark">` + shadcn dark CSS variables
- Backend uses in-memory TTL cache for Yahoo Finance responses
- Index construction: configurable weights + rebalancing via divisor method
- No API key required — Yahoo Finance is free
