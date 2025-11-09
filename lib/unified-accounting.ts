// Unified Accounting Integration Library
// Phase 6-1: freee + MFクラウド統合管理
// Provides a single interface for both accounting services

import { 
  getValidAccessToken as getFreeeToken,
  checkAccountingIntegrationHealth as checkFreeeHealth,
} from './accounting';

import {
  getValidAccessToken as getMFCloudToken,
  checkMFCloudHealth,
  createExpense as createMFExpense,
  createRevenue as createMFRevenue,
  getExpenses as getMFExpenses,
  getRevenues as getMFRevenues,
  getFinancialSummary as getMFSummary,
  type ExpenseCreateInput as MFExpenseInput,
  type RevenueCreateInput as MFRevenueInput,
} from './mfcloud-api';

// ============================================
// Types & Interfaces
// ============================================

export type AccountingProvider = 'freee' | 'mfcloud';

export interface UnifiedAccountingConfig {
  provider: AccountingProvider;
}

export interface UnifiedExpenseInput {
  date: Date;
  category: string;
  amount: number;
  description: string;
  tax_rate?: number;
}

export interface UnifiedRevenueInput {
  date: Date;
  category: string;
  amount: number;
  description: string;
  customer_name?: string;
  invoice_number?: string;
  tax_rate?: number;
}

export interface UnifiedFinancialSummary {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  revenueCount: number;
  expenseCount: number;
}

export interface UnifiedHealthStatus {
  isHealthy: boolean;
  provider: AccountingProvider;
  connected: boolean;
  tokenValid: boolean;
  errors: string[];
}

export interface UnifiedAPIResponse<T> {
  success: boolean;
  provider: AccountingProvider;
  data?: T;
  error?: string;
}

// ============================================
// Provider Configuration Management
// ============================================

/**
 * Get current accounting provider preference
 * @returns Current provider ('freee' or 'mfcloud')
 */
export function getCurrentProvider(): AccountingProvider {
  if (typeof window === 'undefined') return 'freee';
  
  const stored = localStorage.getItem('accounting_provider');
  return (stored as AccountingProvider) || 'freee';
}

/**
 * Set accounting provider preference
 * @param provider - Provider to use
 */
export function setCurrentProvider(provider: AccountingProvider): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('accounting_provider', provider);
  console.log(`✅ Accounting provider set to: ${provider}`);
}

/**
 * Check if a specific provider is configured
 * @param provider - Provider to check
 * @returns True if configured
 */
export async function isProviderConfigured(
  provider: AccountingProvider
): Promise<boolean> {
  const token = provider === 'freee' 
    ? await getFreeeToken()
    : await getMFCloudToken();
  
  return token !== null;
}

/**
 * Get list of configured providers
 * @returns Array of configured providers
 */
export async function getConfiguredProviders(): Promise<AccountingProvider[]> {
  const providers: AccountingProvider[] = [];
  
  if (await isProviderConfigured('freee')) {
    providers.push('freee');
  }
  
  if (await isProviderConfigured('mfcloud')) {
    providers.push('mfcloud');
  }
  
  return providers;
}

// ============================================
// Unified Health Check
// ============================================

/**
 * Check health status for all configured providers
 * @returns Health status for each provider
 */
export async function checkAllProvidersHealth(): Promise<{
  freee: UnifiedHealthStatus | null;
  mfcloud: UnifiedHealthStatus | null;
}> {
  const results = {
    freee: null as UnifiedHealthStatus | null,
    mfcloud: null as UnifiedHealthStatus | null,
  };

  // Check freee
  try {
    const freeeHealth = await checkFreeeHealth();
    results.freee = {
      isHealthy: freeeHealth.isHealthy,
      provider: 'freee',
      connected: freeeHealth.freeeConnected,
      tokenValid: freeeHealth.tokenValid,
      errors: freeeHealth.errors,
    };
  } catch (error: any) {
    results.freee = {
      isHealthy: false,
      provider: 'freee',
      connected: false,
      tokenValid: false,
      errors: [error.message],
    };
  }

  // Check MFクラウド
  try {
    const mfHealth = await checkMFCloudHealth();
    results.mfcloud = {
      isHealthy: mfHealth.isHealthy,
      provider: 'mfcloud',
      connected: mfHealth.mfcloudConnected,
      tokenValid: mfHealth.tokenValid,
      errors: mfHealth.errors,
    };
  } catch (error: any) {
    results.mfcloud = {
      isHealthy: false,
      provider: 'mfcloud',
      connected: false,
      tokenValid: false,
      errors: [error.message],
    };
  }

  return results;
}

