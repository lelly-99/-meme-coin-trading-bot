import Token from "../model/tokens.js";
import SolanaFetcher from "./web3.js";
import { analyze_trading_opportunity } from "./filters.js";

const solana_fetcher = new SolanaFetcher()

export default function database () {
    const process_and_store_token = async (token) => {
        try {
            if (!token || !token.tokenAddress) {
                console.log('Invalid token data');
                return null;
            }

            const on_chain_data = await solana_fetcher.fetchTokenMetadata(token.tokenAddress);
            
            if (!on_chain_data) {
                console.log(`No on-chain data for ${token.tokenAddress}`);
                return null;
            }

            const tokenData = new Token ({
                token_address: token.tokenAddress,
                chainId: token.chainId,
                name: token.name || '',
                symbol: token.symbol || '',
                description: token.description || '',
                icon: token.info?.imageUrl || '',
                header: token.info?.header || '',
                openGraph: token.info?.openGraph || '',
                market_data: {
                    dexId: token.dexId || '',
                    pairAddress: token.pairAddress || '',
                    priceUsd: parseFloat(token.priceUsd) || 0,
                    priceNative: parseFloat(token.priceNative) || 0,
                    liquidity: {
                        usd: parseFloat(token.liquidity?.usd) || 0,
                        base: parseFloat(token.liquidity?.base) || 0,
                        quote: parseFloat(token.liquidity?.quote) || 0
                    },
                    volume: {
                        h24: parseFloat(token.volume?.h24) || 0,
                        h6: parseFloat(token.volume?.h6) || 0,
                        h1: parseFloat(token.volume?.h1) || 0,
                        m5: parseFloat(token.volume?.m5) || 0
                    },
                    transactions: {
                        h24: {
                            buys: parseInt(token.txns?.h24?.buys) || 0,
                            sells: parseInt(token.txns?.h24?.sells) || 0
                        },
                        h6: {
                            buys: parseInt(token.txns?.h6?.buys) || 0,
                            sells: parseInt(token.txns?.h6?.sells) || 0
                        },
                        h1: {
                            buys: parseInt(token.txns?.h1?.buys) || 0,
                            sells: parseInt(token.txns?.h1?.sells) || 0
                        },
                        m5: {
                            buys: parseInt(token.txns?.m5?.buys) || 0,
                            sells: parseInt(token.txns?.m5?.sells) || 0
                        }
                    },
                    priceChange: {
                        h24: parseFloat(token.priceChange?.h24) || 0,
                        h6: parseFloat(token.priceChange?.h6) || 0,
                        h1: parseFloat(token.priceChange?.h1) || 0,
                        m5: parseFloat(token.priceChange?.m5) || 0
                    },
                    marketCap: parseFloat(token.marketCap) || 0,
                    fdv: parseFloat(token.fdv) || 0,
                    pairCreatedAt: token.pairCreatedAt ? new Date(token.pairCreatedAt) : new Date(),
                    updatedAt: new Date()
                },
                on_chain_data: {
                    decimals: on_chain_data.decimals || 0,
                    totalSupply: on_chain_data.totalSupply || 0,
                    holders: on_chain_data.holders || 0,
                    createdAt: new Date()
                }
            });

            const trading_analysis = analyze_trading_opportunity(tokenData);
            
            // Add analysis to token data
            tokenData.trading_analysis = trading_analysis;

            // Save to database
            const saved_token = await tokenData.save();

            return saved_token;

        } catch (error) {
            console.error(`Error storing data for token ${token?.tokenAddress}:`, error);
            return null;
        }
    }


const update_token_trades = async (tokenAddress, trade_info) => {
    try {
        const updated_token = await Token.findOneAndUpdate(
            { token_address: tokenAddress },
            { 
                $push: { 
                    trades: trade_info 
                },
                $set: {
                    last_trade: trade_info
                }
            },
            { new: true }
        );

        return updated_token;

    } catch (error) {
        console.error(`error updating trades for ${tokenAddress}:`, error);
        throw error;
    }
};

const get_token = async (tokenAddress) => {
    try {
        return await Token.findOne({ token_address: tokenAddress });
    } catch (error) {
        console.error(`Error fetching token ${tokenAddress}:`, error);
        return null;
    }
};

return {
    process_and_store_token,
    update_token_trades,
    get_token
};

}


