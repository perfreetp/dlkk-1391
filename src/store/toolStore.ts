import { create } from 'zustand';
import type { Tool, ToolCategory, Building, Reservation, ToolAdjustmentLog } from '@/types';
import {
  getTools,
  setTools,
  getCategories,
  getBuildings,
  getReservations,
  setReservations,
  generateId,
  getAdjustmentLogs,
  setAdjustmentLogs,
  getBuildings as getBuildingsList,
} from '@/utils/storage';
import { getCurrentTimeISO, formatDate } from '@/utils/date';
import { useRecordStore } from './recordStore';
import { parseISO, areIntervalsOverlapping } from 'date-fns';

interface ToolState {
  tools: Tool[];
  categories: ToolCategory[];
  buildings: Building[];
  reservations: Reservation[];
  adjustmentLogs: ToolAdjustmentLog[];
  searchKeyword: string;
  selectedCategory: string;
  selectedBuilding: string;
  setSearchKeyword: (keyword: string) => void;
  setSelectedCategory: (categoryId: string) => void;
  setSelectedBuilding: (buildingId: string) => void;
  getFilteredTools: () => Tool[];
  getToolById: (id: string) => Tool | undefined;
  getPopularTools: (limit?: number) => Tool[];
  getAvailableSlots: (toolId: string, date: string) => boolean[];
  createReservation: (
    userId: string,
    toolId: string,
    startTime: string,
    endTime: string,
    purpose: string
  ) => Reservation | null;
  cancelReservation: (reservationId: string) => boolean;
  approveReservation: (reservationId: string) => void;
  updateToolStock: (toolId: string, delta: number) => void;
  getReservationsByUser: (userId: string) => Reservation[];
  getReservationsByTool: (toolId: string) => Reservation[];
  updateReservationStatus: (reservationId: string, status: Reservation['status']) => void;
  isToolAvailable: (toolId: string, startTime: string, endTime: string) => boolean;
  updateTool: (toolId: string, updates: Partial<Tool>) => void;
  addAdjustmentLog: (
    toolId: string,
    operatorId: string,
    operatorName: string,
    changes: ToolAdjustmentLog['changes']
  ) => ToolAdjustmentLog;
  getAdjustmentLogsByTool: (toolId: string) => ToolAdjustmentLog[];
}

