// freee OAuth2.0 Callback Handler
// Next.js 15 App Router API Route

import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForToken,
  storeTokens,
  getFreeeCompanies,
  FreeeConfig,
} from '@/lib/freee-auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('freee OAuth error:', error);
      return NextResponse.redirect(
        new URL(
          `/settings/accounting?error=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          '/settings/accounting?error=missing_parameters',
          request.url
        )
      );
    }

    // Verify state (CSRF protection)
    // In production, verify against stored state in session/database
    // For now, we'll skip strict verification in demo mode

    // Prepare freee config
    const config: FreeeConfig = {
      clientId: process.env.FREEE_CLIENT_ID || '',
      clientSecret: process.env.FREEE_CLIENT_SECRET || '',
      redirectUri: `${new URL(request.url).origin}/api/auth/freee/callback`,
    };

    // Check if credentials are configured
    if (!config.clientId || !config.clientSecret) {
      console.error('freee credentials not configured');
      return NextResponse.redirect(
        new URL(
          '/settings/accounting?error=credentials_not_configured',
          request.url
        )
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForToken(config, code);

    // Get company information
    const companies = await getFreeeCompanies(tokens.access_token);

    if (companies.length === 0) {
      return NextResponse.redirect(
        new URL('/settings/accounting?error=no_companies', request.url)
      );
    }

    // Store tokens (in production, use secure backend storage)
    // For demo, we'll use a redirect with query params to trigger client-side storage

    const successUrl = new URL('/settings/accounting', request.url);
    successUrl.searchParams.set('success', 'true');
    successUrl.searchParams.set('access_token', tokens.access_token);
    successUrl.searchParams.set('refresh_token', tokens.refresh_token);
    successUrl.searchParams.set('expires_in', tokens.expires_in.toString());
    successUrl.searchParams.set('company_id', companies[0].id.toString());
    successUrl.searchParams.set('company_name', companies[0].display_name);

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('freee callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/settings/accounting?error=callback_failed&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`,
        request.url
      )
    );
  }
}
