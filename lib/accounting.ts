// Accounting Integration Library
// Phase 3-3: Automatic Journaling with Error Handling & Retry Logic

import { getStoredAccessToken, isTokenExpired, refreshAccessToken, getStoredRefreshToken } from './freee-auth';
import {
  createJournalEntry,
  createSessionRevenueJournal,
  validateSessionData,
  previewSessionRevenueJournal,
  type JournalEntryRequest
} from './freee-journal';

// ============================================
// Types & Interfaces
// ============================================

export interface SessionData {
  id: string;
  memberName: string;
  sessionType: string;
  amount: number;
  date: Date;
  gymId: string;
}

export interface JournalResult {
  success: boolean;
  sessionId: string;
  data?: any;
  error?: string;
  retryCount?: number;
}

export interface BatchJournalResult {
  totalSessions: number;
  successCount: number;
  failureCount: number;
  results: JournalResult[];
  duration: number; // milliseconds
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // milliseconds
  exponentialBackoff: boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
};

// ============================================
// Token Management with Auto-Refresh
// ============================================

/**
 * Get valid access token with automatic refresh
 * @returns Valid access token or null
 */
export async function getValidAccessToken(): Promise<string | null> {
  try {
    let accessToken = getStoredAccessToken();

    // Check if token is expired
    if (isTokenExpired()) {
      console.log('🔄 Access token expired, attempting refresh...');
      
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        console.error('❌ No refresh token available');
        return null;
      }

      // Refresh the token
      const refreshResult = await refreshAccessToken(refreshToken);
      if (refreshResult.success) {
        console.log('✅ Access token refreshed successfully');
        accessToken = refreshResult.access_token || null;
      } else {
        console.error('❌ Failed to refresh access token:', refreshResult.error);
        return null;
      }
    }

    return accessToken;
  } catch (error) {
    console.error('❌ Error getting valid access token:', error);
    return null;
  }
}

// ============================================
// Retry Logic with Exponential Backoff
// ============================================

/**
 * Calculate retry delay with exponential backoff
 * @param retryCount - Current retry attempt number
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
function calculateRetryDelay(retryCount: number, config: RetryConfig): number {
  if (!config.exponentialBackoff) {
    return config.retryDelay;
  }

  // Exponential backoff: delay * (2 ^ retryCount)
  return config.retryDelay * Math.pow(2, retryCount);
}

/**
 * Sleep utility for retry delays
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute function with retry logic
 * @param fn - Function to execute
 * @param config - Retry configuration
 * @returns Function result or throws error
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{ result: T; retryCount: number }> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await fn();
      return { result, retryCount: attempt };
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < config.maxRetries) {
        const delay = calculateRetryDelay(attempt, config);
        console.log(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// ============================================
// Session Journal Creation with Retry
// ============================================

/**
 * Create journal entry for a single session with retry logic
 * @param session - Session data
 * @param config - Retry configuration
 * @returns Journal result
 */
export async function createSessionJournalWithRetry(
  session: SessionData,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<JournalResult> {
  try {
    // Validate session data
    const validation = validateSessionData({
      memberName: session.memberName,
      sessionType: session.sessionType,
      amount: session.amount,
      date: session.date,
    });

    if (!validation.valid) {
      return {
        success: false,
        sessionId: session.id,
        error: `Validation failed: ${validation.errors.join(', ')}`,
      };
    }

    // Ensure valid access token
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return {
        success: false,
        sessionId: session.id,
        error: 'Failed to obtain valid access token',
      };
    }

    // Execute journal creation with retry
    const { result, retryCount } = await executeWithRetry(
      () => createSessionRevenueJournal({
        memberName: session.memberName,
        sessionType: session.sessionType,
        amount: session.amount,
        date: session.date,
      }),
      config
    );

    return {
      success: true,
      sessionId: session.id,
      data: result,
      retryCount,
    };
  } catch (error: any) {
    return {
      success: false,
      sessionId: session.id,
      error: error.message || 'Unknown error occurred',
      retryCount: config.maxRetries,
    };
  }
}

// ============================================
// Batch Journal Creation
// ============================================

/**
 * Create journal entries for multiple sessions
 * @param sessions - Array of session data
 * @param config - Retry configuration
 * @param onProgress - Progress callback
 * @returns Batch result with detailed statistics
 */
