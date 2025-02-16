import express from 'express'
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv'
import routes from './src/routes/routes.js';
import AutoTrader from './src/auto-trader.js';


// Initialize app instance
const app = express()

// Middleware configurations
dotenv.config();
app.use(bodyParser.json())

// Service instance
const routes_instance = routes()


// Server setup
const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
})

// Database connection
const connectionString = process.env.MONGO_URL
mongoose.connect(connectionString, {
    ssl: true                 
})
    .then(() => console.log('Database Connected'))
    .catch((err) => console.error('Database connection error:', err));


    
// Endpoints
app.get('/fetch-meme-coins', routes_instance.fetch_meme_coins);

app.get('/trading-opportunities', routes_instance.get_trading_opportunities);

app.post('/trade/:tokenAddress', routes_instance.make_trades);

app.get('/balances', routes_instance.get_balance);


//auto
const startTrading = async () => {
    try {
        console.log('Starting trading bot...');
        const trader = new AutoTrader();
        await trader.start();

        // Handle shutdown gracefully
        process.on('SIGINT', async () => {
            console.log('Shutting down...');
            await trader.stop();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('Shutting down...');
            await trader.stop();
            process.exit(0);
        });

        //uncaught errors
        process.on('uncaughtException', async (error) => {
            console.error('Uncaught Exception:', error);
            await trader.stop();
            process.exit(1);
        });

        process.on('unhandledRejection', async (error) => {
            console.error('Unhandled Rejection:', error);
            await trader.stop();
            process.exit(1);
        });

        //keep the process running
        process.stdin.resume();

    } catch (error) {
        console.error('Error starting trading bot:', error);
        process.exit(1);
    }
};

startTrading();
