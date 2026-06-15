import type { BorrowRecord, DamageReport, Deposit, Compensation } from '@/types';

export const mockRecords: BorrowRecord[] = [
  {
    id: 'REC001',
    userId: '1',
    toolId: '6',
    reservationId: 'RES003',
    borrowTime: '2026-06-10T09:00:00Z',
    expectedReturnTime: '2026-06-10T20:00:00Z',
    actualReturnTime: '2026-06-10T19:30:00Z',
    status: 'returned',
    depositAmount: 100,
    isOverdue: false,
  },
  {
    id: 'REC002',
    userId: '1',
    toolId: '8',
    reservationId: 'RES004',
    borrowTime: '2026-06-12T10:00:00Z',
    expectedReturnTime: '2026-06-14T18:00:00Z',
    actualReturnTime: '2026-06-14T16:00:00Z',
    status: 'returned',
    depositAmount: 20,
    isOverdue: false,
  },
  {
    id: 'REC003',
    userId: '2',
    toolId: '1',
    reservationId: 'RES005',
    borrowTime: '2026-06-13T09:00:00Z',
    expectedReturnTime: '2026-06-15T18:00:00Z',
    status: 'borrowed',
    depositAmount: 200,
    isOverdue: false,
  },
  {
    id: 'REC004',
    userId: '2',
    toolId: '11',
    reservationId: 'RES006',
    borrowTime: '2026-06-10T10:00:00Z',
    expectedReturnTime: '2026-06-11T18:00:00Z',
    actualReturnTime: '2026-06-12T10:00:00Z',
    status: 'damaged',
    depositAmount: 100,
    isOverdue: true,
  },
  {
    id: 'REC005',
    userId: '3',
    toolId: '4',
    reservationId: 'RES007',
    borrowTime: '2026-06-08T09:00:00Z',
    expectedReturnTime: '2026-06-08T18:00:00Z',
    actualReturnTime: '2026-06-08T17:30:00Z',
    status: 'returned',
    depositAmount: 100,
    isOverdue: false,
  },
];

export const mockDamageReports: DamageReport[] = [
  {
    id: 'DMG001',
    recordId: 'REC004',
    userId: '2',
    description: '吸尘器电机进水，无法正常工作',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=damaged%20vacuum%20cleaner%20motor%20water%20damage&image_size=square',
    reportedAt: '2026-06-12T10:30:00Z',
    status: 'processed',
    compensationAmount: 80,
  },
];

export const mockDeposits: Deposit[] = [
  {
    id: 'DEP001',
    userId: '1',
    amount: 500,
    type: 'recharge',
    status: 'success',
    createdAt: '2026-06-01T10:00:00Z',
    remark: '初始充值',
  },
  {
    id: 'DEP002',
    userId: '1',
    amount: 100,
    type: 'refund',
    status: 'success',
    createdAt: '2026-06-10T20:00:00Z',
    remark: '归还手推车押金退还',
  },
  {
    id: 'DEP003',
    userId: '2',
    amount: 300,
    type: 'recharge',
    status: 'success',
    createdAt: '2026-06-05T14:00:00Z',
    remark: '初始充值',
  },
];

export const mockCompensations: Compensation[] = [
  {
    id: 'CMP001',
    recordId: 'REC004',
    userId: '2',
    amount: 80,
    reason: '吸尘器电机进水损坏',
    createdAt: '2026-06-12T15:00:00Z',
  },
];