export async function createBatchSessionJournals(
  sessions: SessionData[],
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onProgress?: (current: number, total: number) => void
): Promise<BatchJournalResult> {
  const startTime = Date.now();
  const results: JournalResult[] = [];

  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    
    // Report progress
    if (onProgress) {
      onProgress(i + 1, sessions.length);
    }

    // Create journal entry with retry
    const result = await createSessionJournalWithRetry(session, config);
    results.push(result);

    // Small delay between requests to avoid rate limiting
    if (i < sessions.length - 1) {
      await sleep(500);
    }
  }

  const endTime = Date.now();
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  return {
    totalSessions: sessions.length,
    successCount,
    failureCount,
    results,
    duration: endTime - startTime,
  };
}

// ============================================
// Journal Preview
// ============================================

/**
 * Preview journal entries without creating them
 * @param sessions - Array of session data
 * @returns Array of journal previews
 */
export function previewBatchSessionJournals(
  sessions: SessionData[]
): Array<{
  sessionId: string;
  preview: ReturnType<typeof previewSessionRevenueJournal>;
}> {
  return sessions.map((session) => ({
    sessionId: session.id,
    preview: previewSessionRevenueJournal({
      memberName: session.memberName,
      sessionType: session.sessionType,
      amount: session.amount,
      date: session.date,
    }),
  }));
}

// ============================================
// Error Analysis
// ============================================

/**
 * Analyze batch result errors
 * @param batchResult - Batch journal result
 * @returns Error analysis
 */
export function analyzeBatchErrors(batchResult: BatchJournalResult): {
  errorTypes: Map<string, number>;
  retriedSessions: JournalResult[];
  permanentFailures: JournalResult[];
} {
  const errorTypes = new Map<string, number>();
  const retriedSessions: JournalResult[] = [];
  const permanentFailures: JournalResult[] = [];

  batchResult.results.forEach((result) => {
    if (!result.success) {
      // Count error types
      const errorType = result.error || 'Unknown error';
      errorTypes.set(errorType, (errorTypes.get(errorType) || 0) + 1);

      // Categorize by retry status
      if (result.retryCount && result.retryCount > 0) {
        retriedSessions.push(result);
      } else {
        permanentFailures.push(result);
      }
    }
  });

  return {
    errorTypes,
    retriedSessions,
    permanentFailures,
  };
}

// ============================================
// Retry Failed Sessions
// ============================================

/**
 * Retry only failed sessions from previous batch
 * @param previousResult - Previous batch result
 * @param sessions - Original session data
 * @param config - Retry configuration
 * @returns New batch result
 */
export async function retryFailedSessions(
  previousResult: BatchJournalResult,
  sessions: SessionData[],
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<BatchJournalResult> {
  // Find failed session IDs
  const failedSessionIds = previousResult.results
    .filter((r) => !r.success)
    .map((r) => r.sessionId);

  // Filter original sessions to retry
  const sessionsToRetry = sessions.filter((s) => failedSessionIds.includes(s.id));

  if (sessionsToRetry.length === 0) {
    return {
      totalSessions: 0,
      successCount: 0,
      failureCount: 0,
      results: [],
      duration: 0,
    };
  }

  console.log(`🔄 Retrying ${sessionsToRetry.length} failed sessions...`);
  return createBatchSessionJournals(sessionsToRetry, config);
}

// ============================================
// Health Check
// ============================================

/**
 * Check accounting integration health
 * @returns Health status
 */
export async function checkAccountingIntegrationHealth(): Promise<{
  isHealthy: boolean;
  freeeConnected: boolean;
  tokenValid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let freeeConnected = false;
  let tokenValid = false;

  try {
    // Check if access token exists
    const accessToken = getStoredAccessToken();
    if (!accessToken) {
      errors.push('No freee access token found');
    } else {
      freeeConnected = true;

      // Check if token is valid
      if (isTokenExpired()) {
        errors.push('Access token expired');
        
        // Try to refresh
        const refreshToken = getStoredRefreshToken();
        if (refreshToken) {
          const refreshResult = await refreshAccessToken(refreshToken);
          if (refreshResult.success) {
            tokenValid = true;
            errors.pop(); // Remove "expired" error
          } else {
            errors.push('Failed to refresh token');
          }
        } else {
          errors.push('No refresh token available');
        }
      } else {
        tokenValid = true;
      }
    }
  } catch (error: any) {
    errors.push(`Health check failed: ${error.message}`);
  }

  return {
    isHealthy: errors.length === 0,
    freeeConnected,
    tokenValid,
    errors,
  };
}

// ============================================
// Export Utilities
// ============================================

export {
  validateSessionData,
  previewSessionRevenueJournal,
  createJournalEntry,
  type JournalEntryRequest,
};
