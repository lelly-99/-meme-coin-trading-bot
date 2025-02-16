import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import axios from 'axios';

class JupiterTrader {
    static simulatedBalance = {
        sol: 5,
        tokens: new Map(),
        tradeHistory: []
    };

    constructor() {
        this.connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
        this.JUPITER_API_URL = 'https://quote-api.jup.ag/v6';
        this.SOL_MINT = 'So11111111111111111111111111111111111111112';
    }

    async executeBuy(tokenAddress, amountInSol) {
        try {
            if (amountInSol > JupiterTrader.simulatedBalance.sol) {
                throw new Error(`Insufficient SOL balance. Have: ${JupiterTrader.simulatedBalance.sol}, Need: ${amountInSol}`);
            }
    
            const response = await axios.get(`${this.JUPITER_API_URL}/quote`, {
                params: {
                    inputMint: this.SOL_MINT,
                    outputMint: tokenAddress,
                    amount: Math.floor(amountInSol * LAMPORTS_PER_SOL).toString(),
                    slippageBps: 100
                }
            });
    
            const quote = response.data;
            
            // Calculate price in USD
            const price = quote.outAmount > 0 ? 
                (amountInSol * LAMPORTS_PER_SOL) / quote.outAmount : 
                0;
    
            console.log('Buy Quote:', {
                outAmount: quote.outAmount,
                price: price,
                priceImpact: quote.priceImpactPct
            });
    
            JupiterTrader.simulatedBalance.sol -= amountInSol;
            const currentTokenBalance = JupiterTrader.simulatedBalance.tokens.get(tokenAddress) || 0;
            const newTokenBalance = currentTokenBalance + Number(quote.outAmount);
            JupiterTrader.simulatedBalance.tokens.set(tokenAddress, newTokenBalance);
    
            const tradeRecord = {
                timestamp: new Date(),
                type: 'BUY',
                tokenAddress,
                inputAmount: amountInSol,
                inputToken: 'SOL',
                outputAmount: quote.outAmount,
                outputToken: tokenAddress,
                price: price,
                priceImpact: quote.priceImpactPct
            };
            JupiterTrader.simulatedBalance.tradeHistory.push(tradeRecord);
    
            console.log('Buy trade recorded:', tradeRecord);
    
            return {
                success: true,
                type: 'BUY',
                input: {
                    amount: amountInSol,
                    token: 'SOL'
                },
                output: {
                    amount: quote.outAmount,
                    token: tokenAddress
                },
                price: price,
                priceImpact: quote.priceImpactPct,
                simulatedBalances: {
                    sol: JupiterTrader.simulatedBalance.sol,
                    token: newTokenBalance
                }
            };
    
        } catch (error) {
            console.error('Buy execution failed:', error.message);
            throw error;
        }
    }
    
    async executeSell(tokenAddress, tokenAmount) {
        try {
            const currentTokenBalance = JupiterTrader.simulatedBalance.tokens.get(tokenAddress) || 0;
            if (tokenAmount > currentTokenBalance) {
                throw new Error(`Insufficient token balance. Have: ${currentTokenBalance}, Need: ${tokenAmount}`);
            }
    
            const response = await axios.get(`${this.JUPITER_API_URL}/quote`, {
                params: {
                    inputMint: tokenAddress,
                    outputMint: this.SOL_MINT,
                    amount: tokenAmount.toString(),
                    slippageBps: 100
                }
            });
    
            const quote = response.data;
            const solReceived = quote.outAmount / LAMPORTS_PER_SOL;
    
            // Calculate price in USD
            const price = tokenAmount > 0 ? 
                quote.outAmount / tokenAmount : 
                0;
    
            console.log('Sell Quote:', {
                outAmount: quote.outAmount,
                price: price,
                priceImpact: quote.priceImpactPct
            });
    
            const newTokenBalance = currentTokenBalance - tokenAmount;
            JupiterTrader.simulatedBalance.tokens.set(tokenAddress, newTokenBalance);
            JupiterTrader.simulatedBalance.sol += solReceived;
    
            const buyTrade = JupiterTrader.simulatedBalance.tradeHistory.find(
                trade => trade.tokenAddress === tokenAddress && trade.type === 'BUY'
            );
            const buyPrice = buyTrade ? parseFloat(buyTrade.price) : 0;
            const roi = buyPrice ? ((price - buyPrice) / buyPrice) * 100 : 0;
    
            const tradeRecord = {
                timestamp: new Date(),
                type: 'SELL',
                tokenAddress,
                inputAmount: tokenAmount,
                inputToken: tokenAddress,
                outputAmount: solReceived,
                outputToken: 'SOL',
                price: price,
                priceImpact: quote.priceImpactPct,
                roi: roi
            };
            JupiterTrader.simulatedBalance.tradeHistory.push(tradeRecord);
    
            console.log('Sell trade recorded:', tradeRecord);
    
            return {
                success: true,
                type: 'SELL',
                input: {
                    amount: tokenAmount,
                    token: tokenAddress
                },
                output: {
                    amount: solReceived,
                    token: 'SOL'
                },
                price: price,
                priceImpact: quote.priceImpactPct,
                roi: roi,
                simulatedBalances: {
                    sol: JupiterTrader.simulatedBalance.sol,
                    token: newTokenBalance
                }
            };
    
        } catch (error) {
            console.error('Sell execution failed:', error.message);
            throw error;
        }
    }
    async getTokenBalance(tokenAddress) {
        return JupiterTrader.simulatedBalance.tokens.get(tokenAddress) || 0;
    }

    async getSolBalance() {
        return JupiterTrader.simulatedBalance.sol;
    }

    async getAllBalances() {
        return {
            sol: JupiterTrader.simulatedBalance.sol,
            tokens: Object.fromEntries(JupiterTrader.simulatedBalance.tokens)
        };
    }

    async getTradeHistory() {
        return JupiterTrader.simulatedBalance.tradeHistory;
    }
}

export default JupiterTrader;