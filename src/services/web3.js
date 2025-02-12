import { Connection, PublicKey } from '@solana/web3.js';

class SolanaFetcher {
    constructor(rpcUrl = 'https://api.mainnet-beta.solana.com') {
        this.connection = new Connection(rpcUrl, 'confirmed');
    }

    async fetchTokenMetadata(tokenAddress) {
        try {
           
            const mintPublicKey = new PublicKey(tokenAddress);
            const accountInfo = await this.connection.getParsedAccountInfo(mintPublicKey);

            const parsedInfo = accountInfo.value.data.parsed.info;

            return {
                decimals: Number(parsedInfo.decimals || 0),
                totalSupply: Number(parsedInfo.supply) || 0,
                holders: 0,
                createdAt: new Date()
            };

        } catch (error) {
            console.error(`Error fetching on-chain data for ${tokenAddress}:`, error.message);
        }
    }
}

export default SolanaFetcher;