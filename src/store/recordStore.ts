import { create } from 'zustand';
import type {
  BorrowRecord,
  DamageReport,
  Deposit,
  Compensation,
  Statistics,
} from '@/types';
import {
  getRecords,
  setRecords,
  getDamageReports,
  setDamageReports,
  getDeposits,
  getCompensations,
  setCompensations,
  generateId,
} from '@/utils/storage';
import { getCurrentTimeISO, isOverdue, isSoonDue } from '@/utils/date';
import { useAuthStore } from './authStore';
import { useToolStore } from './toolStore';

interface RecordState {
  records: BorrowRecord[];
  damageReports: DamageReport[];
  deposits: Deposit[];
  compensations: Compensation[];

  borrowTool: (
    reservationId: string,
    userId: string,
    toolId: string,
    depositAmount: number,
    expectedReturnTime: string
  ) => BorrowRecord | null;

  returnTool: (recordId: string, isDamaged?: boolean) => boolean;

  reportDamage: (
    recordId: string,
    userId: string,
    description: string,
    image: string,
    compensationAmount?: number
  ) => DamageReport | null;

  processDamageReport: (reportId: string, compensationAmount: number) => void;

  getRecordsByUser: (userId: string) => BorrowRecord[];

  getOverdueRecords: () => BorrowRecord[];

  getSoonDueRecords: () => BorrowRecord[];

  getStatistics: () => Statistics;

  getDepositsByUser: (userId: string) => Deposit[];

  getCompensationsByUser: (userId: string) => Compensation[];
}

