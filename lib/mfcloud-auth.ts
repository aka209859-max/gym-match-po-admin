// MFクラウド API OAuth2.0 Authentication Library
// GYM MATCH Manager - Accounting Software Integration (MFクラウド Edition)
// Phase 6-1: MFクラウド完全統合

export interface MFCloudConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string;
}

export interface MFCloudTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
}

export interface MFCloudOffice {
  id: string;
  name: string;
  role: string;
  type: string; // 'personal' | 'corporation'
}

/**
 * MFクラウド OAuth2.0 Authorization URL Generator
 * @param config - MFクラウド API configuration
 * @param state - CSRF protection state parameter
 * @returns Authorization URL
 */
export function generateMFCloudAuthUrl(
  config: MFCloudConfig,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    state: state,
    scope: config.scope || 'office read write',
  });

  return `https://invoice.moneyforward.com/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * @param config - MFクラウド API configuration
 * @param code - Authorization code from callback
 * @returns Token response
 */
export async function exchangeCodeForToken(
  config: MFCloudConfig,
  code: string
): Promise<MFCloudTokenResponse> {
  const response = await fetch('https://invoice.moneyforward.com/oauth/token', {
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
    throw new Error(`MFクラウド token exchange failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 * @param config - MFクラウド API configuration
 * @param refreshToken - Refresh token
 * @returns New token response
 */
export async function refreshAccessToken(
  config: MFCloudConfig,
  refreshToken: string
): Promise<MFCloudTokenResponse> {
  const response = await fetch('https://invoice.moneyforward.com/oauth/token', {
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
    throw new Error(`MFクラウド token refresh failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Get list of offices accessible with the access token
 * @param accessToken - Access token
 * @returns List of offices
 */
export async function getMFCloudOffices(
  accessToken: string
): Promise<MFCloudOffice[]> {
  const response = await fetch('https://invoice.moneyforward.com/api/v1/office', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`MFクラウド offices fetch failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.offices || [];
}

/**
 * Revoke access token (disconnect)
 * @param config - MFクラウド API configuration
 * @param accessToken - Access token to revoke
 */
export async function revokeMFCloudToken(
  config: MFCloudConfig,
  accessToken: string
): Promise<void> {
  const response = await fetch('https://invoice.moneyforward.com/oauth/revoke', {
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
    throw new Error(`MFクラウド token revocation failed: ${JSON.stringify(error)}`);
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
export function storeTokens(tokens: MFCloudTokenResponse): void {
  if (typeof window === 'undefined') return;

  const expiresAt = Date.now() + tokens.expires_in * 1000;

  localStorage.setItem('mfcloud_access_token', tokens.access_token);
  localStorage.setItem('mfcloud_refresh_token', tokens.refresh_token);
  localStorage.setItem('mfcloud_token_expires_at', expiresAt.toString());
  localStorage.setItem('mfcloud_token_created_at', Date.now().toString());
}

/**
 * Get stored access token
 * @returns Access token or null
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mfcloud_access_token');
}

/**
 * Get stored refresh token
 * @returns Refresh token or null
 */
export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mfcloud_refresh_token');
}

/**
 * Check if access token is expired
 * @returns True if expired
 */
export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return true;

  const expiresAt = localStorage.getItem('mfcloud_token_expires_at');
  if (!expiresAt) return true;

  return Date.now() >= parseInt(expiresAt);
}

/**
 * Clear stored tokens
 */
export function clearStoredTokens(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('mfcloud_access_token');
  localStorage.removeItem('mfcloud_refresh_token');
  localStorage.removeItem('mfcloud_token_expires_at');
  localStorage.removeItem('mfcloud_token_created_at');
  localStorage.removeItem('mfcloud_office_id');
  localStorage.removeItem('mfcloud_office_name');
}

/**
 * Store office information
 * @param officeId - Office ID
 * @param officeName - Office name
 */
export function storeOfficeInfo(officeId: string, officeName: string): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('mfcloud_office_id', officeId);
  localStorage.setItem('mfcloud_office_name', officeName);
}

/**
 * Get stored office ID
 * @returns Office ID or null
 */
export function getStoredOfficeId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mfcloud_office_id');
}

/**
 * Get stored office name
 * @returns Office name or null
 */
export function getStoredOfficeName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mfcloud_office_name');
}