/**
 * Check current provider health
 * @returns Health status
 */
export async function checkCurrentProviderHealth(): Promise<UnifiedHealthStatus> {
  const provider = getCurrentProvider();
  
  if (provider === 'freee') {
    const health = await checkFreeeHealth();
    return {
      isHealthy: health.isHealthy,
      provider: 'freee',
      connected: health.freeeConnected,
      tokenValid: health.tokenValid,
      errors: health.errors,
    };
  } else {
    const health = await checkMFCloudHealth();
    return {
      isHealthy: health.isHealthy,
      provider: 'mfcloud',
      connected: health.mfcloudConnected,
      tokenValid: health.tokenValid,
      errors: health.errors,
    };
  }
}

// ============================================
// Unified Expense Management
// ============================================

/**
 * Create expense using current provider
 * @param input - Expense input
 * @returns Result
 */
export async function createExpense(
  input: UnifiedExpenseInput
): Promise<UnifiedAPIResponse<any>> {
  const provider = getCurrentProvider();

  try {
    if (provider === 'freee') {
      // For freee, we would need to implement expense creation
      // Currently freee-journal.ts focuses on revenue
      // This is a placeholder for future implementation
      return {
        success: false,
        provider: 'freee',
        error: 'freee expense creation not yet implemented',
      };
    } else {
      // MFクラウド
      const result = await createMFExpense(input as MFExpenseInput);
      return {
        success: result.success,
        provider: 'mfcloud',
        data: result.data,
        error: result.error,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      provider,
      error: error.message,
    };
  }
}

/**
 * Get expenses using current provider
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Expenses list
 */
export async function getExpenses(
  startDate: Date,
  endDate: Date
): Promise<UnifiedAPIResponse<any[]>> {
  const provider = getCurrentProvider();

  try {
    if (provider === 'freee') {
      // Placeholder for freee implementation
      return {
        success: false,
        provider: 'freee',
        error: 'freee expense retrieval not yet implemented',
      };
    } else {
      // MFクラウド
      const result = await getMFExpenses(startDate, endDate);
      return {
        success: result.success,
        provider: 'mfcloud',
        data: result.data,
        error: result.error,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      provider,
      error: error.message,
    };
  }
}

// ============================================
// Unified Revenue Management
// ============================================

/**
 * Create revenue using current provider
 * @param input - Revenue input
 * @returns Result
 */
export async function createRevenue(
  input: UnifiedRevenueInput
): Promise<UnifiedAPIResponse<any>> {
  const provider = getCurrentProvider();

  try {
    if (provider === 'freee') {
      // For freee, use existing session revenue journal
      // This would need adaptation from session-specific to general revenue
      return {
        success: false,
        provider: 'freee',
        error: 'freee general revenue creation needs session journal adaptation',
      };
    } else {
      // MFクラウド
      const result = await createMFRevenue(input as MFRevenueInput);
      return {
        success: result.success,
        provider: 'mfcloud',
        data: result.data,
        error: result.error,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      provider,
      error: error.message,
    };
  }
}

/**
 * Get revenues using current provider
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Revenues list
 */
export async function getRevenues(
  startDate: Date,
  endDate: Date
): Promise<UnifiedAPIResponse<any[]>> {
  const provider = getCurrentProvider();

  try {
    if (provider === 'freee') {
      // Placeholder for freee implementation
      return {
        success: false,
        provider: 'freee',
        error: 'freee revenue retrieval not yet implemented',
      };
    } else {
      // MFクラウド
      const result = await getMFRevenues(startDate, endDate);
      return {
        success: result.success,
        provider: 'mfcloud',
        data: result.data,
        error: result.error,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      provider,
      error: error.message,
    };
  }
}

// ============================================
// Unified Financial Summary
// ============================================

/**
 * Get financial summary using current provider
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Financial summary
 */
export async function getFinancialSummary(
  startDate: Date,
  endDate: Date
): Promise<UnifiedAPIResponse<UnifiedFinancialSummary>> {
  const provider = getCurrentProvider();

  try {
    if (provider === 'freee') {
      // Placeholder for freee implementation
      return {
        success: false,
        provider: 'freee',
        error: 'freee financial summary not yet implemented',
      };
    } else {
      // MFクラウド
      const result = await getMFSummary(startDate, endDate);
      return {
        success: result.success,
        provider: 'mfcloud',
        data: result.data,
        error: result.error,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      provider,
      error: error.message,
    };
  }
}

// ============================================
// Comparison & Analytics
// ============================================

/**
 * Compare data between freee and MFクラウド
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Comparison results
 */
export async function compareProviders(
  startDate: Date,
  endDate: Date
): Promise<{
  freee: UnifiedFinancialSummary | null;
  mfcloud: UnifiedFinancialSummary | null;
  differences: {
    revenueDiff: number;
    expenseDiff: number;
    profitDiff: number;
  } | null;
}> {
  const results = {
    freee: null as UnifiedFinancialSummary | null,
    mfcloud: null as UnifiedFinancialSummary | null,
    differences: null as any,
  };

  // Get freee summary
  setCurrentProvider('freee');
  const freeeResult = await getFinancialSummary(startDate, endDate);
  if (freeeResult.success && freeeResult.data) {
    results.freee = freeeResult.data;
  }

  // Get MFクラウド summary
  setCurrentProvider('mfcloud');
  const mfResult = await getFinancialSummary(startDate, endDate);
  if (mfResult.success && mfResult.data) {
    results.mfcloud = mfResult.data;
  }

  // Calculate differences
  if (results.freee && results.mfcloud) {
    results.differences = {
      revenueDiff: results.freee.totalRevenue - results.mfcloud.totalRevenue,
      expenseDiff: results.freee.totalExpense - results.mfcloud.totalExpense,
      profitDiff: results.freee.netProfit - results.mfcloud.netProfit,
    };
  }

  return results;
}

/**
 * Detect discrepancies between providers
 * @param startDate - Start date
 * @param endDate - End date
 * @param threshold - Difference threshold (default: 1000 yen)
 * @returns List of discrepancies
 */
export async function detectDiscrepancies(
  startDate: Date,
  endDate: Date,
  threshold: number = 1000
): Promise<{
  hasDiscrepancies: boolean;
  discrepancies: Array<{
    type: 'revenue' | 'expense' | 'profit';
    difference: number;
    freeeValue: number;
    mfcloudValue: number;
  }>;
}> {
  const comparison = await compareProviders(startDate, endDate);
  const discrepancies: any[] = [];

  if (
    !comparison.freee ||
    !comparison.mfcloud ||
    !comparison.differences
  ) {
    return { hasDiscrepancies: false, discrepancies: [] };
  }

  // Check revenue discrepancy
  if (Math.abs(comparison.differences.revenueDiff) >= threshold) {
    discrepancies.push({
      type: 'revenue',
      difference: comparison.differences.revenueDiff,
      freeeValue: comparison.freee.totalRevenue,
      mfcloudValue: comparison.mfcloud.totalRevenue,
    });
  }

  // Check expense discrepancy
  if (Math.abs(comparison.differences.expenseDiff) >= threshold) {
    discrepancies.push({
      type: 'expense',
      difference: comparison.differences.expenseDiff,
      freeeValue: comparison.freee.totalExpense,
      mfcloudValue: comparison.mfcloud.totalExpense,
    });
  }

  // Check profit discrepancy
  if (Math.abs(comparison.differences.profitDiff) >= threshold) {
    discrepancies.push({
      type: 'profit',
      difference: comparison.differences.profitDiff,
      freeeValue: comparison.freee.netProfit,
      mfcloudValue: comparison.mfcloud.netProfit,
    });
  }

  return {
    hasDiscrepancies: discrepancies.length > 0,
    discrepancies,
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get provider display name
 * @param provider - Provider
 * @returns Display name
 */
export function getProviderDisplayName(provider: AccountingProvider): string {
  return provider === 'freee' ? 'freee会計' : 'MFクラウド会計';
}

/**
 * Get provider icon/emoji
 * @param provider - Provider
 * @returns Emoji
 */
export function getProviderIcon(provider: AccountingProvider): string {
  return provider === 'freee' ? '🟢' : '🔵';
}
