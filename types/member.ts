// Member Data Types for GYM MATCH Manager
// Sprint 2B: Member Management

export type MemberStatus = 
  | 'active'      // 有効会員
  | 'inactive'    // 休会中
  | 'expired'     // 期限切れ
  | 'trial';      // 体験会員

export type ContractType = 
  | 'premium'     // プレミアム会員
  | 'standard'    // スタンダード会員
  | 'basic'       // ベーシック会員
  | 'trial';      // 体験会員

export type Gender = 'male' | 'female' | 'other' | 'not_specified';

export interface Member {
  id: string;
  name: string;
  nameKana?: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  gender?: Gender;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  contractType: ContractType;
  status: MemberStatus;
  joinDate: Date;
  expiryDate?: Date;
  lastVisit?: Date;
  totalSessions: number;
  totalRevenue: number;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberFilter {
  status?: MemberStatus[];
  contractType?: ContractType[];
  gender?: Gender[];
  searchQuery?: string;
  joinDateFrom?: Date;
  joinDateTo?: Date;
  lastVisitFrom?: Date;
  lastVisitTo?: Date;
}

export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  trialMembers: number;
  newMembersThisMonth: number;
  totalRevenue: number;
  averageSessionsPerMember: number;
}

// Contract Type Labels (Japanese)
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  premium: 'プレミアム会員',
  standard: 'スタンダード会員',
  basic: 'ベーシック会員',
  trial: '体験会員',
};

// Member Status Labels (Japanese)
export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  active: '有効',
  inactive: '休会中',
  expired: '期限切れ',
  trial: '体験中',
};

// Gender Labels (Japanese)
export const GENDER_LABELS: Record<Gender, string> = {
  male: '男性',
  female: '女性',
  other: 'その他',
  not_specified: '未指定',
};

// Member Status Colors (for UI)
export const MEMBER_STATUS_COLORS: Record<MemberStatus, {
  bg: string;
  text: string;
  border: string;
}> = {
  active: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  inactive: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
  },
  expired: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  trial: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
};

// Contract Type Colors (for UI)
export const CONTRACT_TYPE_COLORS: Record<ContractType, {
  bg: string;
  text: string;
}> = {
  premium: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
  },
  standard: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
  },
  basic: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
  },
  trial: {
    bg: 'bg-green-100',
    text: 'text-green-800',
  },
};

// Helper function: Format date for display
export function formatMemberDate(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Helper function: Calculate age from date of birth
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}

// Helper function: Calculate days until expiry
export function daysUntilExpiry(expiryDate: Date): number {
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// Helper function: Check if member is expiring soon (within 7 days)
export function isExpiringSoon(expiryDate: Date | undefined): boolean {
  if (!expiryDate) return false;
  const days = daysUntilExpiry(expiryDate);
  return days > 0 && days <= 7;
}

// Helper function: Check if member is expired
export function isExpired(expiryDate: Date | undefined): boolean {
  if (!expiryDate) return false;
  return daysUntilExpiry(expiryDate) < 0;
}

// Helper function: Calculate membership duration in months
export function membershipDurationMonths(joinDate: Date): number {
  const today = new Date();
  const months = (today.getFullYear() - joinDate.getFullYear()) * 12 +
                 (today.getMonth() - joinDate.getMonth());
  
  return Math.max(0, months);
}

// Helper function: Format phone number (Japanese style)
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as XXX-XXXX-XXXX
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  
  // Format as XX-XXXX-XXXX (landline)
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
}

// Helper function: Get member activity status text
export function getMemberActivityStatus(lastVisit: Date | undefined): {
  text: string;
  color: string;
} {
  if (!lastVisit) {
    return {
      text: '来店履歴なし',
      color: 'text-gray-500',
    };
  }
  
  const today = new Date();
  const daysSinceLastVisit = Math.floor(
    (today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceLastVisit <= 7) {
    return {
      text: '最近アクティブ',
      color: 'text-green-600',
    };
  } else if (daysSinceLastVisit <= 30) {
    return {
      text: '定期利用中',
      color: 'text-blue-600',
    };
  } else if (daysSinceLastVisit <= 60) {
    return {
      text: '利用減少',
      color: 'text-yellow-600',
    };
  } else {
    return {
      text: '長期未利用',
      color: 'text-red-600',
    };
  }
}
