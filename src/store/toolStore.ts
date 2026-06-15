import { create } from 'zustand';
import type { Tool, ToolCategory, Building, Reservation } from '@/types';
import {
  getTools,
  setTools,
  getCategories,
  getBuildings,
  getReservations,
  setReservations,
  generateId,
} from '@/utils/storage';
import { getCurrentTimeISO, formatDate } from '@/utils/date';

interface ToolState {
  tools: Tool[];
  categories: ToolCategory[];
  buildings: Building[];
  reservations: Reservation[];
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
}

export const useToolStore = create<ToolState>((set, get) => ({
  tools: getTools(),
  categories: getCategories(),
  buildings: getBuildings(),
  reservations: getReservations(),
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
    const { reservations } = get();
    const dateStr = formatDate(date);

    reservations
      .filter((r) => r.toolId === toolId && r.status !== 'cancelled')
      .forEach((r) => {
        const startDate = formatDate(r.startTime);
        const endDate = formatDate(r.endTime);
        if (dateStr >= startDate && dateStr <= endDate) {
          slots.fill(false);
        }
      });

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
}));
