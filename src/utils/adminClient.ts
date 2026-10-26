/**
 * Client-side admin authentication and token management
 */

export function getAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('crawlpay_admin_auth') || '';
}

export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem('crawlpay_admin_auth', token);
    localStorage.removeItem('crawlpay_admin_auth');
  } catch {}
}

export function clearAdminToken(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('crawlpay_admin_auth');
    localStorage.removeItem('crawlpay_admin_auth');
  } catch {}
}
