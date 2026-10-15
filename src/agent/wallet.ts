import { createPublicClient, createWalletClient, http, defineChain, WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { withAttribution } from '@celo/attribution-tags';
import { CONFIG } from '../config';

// Celo Mainnet Definition
export const celoMainnet = defineChain({
  id: CONFIG.CELO_CHAIN_ID,
  name: 'Celo',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: { http: [CONFIG.CELO_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Celoscan', url: 'https://celoscan.io' },
  },
});

// Create Public Client for read-only queries and verification
export const publicClient = createPublicClient({
  chain: celoMainnet,
  transport: http(CONFIG.CELO_RPC_URL),
});

/**
 * Creates an attributed wallet client on Celo mainnet.
 * All sendTransaction and writeContract calls carry celo_757c2ac3b70c.
 */
export function createAttributedAgentWallet(privateKey?: `0x${string}`) {
  // If no private key is provided, generate a fallback deterministic signing key or read from env
  const key = privateKey || (process.env.AGENT_PRIVATE_KEY as `0x${string}`) || '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const account = privateKeyToAccount(key);

  return createWalletClient({
    account,
    chain: celoMainnet,
    transport: http(CONFIG.CELO_RPC_URL),
  }).extend(withAttribution(CONFIG.ATTRIBUTION_TAG));
}

export interface AgentStatus {
  walletAddress: string;
  attributionTag: string;
  dataSuffix: string;
  chainId: number;
  network: string;
  registryAddress: string;
}

export function getAgentStatus(): AgentStatus {
  return {
    walletAddress: CONFIG.AGENT_WALLET_ADDRESS,
    attributionTag: CONFIG.ATTRIBUTION_TAG,
    dataSuffix: CONFIG.DATA_SUFFIX,
    chainId: CONFIG.CELO_CHAIN_ID,
    network: 'Celo Mainnet',
    registryAddress: CONFIG.ERC8004_REGISTRY,
  };
}
