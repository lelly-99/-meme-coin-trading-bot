import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import axios from 'axios';

class JupiterTrader {

    //wallet balance for now
    //check out faucet.solana.com - cureently doesn't have access to newly lauched tokens for transaction purposes
    static simulatedBalance = {
        sol: 5, 
        tokens: new Map(),
        tradeHistory: []
    };

    constructor(wallet) {
        this.connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
        this.JUPITER_API_URL = 'https://quote-api.jup.ag/v6';
        this.SOL_MINT = 'So11111111111111111111111111111111111111112';
        this.wallet = wallet;
    }

    async executeBuy(tokenAddress, amountInSol) {
        try {
            // check SOL balance
            if (amountInSol > JupiterTrader.simulatedBalance.sol) {
                throw new Error(`Insufficient SOL balance. Have: ${JupiterTrader.simulatedBalance.sol}, Need: ${amountInSol}`);
            }

            //get a real quote from Jupiter
            const response = await axios.get(`${this.JUPITER_API_URL}/quote`, {
                params: {
                    inputMint: this.SOL_MINT,
                    outputMint: tokenAddress,
                    amount: Math.floor(amountInSol * LAMPORTS_PER_SOL).toString(),
                    slippageBps: 100
                }
            });

            const quote = response.data;

            //make the trade
            JupiterTrader.simulatedBalance.sol -= amountInSol;
            const currentTokenBalance = JupiterTrader.simulatedBalance.tokens.get(tokenAddress) || 0;
            const newTokenBalance = currentTokenBalance + Number(quote.outAmount);
            JupiterTrader.simulatedBalance.tokens.set(tokenAddress, newTokenBalance);

            // Record trade in history
            const tradeRecord = {
                timestamp: new Date(),
                type: 'BUY',
                tokenAddress,
                inputAmount: amountInSol,
                inputToken: 'SOL',
                outputAmount: quote.outAmount,
                outputToken: tokenAddress,
                price: quote.priceUsd,
                priceImpact: quote.priceImpactPct
            };
            JupiterTrader.simulatedBalance.tradeHistory.push(tradeRecord);

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
                price: quote.priceUsd,
                priceImpact: quote.priceImpactPct,
                simulatedBalances: {
                    sol: JupiterTrader.simulatedBalance.sol,
                    token: newTokenBalance
                }
            };

        } catch (error) {
            console.error('Simulated buy failed:', error.message);
            throw error;
        }
    }

    async executeSell(tokenAddress, tokenAmount) {
        try {
            //check token balance
            const currentTokenBalance = JupiterTrader.simulatedBalance.tokens.get(tokenAddress) || 0;
            if (tokenAmount > currentTokenBalance) {
                throw new Error(`Insufficient token balance. Have: ${currentTokenBalance}, Need: ${tokenAmount}`);
            }

            //get quote from Jupiter
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

            //trade
            const newTokenBalance = currentTokenBalance - tokenAmount;
            JupiterTrader.simulatedBalance.tokens.set(tokenAddress, newTokenBalance);
            JupiterTrader.simulatedBalance.sol += solReceived;

            //record trade
            const tradeRecord = {
                timestamp: new Date(),
                type: 'SELL',
                tokenAddress,
                inputAmount: tokenAmount,
                inputToken: tokenAddress,
                outputAmount: solReceived,
                outputToken: 'SOL',
                price: quote.priceUsd,
                priceImpact: quote.priceImpactPct
            };
            JupiterTrader.simulatedBalance.tradeHistory.push(tradeRecord);

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
                price: quote.priceUsd,
                priceImpact: quote.priceImpactPct,
                simulatedBalances: {
                    sol: JupiterTrader.simulatedBalance.sol,
                    token: newTokenBalance
                }
            };

        } catch (error) {
            console.error('Simulated sell failed:', error.message);
        }
    }

    async getSolBalance() {
        return JupiterTrader.simulatedBalance.sol;
    }

    async getTokenBalance(tokenAddress) {
        return JupiterTrader.simulatedBalance.tokens.get(tokenAddress) || 0;
    }

    async getAllBalances() {
        const balances = {
            sol: JupiterTrader.simulatedBalance.sol,
            tokens: {}
        };

        for (const [token, amount] of JupiterTrader.simulatedBalance.tokens) {
            balances.tokens[token] = amount;
        }

        return balances;
    }

    async getTradeHistory() {
        return JupiterTrader.simulatedBalance.tradeHistory;
    }
}

export default JupiterTrader;