export const useToolStore = create<ToolState>((set, get) => ({
  tools: getTools(),
  categories: getCategories(),
  buildings: getBuildings(),
  reservations: getReservations(),
  adjustmentLogs: getAdjustmentLogs(),
  searchKeyword: '',
  selectedCategory: '',
  selectedBuilding: '',

  setSearchKeyword: (keyword: string) => set({ searchKeyword: keyword }),
  setSelectedCategory: (categoryId: string) => set({ selectedCategory: categoryId }),
  setSelectedBuilding: (buildingId: string) => set({ selectedBuilding: buildingId }),

  getFilteredTools: () => {
    const { tools, searchKeyword, selectedCategory, selectedBuilding } = get();
    return tools.filter((tool) => {
      const matchKeyword =
        !searchKeyword ||
        tool.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchKeyword.toLowerCase());
      const matchCategory = !selectedCategory || tool.categoryId === selectedCategory;
      const matchBuilding = !selectedBuilding || tool.buildingId === selectedBuilding;
      return matchKeyword && matchCategory && matchBuilding;
    });
  },

  getToolById: (id: string) => {
    return get().tools.find((tool) => tool.id === id);
  },

  getPopularTools: (limit: number = 6) => {
    return [...get().tools].sort((a, b) => b.borrowCount - a.borrowCount).slice(0, limit);
  },

  getAvailableSlots: (toolId: string, date: string) => {
    const slots: boolean[] = Array(14).fill(true);
    const { reservations, tools } = get();
    const { records } = useRecordStore.getState();
    const tool = tools.find((t) => t.id === toolId);
    const totalStock = tool?.totalStock || 1;
    const dateStr = formatDate(date);

    for (let slotIndex = 0; slotIndex < 14; slotIndex++) {
      const slotStartHour = 8 + slotIndex;
      const slotEndHour = slotStartHour + 1;
      const slotStartTime = parseISO(`${dateStr}T${String(slotStartHour).padStart(2, '0')}:00:00`);
      const slotEndTime = parseISO(`${dateStr}T${String(slotEndHour).padStart(2, '0')}:00:00`);

      let occupiedCount = 0;

      reservations
        .filter((r) => r.toolId === toolId && r.status !== 'cancelled')
        .forEach((r) => {
          const rStart = parseISO(r.startTime);
          const rEnd = parseISO(r.endTime);
          if (areIntervalsOverlapping({ start: slotStartTime, end: slotEndTime }, { start: rStart, end: rEnd })) {
            occupiedCount++;
          }
        });

      records
        .filter((r) => r.toolId === toolId && r.status === 'borrowed')
        .forEach((r) => {
          const rStart = parseISO(r.borrowTime);
          const rEnd = parseISO(r.expectedReturnTime);
          if (areIntervalsOverlapping({ start: slotStartTime, end: slotEndTime }, { start: rStart, end: rEnd })) {
            occupiedCount++;
          }
        });

      if (occupiedCount >= totalStock) {
        slots[slotIndex] = false;
      }
    }

    return slots;
  },

  createReservation: (
    userId: string,
    toolId: string,
    startTime: string,
    endTime: string,
    purpose: string
  ) => {
    const tool = get().getToolById(toolId);
    if (!tool || tool.availableStock <= 0) return null;

    const reservationId = generateId('RES');
    const newReservation: Reservation = {
      id: reservationId,
      userId,
      toolId,
      startTime,
      endTime,
      purpose,
      status: 'approved',
      qrCode: `${reservationId}-${userId}-${toolId}-${Date.now()}`,
      createdAt: getCurrentTimeISO(),
    };

    const reservations = [...get().reservations, newReservation];
    setReservations(reservations);
    set({ reservations });

    return newReservation;
  },

  cancelReservation: (reservationId: string) => {
    const reservations = get().reservations.map((r) =>
      r.id === reservationId ? { ...r, status: 'cancelled' as const } : r
    );
    setReservations(reservations);
    set({ reservations });
    return true;
  },

  approveReservation: (reservationId: string) => {
    const reservations = get().reservations.map((r) =>
      r.id === reservationId ? { ...r, status: 'approved' as const } : r
    );
    setReservations(reservations);
    set({ reservations });
  },

  updateToolStock: (toolId: string, delta: number) => {
    const tools = get().tools.map((t) =>
      t.id === toolId
        ? {
            ...t,
            availableStock: Math.max(0, t.availableStock + delta),
            borrowCount: delta < 0 ? t.borrowCount + 1 : t.borrowCount,
          }
        : t
    );
    setTools(tools);
    set({ tools });
  },

  getReservationsByUser: (userId: string) => {
    return get().reservations.filter((r) => r.userId === userId);
  },

  getReservationsByTool: (toolId: string) => {
    return get().reservations.filter((r) => r.toolId === toolId);
  },

  updateReservationStatus: (reservationId: string, status: Reservation['status']) => {
    const reservations = get().reservations.map((r) =>
      r.id === reservationId ? { ...r, status } : r
    );
    setReservations(reservations);
    set({ reservations });
  },

  isToolAvailable: (toolId: string, startTime: string, endTime: string) => {
    const { reservations, tools } = get();
    const { records } = useRecordStore.getState();
    const tool = tools.find((t) => t.id === toolId);
    if (!tool) return false;
    if (tool.availableStock <= 0) return false;

    const totalStock = tool.totalStock;
    const start = parseISO(startTime);
    const end = parseISO(endTime);

    const startHour = start.getHours();
    const endHour = end.getHours() === 0 ? 24 : end.getHours();
    const startDay = new Date(start).setHours(0, 0, 0, 0);
    const endDay = new Date(end).setHours(0, 0, 0, 0);
    const oneDay = 24 * 60 * 60 * 1000;

    for (let dayTs = startDay; dayTs <= endDay; dayTs += oneDay) {
      const dayDate = new Date(dayTs);
      const dayStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;

      const dayStartHour = dayTs === startDay ? Math.max(8, startHour) : 8;
      const dayEndHour = dayTs === endDay ? Math.min(22, endHour) : 22;

      for (let h = dayStartHour; h < dayEndHour; h++) {
        const slotStart = parseISO(`${dayStr}T${String(h).padStart(2, '0')}:00:00`);
        const slotEnd = parseISO(`${dayStr}T${String(h + 1).padStart(2, '0')}:00:00`);

        let occupiedCount = 0;

        reservations
          .filter((r) => r.toolId === toolId && r.status !== 'cancelled')
          .forEach((r) => {
            const rStart = parseISO(r.startTime);
            const rEnd = parseISO(r.endTime);
            if (areIntervalsOverlapping({ start: slotStart, end: slotEnd }, { start: rStart, end: rEnd })) {
              occupiedCount++;
            }
          });

        records
          .filter((r) => r.toolId === toolId && r.status === 'borrowed')
          .forEach((r) => {
            const rStart = parseISO(r.borrowTime);
            const rEnd = parseISO(r.expectedReturnTime);
            if (areIntervalsOverlapping({ start: slotStart, end: slotEnd }, { start: rStart, end: rEnd })) {
              occupiedCount++;
            }
          });

        if (occupiedCount >= totalStock) {
          return false;
        }
      }
    }

    return true;
  },

  addAdjustmentLog: (toolId, operatorId, operatorName, changes) => {
    const newLog: ToolAdjustmentLog = {
      id: generateId('ADJ'),
      toolId,
      operatorId,
      operatorName,
      changes,
      createdAt: getCurrentTimeISO(),
    };
    const logs = [...get().adjustmentLogs, newLog];
    setAdjustmentLogs(logs);
    set({ adjustmentLogs: logs });
    return newLog;
  },

  getAdjustmentLogsByTool: (toolId: string) => {
    return [...get().adjustmentLogs]
      .filter((l) => l.toolId === toolId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  updateTool: (toolId: string, updates: Partial<Tool>) => {
    const oldTool = get().tools.find((t) => t.id === toolId);
    if (!oldTool) return;

    const tools = get().tools.map((t) =>
      t.id === toolId ? { ...t, ...updates } : t
    );
    setTools(tools);
    set({ tools });

    const buildingMap: Record<string, string> = {};
    getBuildingsList().forEach((b) => {
      buildingMap[b.id] = b.name;
    });
    const labelMap: Record<string, string> = {
      buildingId: '所在楼栋',
      totalStock: '总库存',
      availableStock: '可用库存',
      name: '工具名称',
      specification: '规格',
      depositAmount: '押金金额',
      description: '描述',
      image: '图片',
      categoryId: '分类',
      location: '存放位置',
    };

    const changes: ToolAdjustmentLog['changes'] = [];
    Object.keys(updates).forEach((field) => {
      const key = field as keyof Tool;
      const oldVal = oldTool[key];
      const newVal = updates[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal) && oldVal !== undefined) {
        let displayOld: string | number = oldVal as string | number;
        let displayNew: string | number = newVal as string | number;
        if (field === 'buildingId') {
          displayOld = buildingMap[oldTool.buildingId] || oldTool.buildingId;
          displayNew = buildingMap[String(newVal)] || String(newVal);
        }
        changes.push({
          field,
          label: labelMap[field] || field,
          oldValue: displayOld,
          newValue: displayNew,
        });
      }
    });

    if (changes.length > 0) {
      const curUser = useRecordStore.getState().getCurrentUserState();
      if (curUser) {
        get().addAdjustmentLog(toolId, curUser.id, curUser.name, changes);
      }
    }
  },
}));
