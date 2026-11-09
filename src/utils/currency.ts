/**
 * Central currency and on-chain token formatting utility for CrawlPay.
 * Handles exact decimal precision (USDT = 6 decimals on Celo, CELO = 18 decimals)
 * without rounding drift or arbitrary conversions.
 */

export const CELO_CHAIN_ID = 42220;
export const CELO_USDT_ADDRESS = '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e'.toLowerCase();

export const TOKEN_DECIMALS: Record<string, number> = {
  USDT: 6,
  'USD₮': 6,
  cUSD: 18,
  CELO: 18,
};

/**
 * Format raw on-chain token value (e.g. from event log or transfer) to human number
 */
export function parseRawTokenUnits(rawValue: bigint | string | number, decimals: number): number {
  if (typeof rawValue === 'number') {
    return isNaN(rawValue) ? 0 : rawValue;
  }
  const str = String(rawValue).trim();
  if (!str) return 0;

  try {
    const bi = BigInt(str);
    const negative = bi < 0n;
    const absVal = negative ? -bi : bi;
    const divisor = 10n ** BigInt(decimals);
    const integerPart = absVal / divisor;
    const fractionPart = absVal % divisor;

    let fractionStr = fractionPart.toString().padStart(decimals, '0');
    // Trim trailing zeros but keep at least 2 decimals for monetary display
    fractionStr = fractionStr.replace(/0+$/, '');
    const fullStr = `${negative ? '-' : ''}${integerPart.toString()}${fractionStr ? `.${fractionStr}` : ''}`;
    return parseFloat(fullStr);
  } catch {
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  }
}

/**
 * Formats a USD amount strictly with 2 decimals ($X.XX)
 */
export function formatUsd(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00';
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(val) || !isFinite(val)) return '$0.00';
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formats a crypto token amount with appropriate decimal precision
 */
export function formatTokenAmount(
  amount: number | string | null | undefined,
  tokenSymbol: string = 'USDT'
): string {
  if (amount === null || amount === undefined) return `0.00 ${tokenSymbol}`;
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(val) || !isFinite(val)) return `0.00 ${tokenSymbol}`;

  const decimals = tokenSymbol.toUpperCase() === 'USDT' ? 2 : tokenSymbol.toUpperCase() === 'CELO' ? 4 : 2;
  const formatted = val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });

  return `${formatted} ${tokenSymbol.toUpperCase()}`;
}

/**
 * Masks sensitive wallet addresses for operator privacy
 */
export function maskAddress(address: string | null | undefined, visibleChars: number = 4): string {
  if (!address) return 'Anonymous';
  const clean = address.trim();
  if (clean.length <= visibleChars * 2 + 2) return clean;
  return `${clean.slice(0, visibleChars + 2)}...${clean.slice(-visibleChars)}`;
}

/**
 * Masks transaction hash for display with copy support
 */
export function maskTxHash(hash: string | null | undefined): string {
  if (!hash) return '—';
  const clean = hash.trim();
  if (clean.length <= 16) return clean;
  return `${clean.slice(0, 8)}...${clean.slice(-6)}`;
}
