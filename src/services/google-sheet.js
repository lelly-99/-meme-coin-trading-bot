import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

class GoogleSheetsManager {
    constructor() {
        this.auth = new google.auth.GoogleAuth({
            keyFile: './google.json',
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        
        this.sheets = null;
        this.spreadsheetId = '1pL08biS5P_VqSeEqZs4QYMsv7IfF4PxWYR-Fa3Spjio';
        this.processedTokens = new Set();
        this.initializeSheets();
    }

    async initializeSheets() {
        try {
            const authClient = await this.auth.getClient();
            this.sheets = google.sheets({ version: 'v4', auth: authClient });
            console.log('Google Sheets initialized');
        } catch (error) {
            console.error('Error initializing sheets:', error);
        }
    }

    async initializeSheet() {
        try {
            if (!this.sheets) {
                await this.initializeSheets();
            }
    
            await this.sheets.spreadsheets.values.clear({
                spreadsheetId: this.spreadsheetId,
                range: 'trades!A:I' && 'analysis!A:B'
            });
    
            const headers = [
                [
                    'Timestamp',
                    'Token Address',
                    'Entry Age',
                    'Exit Time',
                    'Holding time(minutes)',
                    'Liquidity',
                    '24h Buys',
                    'Entry Price',
                    'Exit Price',
                    'ROI %'
                ]
            ];
    
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: 'trades!A1:J1',
                valueInputOption: 'USER_ENTERED',
                resource: { values: headers }
            });
    
            console.log('Sheet initialized with headers');
            return true;
        } catch (error) {
            console.error('Error initializing sheet:', error);
            return false;
        }
    }

    async updateAnalysis() {
        try {
            if (!this.sheets) {
                await this.initializeSheets();
            }

            // get all trade data from first sheet
            const tradesResponse = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'trades!A2:J' 
            });

            const trades = tradesResponse.data.values || [];

            // analysis
            const analysis = {
                totalTrades: trades.length,
                profitableTrades: 0,
                unprofitableTrades: 0,
                totalROI: 0,
                averageROI: 0,
                bestTrade: { roi: -Infinity, token: '' },
                worstTrade: { roi: Infinity, token: '' },
                averageHoldingTime: 0,
                totalVolume: 0
            };

            trades.forEach((trade, index) => {

                const roi = parseFloat(trade[9]) || 0; 
                const holdingTime = parseFloat(trade[4]) || 0;
                const initialLiquidity = parseFloat(trade[5]);

                //update metrics
                analysis.totalROI += roi;
                analysis.averageHoldingTime += holdingTime;
                analysis.totalVolume += initialLiquidity;

                //profit/loss
                if (roi >= 0) {
                    analysis.profitableTrades++;
                }else if (roi <= 0){
                    analysis.unprofitableTrades++;
                }

                //best or worst trade
                if (roi >= analysis.bestTrade.roi) {
                    analysis.bestTrade = { roi, token: trade[1] };
                }
                if (roi <= analysis.worstTrade.roi) {
                    analysis.worstTrade = { roi, token: trade[1] };
                }
            });

            // ccalculate averages
            if (trades.length > 0) {
                analysis.averageROI = analysis.totalROI / trades.length;
                analysis.averageHoldingTime = analysis.averageHoldingTime / trades.length;
            }

            // analyse data for second sheet
            const analysisData = [
            
                    ['Metric', 'Value'],
                    ['Total Trades', analysis.totalTrades],
                    ['Profitable Trades', analysis.profitableTrades],
                    ['Unprofitable Trades', analysis.unprofitableTrades],
                    ['Win Rate %', analysis.totalTrades > 0 ? ((analysis.profitableTrades / analysis.totalTrades) * 100).toFixed(2) : '0.00'],
                    ['Total ROI %', analysis.totalROI.toFixed(2)],
                    ['Average ROI %', analysis.averageROI.toFixed(2)],
                    ['Best Trade ROI %', analysis.bestTrade.roi.toFixed(2)],
                    ['Best Trade Token', analysis.bestTrade.token],
                    ['Worst Trade ROI %', analysis.worstTrade.roi.toFixed(2)],
                    ['Worst Trade Token', analysis.worstTrade.token],
                    ['Average Holding Time (minutes)', analysis.averageHoldingTime.toFixed(2)],
                    ['Total Trading Volume ($)', analysis.totalVolume.toFixed(2)],
                    ['Average Trade Size ($)', (analysis.totalVolume / analysis.totalTrades).toFixed(2)],
                    ['Last Updated', new Date().toString()]
            
            ];

            // Update analysis
            await this.sheets.spreadsheets.values.clear({
                spreadsheetId: this.spreadsheetId,
                range: 'analysis!A:B'
            });

            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: 'analysis!A1:B' + analysisData.length,
                valueInputOption: 'USER_ENTERED',
                resource: { values: analysisData }
            });


            console.log('Analysis updated in analysis');
            return analysis;

        } catch (error) {
            console.error('Error updating analysis:', error);
            return null;
        }
    }

    
    async logTrade(tradeData) {
        try {
            if (!this.sheets) {
                await this.initializeSheets();
            }

            console.log('Attempting to log trade data:', tradeData);

            // if token hasn't been processed and has complete data
            if (!this.processedTokens.has(tradeData.tokenAddress) && 
                tradeData.entryTime && tradeData.exitTime) {
                
                const tradeDuration = tradeData.exitTime - tradeData.entryTime;
                
                const row = [
                    new Date().toISOString(),                   
                    tradeData.tokenAddress,                     
                    tradeData.entryTime?.toFixed(2) || '',     
                    tradeData.exitTime?.toFixed(2) || '', 
                    tradeDuration.toFixed(2) || '',    
                    tradeData.initialLiquidity?.toFixed(2) || '',
                    tradeData.buys24h || '',                  
                    tradeData.entryPrice || '',              
                    tradeData.exitPrice || '',                
                    tradeData.roi?.toFixed(2) || ''          
                ];

                console.log('Prepared row data:', row);

                const response = await this.sheets.spreadsheets.values.append({
                    spreadsheetId: this.spreadsheetId,
                    range: 'trades!A:I',
                    valueInputOption: 'USER_ENTERED',
                    insertDataOption: 'INSERT_ROWS',
                    resource: { values: [row] }
                });

                this.processedTokens.add(tradeData.tokenAddress);
                console.log(`Trade logged successfully for ${tradeData.tokenAddress}`);
                console.log('Google Sheets response:', response.data);
            } else {
                console.log(`Skipping log for ${tradeData.tokenAddress} - ` + 
                    (this.processedTokens.has(tradeData.tokenAddress) ? 
                        'already processed' : 'incomplete data'));
            }
            await this.updateAnalysis();
            
            return true;
        } catch (error) {
            console.error('Error logging trade:', error);
            console.error('Trade data that failed:', tradeData);
            return false;
        }
    }
}

export default GoogleSheetsManager;