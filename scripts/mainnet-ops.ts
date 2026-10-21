import dotenv from 'dotenv';
dotenv.config();

import { identityService } from '../src/services/identityService';
import { CONFIG } from '../src/config';

async function main() {
  const command = process.argv[2] || 'status';

  console.log('====================================================');
  console.log('       CRAWLPAY CELO MAINNET OPERATIONS TOOL        ');
  console.log('====================================================');
  console.log(`Agent Wallet:      ${CONFIG.AGENT_WALLET_ADDRESS}`);
  console.log(`Attribution Tag:   ${CONFIG.ATTRIBUTION_TAG}`);
  console.log(`Data Suffix:       ${CONFIG.DATA_SUFFIX}`);
  console.log(`Registry:          ${CONFIG.ERC8004_REGISTRY}`);
  console.log(`RPC URL:           ${CONFIG.CELO_RPC_URL}`);
  console.log('----------------------------------------------------');

  if (command === 'status') {
    console.log('Fetching onchain telemetry from Celo Mainnet...');
    const status = await identityService.getStatus();
    console.log(`Celo Block:        #${status.blockNumber}`);
    console.log(`Gas Price:         ${status.gasPriceGwei} Gwei`);
    console.log(`CELO Balance:      ${status.celoBalance} CELO`);
    console.log(`USD₮ Balance:      ${status.usdtBalance} USD₮`);
    console.log(`cUSD Balance:      ${status.cusdBalance} cUSD`);
    console.log(`ERC-8004 Status:   ${status.isRegistered ? `Registered (Agent ID: ${status.agentId || 'Verified'})` : 'NOT Registered'}`);
    console.log(`Sufficient Gas:    ${status.hasSufficientGas ? 'YES (Ready to send mainnet tx)' : 'NO (Requires ~0.05 CELO for gas)'}`);
  } else if (command === 'register') {
    const uri = process.argv[3] || 'https://crawlpay.org/api/agent-registration';
    console.log(`Attempting ERC-8004 registration with URI: ${uri}`);
    const res = await identityService.registerIdentity(uri);
    if (res.success) {
      console.log('✓ Successfully registered ERC-8004 Identity!');
      console.log(`Transaction Hash:   ${res.txHash}`);
      console.log(`Agent ID:           #${res.agentId || 'Minted'}`);
      console.log(`Celoscan:           ${res.celoscanUrl}`);
      console.log(`Attribution Tag:    ${res.attributionVerified ? 'VERIFIED' : 'PENDING'}`);
    } else {
      console.error('✗ Registration failed:', res.error);
    }
  } else if (command === 'ping') {
    console.log('Broadcasting attributed transaction on Celo Mainnet (for Loops checklist)...');
    const res = await identityService.sendAttributedPing();
    if (res.success) {
      console.log('✓ Transaction broadcast and mined!');
      console.log(`Transaction Hash:   ${res.txHash}`);
      console.log(`Celoscan:           ${res.celoscanUrl}`);
      console.log(`Attribution Tag:    ${res.attributionVerified ? 'VERIFIED' : 'PENDING'}`);
      console.log(`Block Number:       ${res.blockNumber}`);
    } else {
      console.error('✗ Broadcast failed:', res.error);
    }
  } else if (command === 'verify') {
    const hash = process.argv[3];
    if (!hash) {
      console.error('Usage: npm run ops verify <0x_tx_hash>');
      process.exit(1);
    }
    console.log(`Verifying transaction ${hash} on Celo Mainnet...`);
    const res = await identityService.verifyPaymentTx(hash);
    console.log('Verification Result:', JSON.stringify(res, null, 2));
  } else {
    console.log(`Unknown command: ${command}`);
    console.log('Available commands: status, register, ping, verify <txHash>');
  }
}

main().catch((err) => {
  console.error('Operation failed:', err);
  process.exit(1);
});
