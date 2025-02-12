import dexscreener from '../services/dexscreener.js'
import Token from '../model/tokens.js';
import JupiterTrader from '../services/jupiter.js';      


const dexscreener_instance = dexscreener()
const jupiter_trader = new JupiterTrader()

export default function routes(){

    const fetch_meme_coins = async (req, res) => {

        try {
            const tokens = await dexscreener_instance.fetch_latest_tokens();
            res.status(200).json({
                message: `Fetched and processed ${tokens.length} meme coins.`,
                data: tokens
            });
        } catch (error) {
            console.error('Error in /fetch-meme-coins route:', error.message);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    const get_trading_opportunities = async (req, res) => {

        try {
            const opportunities = await Token.find({
                'trading_analysis.isGoodTrade': true
            }).sort({
                'trading_analysis.score': -1
            });
    
            res.status(200).json({
                count: opportunities.length,
                opportunities: opportunities
            });
        } catch (error) {
            console.error('Error fetching trading opportunities:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
        
    }

    const get_balance = async (req, res) => {
        try {
           
            const solBalance = await jupiter_trader.getSolBalance();
            let tokenBalance = null;
            
            if (req.params.tokenAddress) {
                tokenBalance = await jupiter_trader.getTokenBalance(req.params.tokenAddress);
            }
    
            res.json({
                success: true,
                balances: {
                    sol: solBalance,
                    token: tokenBalance ? {
                        address: req.params.tokenAddress,
                        amount: tokenBalance
                    } : null
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }   
    }

    const make_trades = async (req, res) => {
        
        try {
        
            const { tokenAddress } = req.params;
            const { action, amount } = req.body;
    
            if (!['BUY', 'SELL'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid action. Must be BUY or SELL'
                });
            }
    
            // Execute trade based on action
            let result;
            if (action === 'BUY') {
                result = await jupiter_trader.executeBuy(tokenAddress, amount);
            } else {
                result = await jupiter_trader.executeSell(tokenAddress, amount);
            }
    
            // Get updated balances
            const [solBalance, tokenBalance] = await Promise.all([
                jupiter_trader.getSolBalance(),
                jupiter_trader.getTokenBalance(tokenAddress)
            ]);
    
            res.json({
                success: true,
                trade: {
                    action: action,
                    tokenAddress: tokenAddress,
                    amount: amount,
                    result: result
                },
                balances: {
                    sol: solBalance,
                    token: tokenBalance
                }
            });
    
        } catch (error) {
            console.error('Trade error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }


    return {
        fetch_meme_coins,
        get_trading_opportunities,
        get_balance,
        make_trades,
    }
}





