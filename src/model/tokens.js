import mongoose from 'mongoose';

const token_schema = new mongoose.Schema({
    token_address: { type: String, unique: true, required: true },
    chainId: String,
    name: String,
    symbol: String,
    description: String,
    icon: String,
    header: String,
    openGraph: String,
    market_data: {
        dexId: String,                    
        pairAddress: String,              
        priceUsd: Number,                 
        priceNative: Number,              
        liquidity: {
            usd: Number,                  
            base: Number,                 
            quote: Number                 
        },
        volume: {
            h24: Number,                  
            h6: Number,                   
            h1: Number,                   
            m5: Number                    
        },
        transactions: {
            h24: {
                buys: Number,            
                sells: Number            
            },
            h6: {
                buys: Number,
                sells: Number
            },
            h1: {
                buys: Number,
                sells: Number
            },
            m5: {
                buys: Number,
                sells: Number
            }
        },
        priceChange: {
            h24: Number,                  
            h6: Number,                   
            h1: Number,                   
            m5: Number                    
        },
        marketCap: Number,                
        fdv: Number,                      
        pairCreatedAt: Date,             
        updatedAt: { type: Date, default: Date.now }
    },
    on_chain_data: {
        decimals: Number,
        totalSupply: Number,
        holders: Number,
        createdAt: { type: Date, default: Date.now }
    },
    trading_analysis: {
        isGoodTrade: Boolean,
        score: Number,
        metrics: {
            hasEnoughLiquidity: Boolean,
            hasGoodVolume: Boolean,
            isEarlyOpportunity: Boolean,
            buyPressure: Number,
            priceMovement24h: Number,
            hasEnoughHolders: Boolean
        },
        timestamp: { type: Date, default: Date.now }
    },
    trades: [{
        type: { type: String, enum: ['BUY', 'SELL'] },
        input: {
            mint: String,
            amount: String,
            amountUsd: String
        },
        output: {
            mint: String,
            amount: String,
            minimumAmount: String
        },
        priceImpact: String,
        slippage: Number,
        timestamp: Date,
        status: {
            type: String,
            enum: ['QUOTED', 'EXECUTING', 'COMPLETED', 'FAILED']
        }
    }],
    last_trade: {
        type: { type: String, enum: ['BUY', 'SELL'] },
        input: {
            mint: String,
            amount: String,
            amountUsd: String
        },
        output: {
            mint: String,
            amount: String,
            minimumAmount: String
        },
        priceImpact: String,
        slippage: Number,
        timestamp: Date,
        status: String
    }
}, {
    strict: true
});

const Token = mongoose.model('tokens', token_schema);

export default Token;

