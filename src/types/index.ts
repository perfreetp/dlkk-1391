export type UserRole = 'resident' | 'admin';

export type ReservationStatus = 'pending' | 'approved' | 'cancelled' | 'completed';

export type BorrowStatus = 'borrowed' | 'returned' | 'damaged' | 'lost';

export type NoticeType = 'announcement' | 'faq';

export type DamageReportStatus = 'pending' | 'processed';

export type DepositType = 'recharge' | 'refund' | 'freeze' | 'unfreeze';

export interface User {
  id: string;
  name: string;
  phone: string;
  roomNumber: string;
  role: UserRole;
  isBlacklisted: boolean;
  depositBalance: number;
  avatar: string;
  overdueCount: number;
  damageCount: number;
}

export interface ToolCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Building {
  id: string;
  name: string;
  location: string;
}

export interface Tool {
  id: string;
  name: string;
  categoryId: string;
  buildingId: string;
  description: string;
  specification: string;
  image: string;
  totalStock: number;
  availableStock: number;
  depositAmount: number;
  maxBorrowDays: number;
  usageNotes: string;
  borrowCount: number;
}

export interface Reservation {
  id: string;
  userId: string;
  toolId: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: ReservationStatus;
  qrCode: string;
  createdAt: string;
}

export interface BorrowRecord {
  id: string;
  userId: string;
  toolId: string;
  reservationId: string;
  borrowTime: string;
  expectedReturnTime: string;
  actualReturnTime?: string;
  status: BorrowStatus;
  depositAmount: number;
  isOverdue: boolean;
}

export interface DamageReport {
  id: string;
  recordId: string;
  userId: string;
  description: string;
  image: string;
  reportedAt: string;
  status: DamageReportStatus;
  compensationAmount?: number;
}

export interface Deposit {
  id: string;
  userId: string;
  amount: number;
  type: DepositType;
  status: 'success' | 'pending';
  createdAt: string;
  remark?: string;
}

export interface Compensation {
  id: string;
  recordId: string;
  userId: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: NoticeType;
  createdAt: string;
  isTop: boolean;
}

export interface Statistics {
  totalTools: number;
  totalBorrowed: number;
  overdueCount: number;
  damageCount: number;
  popularTools: { toolId: string; toolName: string; count: number }[];
  categoryStats: { categoryId: string; categoryName: string; count: number }[];
}
