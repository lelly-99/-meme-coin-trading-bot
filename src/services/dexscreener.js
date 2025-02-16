import axios from 'axios';

export default function dexscreener() {
    // Configuration
    const MAX_RETRIES = 3;
    const BASE_DELAY = 2000;
    const TIMEOUT = 10000;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    async function fetchWithRetry(url, retryCount = 0) {
        try {
            const response = await axios.get(url, {
                timeout: TIMEOUT,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0' 
                }
            });
            return response.data;
        } catch (error) {
            if (retryCount < MAX_RETRIES) {
                const delay = BASE_DELAY * Math.pow(2, retryCount);
                console.log(`Attempt ${retryCount + 1} failed. Retrying in ${delay/1000} seconds...`);
                await sleep(delay);
                return fetchWithRetry(url, retryCount + 1);
            }
            throw error;
        }
    }

    const fetch_latest_tokens = async () => {
        try {
            console.log('Scanning for new tokens...');
            
            const data = await fetchWithRetry('https://api.dexscreener.com/token-profiles/latest/v1');
            
            const meme_coin_keywords = ['meme', 'pepe', 'trump', 'dog', 'shiba', 'doge', 'moon', 'rocket', 'lfg', 'jeet', 'woof', 'based'];
            
            const solana_meme_coins = data.filter(coin => 
                coin?.chainId === 'solana' &&
                coin?.description &&
                meme_coin_keywords.some(keyword => 
                    coin.description.toLowerCase().includes(keyword)
                )
            );

            console.log(`Found ${solana_meme_coins.length} potential meme coins`);
            
            const processed_tokens = [];
            
            for (const meme_coin of solana_meme_coins) {
                if (!meme_coin.tokenAddress) continue;

                try {
                    // Add delay between requests to avoid rate limits
                    await sleep(1000);

                    console.log(`Analyzing token: ${meme_coin.tokenAddress}`);
                    
                    const market_data = await fetchWithRetry(
                        `https://api.dexscreener.com/latest/dex/tokens/${meme_coin.tokenAddress}`
                    );

                    if (!market_data?.pairs?.[0]) {
                        console.log(`No market data for ${meme_coin.tokenAddress}`);
                        continue;
                    }

                    const pair_data = market_data.pairs[0];


                    processed_tokens.push({
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
                    });

                } catch (error) {
                    console.error(`Error processing token ${meme_coin.tokenAddress}:`, error.message);
                }
            }
            
            console.log(`Successfully processed ${processed_tokens.length} tokens`);
            return processed_tokens;
            
        } catch (error) {
            console.error('Error scanning meme coins:', error.message);
            return [];
        }
    };

    return {
        fetch_latest_tokens,
    };
}