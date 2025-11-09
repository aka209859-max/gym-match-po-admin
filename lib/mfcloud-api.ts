// MFクラウド API Integration Library
// Phase 6-1: MFクラウド完全統合
// Expense tracking, revenue management, and accounting integration

import { getStoredAccessToken, isTokenExpired, refreshAccessToken, getStoredRefreshToken, getStoredOfficeId } from './mfcloud-auth';

// ============================================
// Types & Interfaces
// ============================================

export interface MFCloudExpense {
  id: string;
  office_id: string;
  date: string; // YYYY-MM-DD
  category: string;
  amount: number;
  tax_amount: number;
  description: string;
  status: 'draft' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface MFCloudRevenue {
  id: string;
  office_id: string;
  date: string; // YYYY-MM-DD
  category: string;
  amount: number;
  tax_amount: number;
  description: string;
  customer_name?: string;
  invoice_number?: string;
  status: 'pending' | 'received' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface MFCloudAccountItem {
  id: number;
  name: string;
  code: string;
  category: string;
  sub_category: string;
}

export interface ExpenseCreateInput {
  date: Date;
  category: string;
  amount: number;
  description: string;
  tax_rate?: number; // Default: 0.1 (10%)
}

export interface RevenueCreateInput {
  date: Date;
  category: string;
  amount: number;
  description: string;
  customer_name?: string;
  invoice_number?: string;
  tax_rate?: number; // Default: 0.1 (10%)
}

export interface MFCloudAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status_code?: number;
}

// ============================================
// Token Management
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
      console.log('🔄 MFクラウド access token expired, attempting refresh...');
      
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        console.error('❌ No MFクラウド refresh token available');
        return null;
      }

      // Refresh the token
      const config = {
        clientId: process.env.NEXT_PUBLIC_MFCLOUD_CLIENT_ID || '',
        clientSecret: process.env.MFCLOUD_CLIENT_SECRET || '',
        redirectUri: process.env.NEXT_PUBLIC_MFCLOUD_REDIRECT_URI || '',
      };

      const newTokens = await refreshAccessToken(config, refreshToken);
      console.log('✅ MFクラウド access token refreshed successfully');
      accessToken = newTokens.access_token;
    }

    return accessToken;
  } catch (error) {
    console.error('❌ Error getting valid MFクラウド access token:', error);
    return null;
  }
}

// ============================================
// Account Items (勘定科目)
// ============================================

/**
 * Get list of account items
 * @returns List of account items
 */
export async function getAccountItems(): Promise<MFCloudAPIResponse<MFCloudAccountItem[]>> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return { success: false, error: 'No valid access token' };
    }

    const officeId = getStoredOfficeId();
    if (!officeId) {
      return { success: false, error: 'No office ID found' };
    }

    const response = await fetch(
      `https://invoice.moneyforward.com/api/v1/offices/${officeId}/account_items`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: `Failed to fetch account items: ${JSON.stringify(error)}`,
        status_code: response.status,
      };
    }

    const data = await response.json();
    return { success: true, data: data.account_items || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// Expense Management (経費管理)
// ============================================

/**
 * Create expense record
 * @param input - Expense creation input
 * @returns Created expense
 */
export async function createExpense(
  input: ExpenseCreateInput
): Promise<MFCloudAPIResponse<MFCloudExpense>> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return { success: false, error: 'No valid access token' };
    }

    const officeId = getStoredOfficeId();
    if (!officeId) {
      return { success: false, error: 'No office ID found' };
    }

    const taxRate = input.tax_rate || 0.1;
    const taxAmount = Math.round(input.amount * taxRate);

    const expenseData = {
      office_id: officeId,
      date: input.date.toISOString().split('T')[0],
      category: input.category,
      amount: input.amount,
      tax_amount: taxAmount,
      description: input.description,
      status: 'approved',
    };

    const response = await fetch(
      `https://invoice.moneyforward.com/api/v1/expenses`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: `Failed to create expense: ${JSON.stringify(error)}`,
        status_code: response.status,
      };
    }

    const data = await response.json();
    return { success: true, data: data.expense };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get expenses for a date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns List of expenses
 */