export const useRecordStore = create<RecordState>((set, get) => ({
  records: getRecords(),
  damageReports: getDamageReports(),
  deposits: getDeposits(),
  compensations: getCompensations(),

  borrowTool: (
    reservationId: string,
    userId: string,
    toolId: string,
    depositAmount: number,
    expectedReturnTime: string
  ) => {
    const tool = useToolStore.getState().getToolById(toolId);
    if (!tool || tool.availableStock <= 0) return null;

    useToolStore.getState().updateToolStock(toolId, -1);

    const newRecord: BorrowRecord = {
      id: generateId('REC'),
      userId,
      toolId,
      reservationId,
      borrowTime: getCurrentTimeISO(),
      expectedReturnTime,
      status: 'borrowed',
      depositAmount,
      isOverdue: false,
    };

    const records = [...get().records, newRecord];
    setRecords(records);
    set({ records });

    return newRecord;
  },

  returnTool: (recordId: string, isDamaged: boolean = false) => {
    const record = get().records.find((r) => r.id === recordId);
    if (!record || record.status !== 'borrowed') return false;

    const updatedRecords = get().records.map((r) =>
      r.id === recordId
        ? {
            ...r,
            status: isDamaged ? ('damaged' as const) : ('returned' as const),
            actualReturnTime: getCurrentTimeISO(),
            isOverdue: isOverdue(r.expectedReturnTime),
          }
        : r
    );
    setRecords(updatedRecords);
    set({ records: updatedRecords });

    useToolStore.getState().updateToolStock(record.toolId, 1);

    const authStore = useAuthStore.getState();
    if (!isDamaged) {
      authStore.updateDepositBalance(record.userId, record.depositAmount, 'unfreeze', '工具完好归还，释放占用押金');
    } else {
      const user = authStore.users.find((u) => u.id === record.userId);
      if (user) {
        authStore.updateUser({ ...user, damageCount: user.damageCount + 1 });
      }
    }

    const user = authStore.users.find((u) => u.id === record.userId);
    if (user && isOverdue(record.expectedReturnTime)) {
      const newOverdueCount = user.overdueCount + 1;
      authStore.updateUser({
        ...user,
        overdueCount: newOverdueCount,
        isBlacklisted: newOverdueCount >= 5 || user.damageCount >= 3,
      });
    }

    return true;
  },

  reportDamage: (
    recordId: string,
    userId: string,
    description: string,
    image: string,
    compensationAmount?: number
  ) => {
    const newReport: DamageReport = {
      id: generateId('DMG'),
      recordId,
      userId,
      description,
      image,
      reportedAt: getCurrentTimeISO(),
      status: 'pending',
      compensationAmount,
    };

    const reports = [...get().damageReports, newReport];
    setDamageReports(reports);
    set({ damageReports: reports });

    return newReport;
  },

  processDamageReport: (reportId: string, compensationAmount: number) => {
    const reports = get().damageReports.map((r) =>
      r.id === reportId
        ? { ...r, status: 'processed' as const, compensationAmount }
        : r
    );
    setDamageReports(reports);
    set({ damageReports: reports });

    const report = get().damageReports.find((r) => r.id === reportId);
    if (report) {
      const record = get().records.find((r) => r.id === report.recordId);
      if (record && record.status === 'borrowed') {
        const updatedRecords = get().records.map((r) =>
          r.id === report.recordId
            ? {
                ...r,
                status: 'damaged' as const,
                actualReturnTime: getCurrentTimeISO(),
                isOverdue: isOverdue(r.expectedReturnTime),
              }
            : r
        );
        setRecords(updatedRecords);
        set({ records: updatedRecords });

        useToolStore.getState().updateToolStock(record.toolId, 1);

        const authStore = useAuthStore.getState();
        const user = authStore.users.find((u) => u.id === record.userId);
        if (user) {
          const newDamageCount = user.damageCount + 1;
          authStore.updateUser({
            ...user,
            damageCount: newDamageCount,
            isBlacklisted: user.overdueCount >= 5 || newDamageCount >= 3,
          });
        }

        if (isOverdue(record.expectedReturnTime)) {
          const user = authStore.users.find((u) => u.id === record.userId);
          if (user) {
            const newOverdueCount = user.overdueCount + 1;
            authStore.updateUser({
              ...user,
              overdueCount: newOverdueCount,
              isBlacklisted: newOverdueCount >= 5 || user.damageCount >= 3,
            });
          }
        }
      }

      const newCompensation: Compensation = {
        id: generateId('CMP'),
        recordId: report.recordId,
        userId: report.userId,
        amount: compensationAmount,
        reason: report.description,
        createdAt: getCurrentTimeISO(),
      };

      const compensations = [...get().compensations, newCompensation];
      setCompensations(compensations);
      set({ compensations });

      if (record) {
        const refundAmount = Math.max(0, record.depositAmount - compensationAmount);
        if (refundAmount > 0) {
          const authStore = useAuthStore.getState();
          authStore.updateDepositBalance(
            report.userId,
            refundAmount,
            'unfreeze',
            `损坏赔付${compensationAmount}元后释放剩余占用押金`
          );
        }
      }
    }
  },

  getRecordsByUser: (userId: string) => {
    return [...get().records]
      .filter((r) => r.userId === userId)
      .sort((a, b) => new Date(b.borrowTime).getTime() - new Date(a.borrowTime).getTime());
  },

  getOverdueRecords: () => {
    return get().records.filter(
      (r) => r.status === 'borrowed' && isOverdue(r.expectedReturnTime)
    );
  },

  getSoonDueRecords: () => {
    return get().records.filter(
      (r) => r.status === 'borrowed' && !isOverdue(r.expectedReturnTime) && isSoonDue(r.expectedReturnTime)
    );
  },

  getStatistics: () => {
    const { records, damageReports } = get();
    const { tools, categories } = useToolStore.getState();

    const borrowedCount = records.filter((r) => r.status === 'borrowed').length;
    const overdueCount = records.filter(
      (r) => r.status === 'borrowed' && isOverdue(r.expectedReturnTime)
    ).length;
    const damageCount = damageReports.filter((r) => r.status === 'processed').length;

    const toolBorrowCounts = records.reduce((acc, r) => {
      acc[r.toolId] = (acc[r.toolId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularTools = Object.entries(toolBorrowCounts)
      .map(([toolId, count]) => {
        const tool = tools.find((t) => t.id === toolId);
        return { toolId, toolName: tool?.name || '未知工具', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const categoryBorrowCounts = records.reduce((acc, r) => {
      const tool = tools.find((t) => t.id === r.toolId);
      if (tool) {
        acc[tool.categoryId] = (acc[tool.categoryId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const categoryStats = Object.entries(categoryBorrowCounts).map(([categoryId, count]) => {
      const category = categories.find((c) => c.id === categoryId);
      return { categoryId, categoryName: category?.name || '未知分类', count };
    });

    return {
      totalTools: tools.length,
      totalBorrowed: borrowedCount,
      overdueCount,
      damageCount,
      popularTools,
      categoryStats,
    };
  },

  getDepositsByUser: (userId: string) => {
    return [...get().deposits]
      .filter((d) => d.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getCompensationsByUser: (userId: string) => {
    return [...get().compensations]
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
}));
