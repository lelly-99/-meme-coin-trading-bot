# Solana Meme Coin Trading Bot

A trading bot that can scans for new meme coins, filter them based on specific criteria, and trade them profitably using Solana.

## Features

- Scans for new meme coins launching on Solana via DEX Screener
- Fetches on-chain data using Solana Web3.js:
  - Token decimals
  - Total supply
  - Token verification
- Analyses market data using Jupiter Aggregator
- Implements trading filters to identify profitable trades
- Executes buy and sell orders
- Stores trading data in MongoDB


## Prerequisites

- Node.js
- MongoDB
- Solana Web3.js
- Environment variables setup

## Installation

1. Clone the repository:
```bash
git clone https://github.com/lelly-99/-meme-coin-trading-bot.git
cd meme-coin-trading-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
PORT=3007
MONGO_URL=your_mongodb_connection_string
```

## API Endpoints usage

1. Scan for new meme coins:
```bash
curl http://localhost:3007/fetch-meme-coins
```

2. Get trading opportunities:
```bash
curl http://localhost:3007/trading-opportunities
```

3. Execute a buy order:
```bash
curl -X POST http://localhost:3007/trade/TOKEN_ADDRESS \
-H "Content-Type: application/json" \
-d '{
    "action": "BUY",
    "amount": 0.1
}'
```

4. Execute a sell order:
```bash
curl -X POST http://localhost:3007/trade/TOKEN_ADDRESS \
-H "Content-Type: application/json" \
-d '{
    "action": "SELL",
    "amount": 48218857803
}'
```

5. Check balances:
```bash
curl http://localhost:3007/balances
```

## Development

To start the development server:
```bash
nodemon
```

