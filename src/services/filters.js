export const analyze_trading_opportunity = (token) => {

    //profitabillity score
    const calculate_score = (metrics) => {
        let score = 0;

        if (metrics.hasEnoughLiquidity) {
            score += 50;
        }

        if (metrics.hasGoodVolume) {
            score += 20;
        }

        if (metrics.isEarlyOpportunity) {
            score += 15;
        }

        if (metrics.buyPressure > 0.6) {
            score += 20;

        } else if (metrics.buyPressure > 0.5) {
            score += 10;
        }

        if (metrics.hasEnoughHolders) {
            score += 15;
        }

        return score;
    };


    try {
        // thresholds
        const MINIMUM_LIQUIDITY_USD = 10000;    
        const MINIMUM_VOLUME_24H = 5000;        
        const MINIMUM_HOLDERS = 100;            
        const MAXIMUM_MARKET_CAP = 1000000;     

        //require market data
        const {
            liquidity,
            volume,
            transactions,
            priceChange,
            marketCap
        } = token.market_data;

        // Calculate metrics
        const metrics = {
            hasEnoughLiquidity: liquidity.usd >= MINIMUM_LIQUIDITY_USD,
            hasGoodVolume: volume.h24 >= MINIMUM_VOLUME_24H,
            isEarlyOpportunity: marketCap <= MAXIMUM_MARKET_CAP,
            buyPressure: transactions.h24.buys / (transactions.h24.buys + transactions.h24.sells),
            priceMovement24h: priceChange.h24,
            hasEnoughHolders: token.on_chain_data.holders >= MINIMUM_HOLDERS
        };

        //score
        const score = calculate_score(metrics);

        return {
            tokenAddress: token.token_address,
            isGoodTrade: score >= 70,
            score,
            metrics,
            timestamp: new Date()
        };

    } catch (error) {
        console.error(`Error analyzing trading opportunity for token:`, error);
        return null;
    }
};
