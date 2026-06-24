import 'dotenv/config';
import { getHistory } from './services/market.js';

async function test() {
  console.log('Checking environment key:', process.env.FINNHUB_API_KEY ? 'Present' : 'Absent');
  
  console.log('Fetching live candle history for NVDA...');
  const nvdaHistory = await getHistory('NVDA');
  console.log('NVDA points count:', nvdaHistory ? nvdaHistory.length : 'NULL');
  if (nvdaHistory && nvdaHistory.length > 0) {
    console.log('NVDA first point:', nvdaHistory[0]);
    console.log('NVDA last point:', nvdaHistory[nvdaHistory.length - 1]);
  }
  
  console.log('\nFetching live crypto candle history for BTC...');
  const btcHistory = await getHistory('BTC');
  console.log('BTC points count:', btcHistory ? btcHistory.length : 'NULL');
  if (btcHistory && btcHistory.length > 0) {
    console.log('BTC first point:', btcHistory[0]);
    console.log('BTC last point:', btcHistory[btcHistory.length - 1]);
  }
  
  process.exit(0);
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
