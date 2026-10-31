import dotenv from 'dotenv';
dotenv.config();

function validateAndFormatPrivateKey(rawKey?: string): `0x${string}` | undefined {
  if (!rawKey) return undefined;
  const trimmed = rawKey.trim();
  const hex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;

  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      `[Config Error] Invalid AGENT_PRIVATE_KEY format: Expected a 64-character hexadecimal string (32 bytes), optionally prefixed with '0x'. Received length: ${trimmed.length}.`
    );
  }

  return `0x${hex.toLowerCase()}` as `0x${string}`;
}

export const CONFIG = {
  PORT: process.env.PORT || 3000,
  CELO_CHAIN_ID: 42220,
  CELO_RPC_URL: process.env.CELO_RPC_URL || 'https://forno.celo.org',
  ATTRIBUTION_TAG: 'celo_757c2ac3b70c',
  DATA_SUFFIX: '0x63656c6f5f373537633261633362373063110080218021802180218021802180218021',
  AGENT_WALLET_ADDRESS: process.env.AGENT_WALLET_ADDRESS || '0xf06c2b754d07cba299751f0985a48f8013bb6b39',
  AGENT_PRIVATE_KEY: validateAndFormatPrivateKey(process.env.AGENT_PRIVATE_KEY),
  ERC8004_REGISTRY: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
  USEBUY_GATEWAY: 'https://gateway.usebuy.ai',
  X402_FACILITATOR: 'https://x402.celo.org',
  DEFAULT_AUDIT_PRICE_USD: '0.25',
  CELO_PRICE_QUICK: process.env.CELO_PRICE_QUICK || '3.3',
  CELO_PRICE_FULL: process.env.CELO_PRICE_FULL || '6.6',
  UPSTREAM_BROWSER_PRICE_USD: '0.045',
  UPSTREAM_SOCIAL_PRICE_USD: '0.020',
  // Hard Crawl & Spend Caps
  MAX_CRAWL_SIZE_BYTES: 2 * 1024 * 1024, // 2MB hard limit on crawled HTML
  CRAWL_TIMEOUT_MS: 7000, // 7 seconds request timeout
  MAX_GAS_PRICE_GWEI: 10, // Max gas price allowed for broadcasting
};
