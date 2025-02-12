import JupiterTrader from './jupiter.js';
import database from './database.js';

const database_instance = database();

export default function trading(wallet) {
    const jupiter_trader = new JupiterTrader(wallet);

    const execute_trade = async (tokenAddress) => {
        try {
            //get token data from database
            const token = await database_instance.get_token(tokenAddress);
            
            if (!token?.trading_analysis?.isGoodTrade) {
                console.log(`Token ${tokenAddress} doesn't meet trading criteria`);
                return null;
            }

         
            //get quote and execute buy
            const quoteResult = await jupiter_trader.executeBuy(
                tokenAddress, 
                tradeAmount
            );

            if (!quoteResult) {
                console.log(`quote failed for ${tokenAddress}`);
                return null;
            }

            //process quote information
            const trade_info = {
                type: 'BUY',
                input: {
                    mint: quoteResult.inputMint,
                    amount: quoteResult.inAmount,
                    amountUsd: quoteResult.swapUsdValue
                },
                output: {
                    mint: quoteResult.outputMint,
                    amount: quoteResult.outAmount,
                    minimumAmount: quoteResult.otherAmountThreshold
                },
                priceImpact: quoteResult.priceImpact,
                slippage: quoteResult.slippageBps / 100, //percenttage
                timestamp: new Date(),
                status: 'QUOTED'
            };

            //update database
            await database_instance.update_token_trades(
                tokenAddress, 
                trade_info
            );

            return {
                success: true,
                trade: trade_info,
                quote: quoteResult
            };

        } catch (error) {
            console.error(`Error executing clode`, error);
        }
    };

    return {
        execute_trade
    };
}