import dexscreener from "./services/dexscreener.js";
import JupiterTrader from "./services/jupiter.js";
import GoogleSheetsManager from "./services/google-sheet.js";
import SolanaFetcher from "./services/web3.js";

class AutoTrader {
    constructor() {
        this.dexscreener_instance = dexscreener();
        this.jupiter_trader = new JupiterTrader();
        this.sheets_manager = new GoogleSheetsManager();
        this.solana_fetcher = new SolanaFetcher();
        this.isRunning = false;
        this.monitorInterval = null;
        this.processedTokens = new Set();
        this.activeTrades = new Map();
    }

    calculatePairAge(pairCreatedAt) {
        const now = Date.now();
        const createdAt = parseInt(pairCreatedAt);
        return (now - createdAt) / (1000 * 60); 
    }

    async analyzeTradingOpportunity(token) {
        const pairAge = this.calculatePairAge(token.pairCreatedAt);
        
        console.log(`\nAnalyzing token: ${token.tokenAddress}`);
        console.log(`Current conditions:`);
        console.log(`- Liquidity: $${token.liquidity?.usd}`);
        console.log(`- 24h Buys: ${token.txns?.h24?.buys}`);
        console.log(`- Age: ${pairAge.toFixed(2)} minutes`);

        const conditions = {
            hasEnoughLiquidity: token.liquidity?.usd >= 100000,
            hasEnoughBuys: token.txns?.h24?.buys >= 50,
            isNewPair: pairAge >= 0 && pairAge <= 4
        };

        return {
            tokenAddress: token.tokenAddress,
            isGoodTrade: Object.values(conditions).every(condition => condition),
            metrics: {
                liquidityUsd: token.liquidity?.usd,
                buys24h: token.txns?.h24?.buys,
                pairAge: pairAge
            },
            shouldSell: pairAge >= 4.5
        };
    }

    async processToken(token) {
        try {
            if (this.processedTokens.has(token.tokenAddress) || 
                this.activeTrades.has(token.tokenAddress)) {
                return;
            }

            const analysis = await this.analyzeTradingOpportunity(token);
            
            if (analysis.isGoodTrade) {

                this.activeTrades.set(token.tokenAddress, true);

                const tradeData = {
                    tokenAddress: token.tokenAddress,
                    entryTime: analysis.metrics.pairAge,
                    initialLiquidity: analysis.metrics.liquidityUsd,
                    buys24h: analysis.metrics.buys24h
                };

                try {
                    const buyResult = await this.jupiter_trader.executeBuy(token.tokenAddress, 0.1);
                    tradeData.entryPrice = buyResult.price;
                    console.log(`Buy executed at ${tradeData.entryPrice}`);

                    const sellInterval = setInterval(async () => {
                        const currentAge = this.calculatePairAge(token.pairCreatedAt);
                        console.log(`Monitoring ${token.tokenAddress} - Age: ${currentAge.toFixed(2)} minutes`);
                        
                        if (currentAge >= 4.5) {
                            clearInterval(sellInterval);
                            
                            try {
                                const tokenBalance = await this.jupiter_trader.getTokenBalance(token.tokenAddress);
                                const sellResult = await this.jupiter_trader.executeSell(token.tokenAddress, tokenBalance);

                                const completeTradeData = {
                                    ...tradeData,
                                    exitTime: currentAge,
                                    exitPrice: sellResult.price,
                                    roi: sellResult.roi
                                };

                                console.log(`Sell executed at ${sellResult.price}`);
                                console.log(`ROI: ${sellResult.roi?.toFixed(2)}%`);

                                if (!this.processedTokens.has(token.tokenAddress)) {
                                    await this.sheets_manager.logTrade(completeTradeData);
                                    this.processedTokens.add(token.tokenAddress);
                                    console.log(`Trade logged for ${token.tokenAddress}`);
                                }
                            } catch (sellError) {
                                console.error(`Sell error for ${token.tokenAddress}:`, sellError);
                            }

                            this.activeTrades.delete(token.tokenAddress);
                        }
                    }, 100);

                } catch (buyError) {
                    console.error(`Buy error for ${token.tokenAddress}:`, buyError);
                    this.activeTrades.delete(token.tokenAddress);
                }
            }

        } catch (error) {
            console.error(`Error processing token ${token.tokenAddress}:`, error);
            this.activeTrades.delete(token.tokenAddress);
        }
    }

    async start() {
        if (this.isRunning) return;

        this.isRunning = true;
        console.log('Auto-trader started');
        await this.sheets_manager.initializeSheet();

        this.monitorInterval = setInterval(async () => {
            try {
                const tokens = await this.dexscreener_instance.fetch_latest_tokens();
                if (Array.isArray(tokens)) {
                    for (const token of tokens) {
                        await this.processToken(token);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            } catch (error) {
                console.error('Error in monitoring loop:', error);
            }
        }, 5000);
    }

    stop() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        this.isRunning = false;
        console.log('Auto-trader stopped');
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            processedTokens: Array.from(this.processedTokens),
            activeTradesCount: this.activeTrades.size
        };
    }
}

export default AutoTrader