export async function getExpenses(
  startDate: Date,
  endDate: Date
): Promise<MFCloudAPIResponse<MFCloudExpense[]>> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return { success: false, error: 'No valid access token' };
    }

    const officeId = getStoredOfficeId();
    if (!officeId) {
      return { success: false, error: 'No office ID found' };
    }

    const params = new URLSearchParams({
      office_id: officeId,
      from: startDate.toISOString().split('T')[0],
      to: endDate.toISOString().split('T')[0],
    });

    const response = await fetch(
      `https://invoice.moneyforward.com/api/v1/expenses?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: `Failed to fetch expenses: ${JSON.stringify(error)}`,
        status_code: response.status,
      };
    }

    const data = await response.json();
    return { success: true, data: data.expenses || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// Revenue Management (売上管理)
// ============================================

/**
 * Create revenue record
 * @param input - Revenue creation input
 * @returns Created revenue
 */
export async function createRevenue(
  input: RevenueCreateInput
): Promise<MFCloudAPIResponse<MFCloudRevenue>> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return { success: false, error: 'No valid access token' };
    }

    const officeId = getStoredOfficeId();
    if (!officeId) {
      return { success: false, error: 'No office ID found' };
    }

    const taxRate = input.tax_rate || 0.1;
    const taxAmount = Math.round(input.amount * taxRate);

    const revenueData = {
      office_id: officeId,
      date: input.date.toISOString().split('T')[0],
      category: input.category,
      amount: input.amount,
      tax_amount: taxAmount,
      description: input.description,
      customer_name: input.customer_name,
      invoice_number: input.invoice_number,
      status: 'received',
    };

    const response = await fetch(
      `https://invoice.moneyforward.com/api/v1/revenues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(revenueData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: `Failed to create revenue: ${JSON.stringify(error)}`,
        status_code: response.status,
      };
    }

    const data = await response.json();
    return { success: true, data: data.revenue };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get revenues for a date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns List of revenues
 */
export async function getRevenues(
  startDate: Date,
  endDate: Date
): Promise<MFCloudAPIResponse<MFCloudRevenue[]>> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return { success: false, error: 'No valid access token' };
    }

    const officeId = getStoredOfficeId();
    if (!officeId) {
      return { success: false, error: 'No office ID found' };
    }

    const params = new URLSearchParams({
      office_id: officeId,
      from: startDate.toISOString().split('T')[0],
      to: endDate.toISOString().split('T')[0],
    });

    const response = await fetch(
      `https://invoice.moneyforward.com/api/v1/revenues?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: `Failed to fetch revenues: ${JSON.stringify(error)}`,
        status_code: response.status,
      };
    }

    const data = await response.json();
    return { success: true, data: data.revenues || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// Summary & Analytics
// ============================================

/**
 * Get revenue and expense summary
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Summary data
 */
export async function getFinancialSummary(
  startDate: Date,
  endDate: Date
): Promise<
  MFCloudAPIResponse<{
    totalRevenue: number;
    totalExpense: number;
    netProfit: number;
    revenueCount: number;
    expenseCount: number;
  }>
> {
  try {
    const [revenuesResult, expensesResult] = await Promise.all([
      getRevenues(startDate, endDate),
      getExpenses(startDate, endDate),
    ]);

    if (!revenuesResult.success || !expensesResult.success) {
      return {
        success: false,
        error: 'Failed to fetch financial data',
      };
    }

    const revenues = revenuesResult.data || [];
    const expenses = expensesResult.data || [];

    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpense;

    return {
      success: true,
      data: {
        totalRevenue,
        totalExpense,
        netProfit,
        revenueCount: revenues.length,
        expenseCount: expenses.length,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// Health Check
// ============================================

/**
 * Check MFクラウド integration health
 * @returns Health status
 */
export async function checkMFCloudHealth(): Promise<{
  isHealthy: boolean;
  mfcloudConnected: boolean;
  tokenValid: boolean;
  officeConfigured: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let mfcloudConnected = false;
  let tokenValid = false;
  let officeConfigured = false;

  try {
    // Check if access token exists
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      errors.push('No MFクラウド access token found');
    } else {
      mfcloudConnected = true;
      tokenValid = !isTokenExpired();

      if (!tokenValid) {
        errors.push('Access token expired');
      }
    }

    // Check if office is configured
    const officeId = getStoredOfficeId();
    if (!officeId) {
      errors.push('No office configured');
    } else {
      officeConfigured = true;
    }
  } catch (error: any) {
    errors.push(`Health check failed: ${error.message}`);
  }

  return {
    isHealthy: errors.length === 0,
    mfcloudConnected,
    tokenValid,
    officeConfigured,
    errors,
  };
}
