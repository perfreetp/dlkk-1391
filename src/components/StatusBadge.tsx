import type { BorrowStatus, ReservationStatus } from '@/types';

interface StatusBadgeProps {
  status: BorrowStatus | ReservationStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: '待审核', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已通过', className: 'bg-blue-100 text-blue-800' },
  cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-600' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-800' },
  borrowed: { label: '借用中', className: 'bg-orange-100 text-orange-800' },
  returned: { label: '已归还', className: 'bg-green-100 text-green-800' },
  damaged: { label: '已损坏', className: 'bg-red-100 text-red-800' },
  lost: { label: '已丢失', className: 'bg-red-100 text-red-800' },
};

export const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  );
};
