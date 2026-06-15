import type {
  User,
  Tool,
  ToolCategory,
  Building,
  Reservation,
  BorrowRecord,
  DamageReport,
  Deposit,
  Compensation,
  Notice,
} from '@/types';
import { mockCategories } from '@/data/mockCategories';
import { mockBuildings } from '@/data/mockBuildings';
import { mockTools } from '@/data/mockTools';
import { mockUsers } from '@/data/mockUsers';
import { mockNotices } from '@/data/mockNotices';
import { mockReservations } from '@/data/mockReservations';
import {
  mockRecords,
  mockDamageReports,
  mockDeposits,
  mockCompensations,
} from '@/data/mockRecords';

const STORAGE_KEYS = {
  users: 'tool_platform_users',
  tools: 'tool_platform_tools',
  categories: 'tool_platform_categories',
  buildings: 'tool_platform_buildings',
  reservations: 'tool_platform_reservations',
  records: 'tool_platform_records',
  damageReports: 'tool_platform_damage_reports',
  deposits: 'tool_platform_deposits',
  compensations: 'tool_platform_compensations',
  notices: 'tool_platform_notices',
  currentUser: 'tool_platform_current_user',
};

export const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.categories)) {
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(mockCategories));
  }
  if (!localStorage.getItem(STORAGE_KEYS.buildings)) {
    localStorage.setItem(STORAGE_KEYS.buildings, JSON.stringify(mockBuildings));
  }
  if (!localStorage.getItem(STORAGE_KEYS.tools)) {
    localStorage.setItem(STORAGE_KEYS.tools, JSON.stringify(mockTools));
  }
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(mockUsers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.notices)) {
    localStorage.setItem(STORAGE_KEYS.notices, JSON.stringify(mockNotices));
  }
  if (!localStorage.getItem(STORAGE_KEYS.reservations)) {
    localStorage.setItem(STORAGE_KEYS.reservations, JSON.stringify(mockReservations));
  }
  if (!localStorage.getItem(STORAGE_KEYS.records)) {
    localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(mockRecords));
  }
  if (!localStorage.getItem(STORAGE_KEYS.damageReports)) {
    localStorage.setItem(STORAGE_KEYS.damageReports, JSON.stringify(mockDamageReports));
  }
  if (!localStorage.getItem(STORAGE_KEYS.deposits)) {
    localStorage.setItem(STORAGE_KEYS.deposits, JSON.stringify(mockDeposits));
  }
  if (!localStorage.getItem(STORAGE_KEYS.compensations)) {
    localStorage.setItem(STORAGE_KEYS.compensations, JSON.stringify(mockCompensations));
  }
};

initializeData();

export const getFromStorage = <T>(key: string): T => {
  const data = localStorage.getItem(key);
  return (data ? JSON.parse(data) : []) as T;
};

export const setToStorage = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const getUsers = (): User[] => getFromStorage<User[]>(STORAGE_KEYS.users);
export const setUsers = (users: User[]) => setToStorage(STORAGE_KEYS.users, users);

export const getTools = (): Tool[] => getFromStorage<Tool[]>(STORAGE_KEYS.tools);
export const setTools = (tools: Tool[]) => setToStorage(STORAGE_KEYS.tools, tools);

export const getCategories = (): ToolCategory[] =>
  getFromStorage<ToolCategory[]>(STORAGE_KEYS.categories);

export const getBuildings = (): Building[] =>
  getFromStorage<Building[]>(STORAGE_KEYS.buildings);

export const getReservations = (): Reservation[] =>
  getFromStorage<Reservation[]>(STORAGE_KEYS.reservations);
export const setReservations = (reservations: Reservation[]) =>
  setToStorage(STORAGE_KEYS.reservations, reservations);

export const getRecords = (): BorrowRecord[] =>
  getFromStorage<BorrowRecord[]>(STORAGE_KEYS.records);
export const setRecords = (records: BorrowRecord[]) =>
  setToStorage(STORAGE_KEYS.records, records);

export const getDamageReports = (): DamageReport[] =>
  getFromStorage<DamageReport[]>(STORAGE_KEYS.damageReports);
export const setDamageReports = (reports: DamageReport[]) =>
  setToStorage(STORAGE_KEYS.damageReports, reports);

export const getDeposits = (): Deposit[] => getFromStorage<Deposit[]>(STORAGE_KEYS.deposits);
export const setDeposits = (deposits: Deposit[]) => setToStorage(STORAGE_KEYS.deposits, deposits);

export const getCompensations = (): Compensation[] =>
  getFromStorage<Compensation[]>(STORAGE_KEYS.compensations);
export const setCompensations = (compensations: Compensation[]) =>
  setToStorage(STORAGE_KEYS.compensations, compensations);

export const getNotices = (): Notice[] => getFromStorage<Notice[]>(STORAGE_KEYS.notices);

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.currentUser);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }
};

export const generateId = (prefix: string): string => {
  return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
};
