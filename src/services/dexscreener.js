import database from "./database.js";

const database_instance = database()

export default function dexscreener () {
    const fetch_latest_tokens = async () => {
        try {  
            const response = await fetch('https://api.dexscreener.com/token-profiles/latest/v1', {
                method: 'GET',
                headers: {},
            });
            const data = await response.json();
        
            const meme_coin_keywords = ['meme', 'pepe', 'trump', 'dog', 'shiba', 'doge', 'moon', 'rocket', 'lfg', 'jeet', 'woof', 'based'];
            
            //filter solana meme coins
            const solana_meme_coins = data.filter(coin => 
                coin?.chainId === 'solana' &&
                coin?.description &&
                meme_coin_keywords.some(keyword => 
                    coin.description.toLowerCase().includes(keyword)
                )
            );
        
            // Get market data for each token
            const processed_tokens = [];
            
            for (const meme_coin of solana_meme_coins) {
                if (!meme_coin.tokenAddress) continue;

                try {
                    const market_response = await fetch(
                        `https://api.dexscreener.com/latest/dex/tokens/${meme_coin.tokenAddress}`
                    );
                    const market_data = await market_response.json();

                    // Validate market data
                    if (!market_data?.pairs?.[0]) {
                        console.log(`No market data for ${meme_coin.tokenAddress}`);
                        continue;
                    }

                    const pair_data = market_data.pairs[0];

                    // Create combined data object
                    const token_data = {
                        tokenAddress: meme_coin.tokenAddress,
                        chainId: meme_coin.chainId,
                        name: pair_data.baseToken?.name || meme_coin.name,
                        symbol: pair_data.baseToken?.symbol,
                        description: meme_coin.description,
                        dexId: pair_data.dexId,
                        pairAddress: pair_data.pairAddress,
                        priceUsd: pair_data.priceUsd,
                        priceNative: pair_data.priceNative,
                        liquidity: pair_data.liquidity,
                        volume: pair_data.volume,
                        txns: pair_data.txns,
                        priceChange: pair_data.priceChange,
                        marketCap: pair_data.marketCap,
                        fdv: pair_data.fdv,
                        pairCreatedAt: pair_data.pairCreatedAt,
                        info: pair_data.info
                    };

                    // Process and store token
                    const processed_token = await database_instance.process_and_store_token(token_data);
                    if (processed_token) {
                        processed_tokens.push(processed_token);
                    }
                } catch (error) {
                    console.error(`Error processing token ${meme_coin.tokenAddress}:`, error);
                }
            }
            
            return processed_tokens;
        
        } catch (error) {
            console.error('Error scanning meme coins:', error.message);
        }   
    }

    return {
        fetch_latest_tokens,
    }
}
