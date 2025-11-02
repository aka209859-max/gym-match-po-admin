// freee API Journal Entry Library
// GYM MATCH Manager - Automatic Revenue Journaling

import { getStoredAccessToken, isTokenExpired, getStoredRefreshToken } from './freee-auth';

export interface JournalEntryRequest {
  companyId: number;
  issueDate: string; // YYYY-MM-DD format
  description: string;
  debitAccountId: number;
  creditAccountId: number;
  amount: number;
  memberName?: string;
  sessionType?: string;
}

export interface FreeeJournalEntry {
  company_id: number;
  issue_date: string;
  details: {
    id?: number;
    entry_side: 'debit' | 'credit';
    account_item_id: number;
    tax_code: number;
    amount: number;
    description: string;
  }[];
}

export interface FreeeAccountItem {
  id: number;
  name: string;
  shortcut?: string;
  tax_code: number;
  account_category: string;
  categories: string[];
}

// Standard account items mapping (typical freee account IDs)
// Note: These IDs may vary by company, production code should fetch dynamically
export const STANDARD_ACCOUNTS = {
  CASH: 1, // 現金
  REVENUE: 100, // 売上高
  SALES_TAX_PAYABLE: 507, // 仮受消費税
};

// Tax codes (freee standard)
export const TAX_CODES = {
  TAX_INCLUDED_10: 108, // 10%内税
  TAX_EXCLUDED_10: 208, // 10%外税
  TAX_INCLUDED_8: 107, // 8%内税（軽減税率）
  TAX_FREE: 0, // 非課税
};

/**
 * Get list of account items for a company
 * @param accessToken - freee access token
 * @param companyId - Company ID
 * @returns List of account items
 */
export async function getAccountItems(
  accessToken: string,
  companyId: number
): Promise<FreeeAccountItem[]> {
  const response = await fetch(
    `https://api.freee.co.jp/api/1/account_items?company_id=${companyId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch account items: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.account_items || [];
}

/**
 * Find account item by name or category
 * @param accountItems - List of account items
 * @param searchTerm - Search term (e.g., "現金", "売上")
 * @returns Account item ID or null
 */
export function findAccountItemByName(
  accountItems: FreeeAccountItem[],
  searchTerm: string
): number | null {
  const item = accountItems.find(
    (item) =>
      item.name.includes(searchTerm) ||
      item.shortcut?.includes(searchTerm) ||
      item.categories.some((cat) => cat.includes(searchTerm))
  );
  return item ? item.id : null;
}

/**
 * Create a journal entry in freee
 * @param request - Journal entry request
 * @returns Created journal entry response
 */
export async function createJournalEntry(
  request: JournalEntryRequest
): Promise<any> {
  const accessToken = getStoredAccessToken();

  if (!accessToken) {
    throw new Error('Access token not found. Please connect to freee first.');
  }

  if (isTokenExpired()) {
    throw new Error('Access token expired. Please reconnect to freee.');
  }

  // Build description with member name and session type
  let description = request.description;
  if (request.memberName) {
    description += ` - ${request.memberName}`;
  }
  if (request.sessionType) {
    description += ` (${request.sessionType})`;
  }

  // Create journal entry payload
  const payload: FreeeJournalEntry = {
    company_id: request.companyId,
    issue_date: request.issueDate,
    details: [
      {
        entry_side: 'debit',
        account_item_id: request.debitAccountId,
        tax_code: TAX_CODES.TAX_INCLUDED_10,
        amount: request.amount,
        description: description,
      },
      {
        entry_side: 'credit',
        account_item_id: request.creditAccountId,
        tax_code: TAX_CODES.TAX_INCLUDED_10,
        amount: request.amount,
        description: description,
      },
    ],
  };

  const response = await fetch(
    'https://api.freee.co.jp/api/1/manual_journals',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create journal entry: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Create journal entry for session revenue
 * @param sessionData - Session data
 * @returns Created journal entry
 */
export async function createSessionRevenueJournal(sessionData: {
  memberName: string;
  sessionType: string;
  amount: number;
  date: Date;
}): Promise<any> {
  // Get company ID from localStorage
  const companyIdStr = localStorage.getItem('freee_company_id');
  if (!companyIdStr) {
    throw new Error('Company ID not found. Please reconnect to freee.');
  }

  const companyId = parseInt(companyIdStr);

  // Format date as YYYY-MM-DD
  const issueDate = sessionData.date.toISOString().split('T')[0];

  // Get account items to find correct IDs
  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    throw new Error('Access token not found. Please connect to freee first.');
  }

  try {
    const accountItems = await getAccountItems(accessToken, companyId);

    // Find account IDs dynamically
    const cashAccountId =
      findAccountItemByName(accountItems, '現金') || STANDARD_ACCOUNTS.CASH;
    const revenueAccountId =
      findAccountItemByName(accountItems, '売上') || STANDARD_ACCOUNTS.REVENUE;

    // Create journal entry
    return await createJournalEntry({
      companyId,
      issueDate,
      description: 'パーソナルトレーニング売上',
      debitAccountId: cashAccountId,
      creditAccountId: revenueAccountId,
      amount: sessionData.amount,
      memberName: sessionData.memberName,
      sessionType: sessionData.sessionType,
    });
  } catch (error) {
    console.error('Failed to create session revenue journal:', error);
    throw error;
  }
}

/**
 * Create bulk journal entries for multiple sessions
 * @param sessions - Array of session data
 * @returns Array of created journal entries
 */
export async function createBulkSessionRevenueJournals(
  sessions: Array<{
    memberName: string;
    sessionType: string;
    amount: number;
    date: Date;
  }>
): Promise<any[]> {
  const results = [];

  for (const session of sessions) {
    try {
      const result = await createSessionRevenueJournal(session);
      results.push({ success: true, data: result, session });
    } catch (error) {
      results.push({ success: false, error, session });
    }
  }

  return results;
}

/**
 * Preview journal entry without creating it
 * @param sessionData - Session data
 * @returns Preview of journal entry
 */
export function previewSessionRevenueJournal(sessionData: {
  memberName: string;
  sessionType: string;
  amount: number;
  date: Date;
}): {
  date: string;
  description: string;
  debit: { account: string; amount: number };
  credit: { account: string; amount: number };
} {
  const issueDate = sessionData.date.toISOString().split('T')[0];
  const description = `パーソナルトレーニング売上 - ${sessionData.memberName} (${sessionData.sessionType})`;

  return {
    date: issueDate,
    description,
    debit: {
      account: '現金',
      amount: sessionData.amount,
    },
    credit: {
      account: '売上高',
      amount: sessionData.amount,
    },
  };
}

/**
 * Validate session data before creating journal entry
 * @param sessionData - Session data to validate
 * @returns Validation result
 */
export function validateSessionData(sessionData: {
  memberName: string;
  sessionType: string;
  amount: number;
  date: Date;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!sessionData.memberName || sessionData.memberName.trim() === '') {
    errors.push('会員名が入力されていません');
  }

  if (!sessionData.sessionType || sessionData.sessionType.trim() === '') {
    errors.push('セッション種別が入力されていません');
  }

  if (sessionData.amount <= 0) {
    errors.push('金額は0より大きい値を入力してください');
  }

  if (!(sessionData.date instanceof Date) || isNaN(sessionData.date.getTime())) {
    errors.push('無効な日付です');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
