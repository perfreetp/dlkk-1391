import type { Reservation } from '@/types';

export const mockReservations: Reservation[] = [
  {
    id: 'RES001',
    userId: '1',
    toolId: '1',
    startTime: '2026-06-15T09:00:00Z',
    endTime: '2026-06-17T18:00:00Z',
    purpose: '安装客厅挂画',
    status: 'approved',
    qrCode: 'RES001-USER1-TOOL1-20260615',
    createdAt: '2026-06-14T10:30:00Z',
  },
  {
    id: 'RES002',
    userId: '1',
    toolId: '4',
    startTime: '2026-06-16T10:00:00Z',
    endTime: '2026-06-16T17:00:00Z',
    purpose: '更换吸顶灯',
    status: 'pending',
    qrCode: 'RES002-USER1-TOOL4-20260616',
    createdAt: '2026-06-15T08:00:00Z',
  },
  {
    id: 'RES003',
    userId: '2',
    toolId: '6',
    startTime: '2026-06-15T14:00:00Z',
    endTime: '2026-06-15T20:00:00Z',
    purpose: '搬运快递',
    status: 'completed',
    qrCode: 'RES003-USER2-TOOL6-20260615',
    createdAt: '2026-06-14T16:00:00Z',
  },
];
