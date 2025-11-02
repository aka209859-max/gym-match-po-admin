// freee API OAuth2.0 Authentication Library
// GYM MATCH Manager - Accounting Software Integration

export interface FreeeConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string;
}

export interface FreeeTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
}

export interface FreeeCompany {
  id: number;
  name: string;
  name_kana: string;
  display_name: string;
  role: string;
}

/**
 * freee OAuth2.0 Authorization URL Generator
 * @param config - freee API configuration
 * @param state - CSRF protection state parameter
 * @returns Authorization URL
 */
export function generateFreeeAuthUrl(
  config: FreeeConfig,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    state: state,
    scope: config.scope || 'read write',
  });

  return `https://accounts.secure.freee.co.jp/public_api/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * @param config - freee API configuration
 * @param code - Authorization code from callback
 * @returns Token response
 */
export async function exchangeCodeForToken(
  config: FreeeConfig,
  code: string
): Promise<FreeeTokenResponse> {
  const response = await fetch('https://accounts.secure.freee.co.jp/public_api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`freee token exchange failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 * @param config - freee API configuration
 * @param refreshToken - Refresh token
 * @returns New token response
 */
export async function refreshAccessToken(
  config: FreeeConfig,
  refreshToken: string
): Promise<FreeeTokenResponse> {
  const response = await fetch('https://accounts.secure.freee.co.jp/public_api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`freee token refresh failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Get list of companies accessible with the access token
 * @param accessToken - Access token
 * @returns List of companies
 */
export async function getFreeeCompanies(
  accessToken: string
): Promise<FreeeCompany[]> {
  const response = await fetch('https://api.freee.co.jp/api/1/companies', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`freee companies fetch failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.companies || [];
}

/**
 * Revoke access token (disconnect)
 * @param config - freee API configuration
 * @param accessToken - Access token to revoke
 */
export async function revokeFreeeToken(
  config: FreeeConfig,
  accessToken: string
): Promise<void> {
  const response = await fetch('https://accounts.secure.freee.co.jp/public_api/revoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      token: accessToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`freee token revocation failed: ${JSON.stringify(error)}`);
  }
}

/**
 * Generate random state for CSRF protection
 * @returns Random state string
 */
export function generateState(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Store token securely (localStorage for demo, use secure backend in production)
 * @param tokens - Token response to store
 */
export function storeTokens(tokens: FreeeTokenResponse): void {
  if (typeof window === 'undefined') return;

  const expiresAt = Date.now() + tokens.expires_in * 1000;

  localStorage.setItem('freee_access_token', tokens.access_token);
  localStorage.setItem('freee_refresh_token', tokens.refresh_token);
  localStorage.setItem('freee_token_expires_at', expiresAt.toString());
  localStorage.setItem('freee_token_created_at', Date.now().toString());
}

/**
 * Get stored access token
 * @returns Access token or null
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('freee_access_token');
}

/**
 * Get stored refresh token
 * @returns Refresh token or null
 */
export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('freee_refresh_token');
}

/**
 * Check if access token is expired
 * @returns True if expired
 */
export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return true;

  const expiresAt = localStorage.getItem('freee_token_expires_at');
  if (!expiresAt) return true;

  return Date.now() >= parseInt(expiresAt);
}

/**
 * Clear stored tokens
 */
export function clearStoredTokens(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('freee_access_token');
  localStorage.removeItem('freee_refresh_token');
  localStorage.removeItem('freee_token_expires_at');
  localStorage.removeItem('freee_token_created_at');
  localStorage.removeItem('freee_company_id');
  localStorage.removeItem('freee_company_name');
}
