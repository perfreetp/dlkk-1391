import {
  format,
  parseISO,
  addDays,
  differenceInHours,
  differenceInDays,
  isBefore,
  isAfter,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatDate = (dateStr: string, pattern: string = 'yyyy-MM-dd'): string => {
  try {
    return format(parseISO(dateStr), pattern, { locale: zhCN });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string): string => {
  return formatDate(dateStr, 'yyyy-MM-dd HH:mm');
};

export const formatDateCN = (dateStr: string): string => {
  return formatDate(dateStr, 'yyyy年MM月dd日');
};

export const addDaysToDate = (dateStr: string, days: number): string => {
  return addDays(parseISO(dateStr), days).toISOString();
};

export const getHoursUntil = (dateStr: string): number => {
  return differenceInHours(parseISO(dateStr), new Date());
};

export const getDaysUntil = (dateStr: string): number => {
  return differenceInDays(parseISO(dateStr), new Date());
};

export const isOverdue = (expectedReturnTime: string): boolean => {
  return isBefore(parseISO(expectedReturnTime), new Date());
};

export const isSoonDue = (expectedReturnTime: string, hours: number = 24): boolean => {
  const now = new Date();
  const target = parseISO(expectedReturnTime);
  return isAfter(target, now) && differenceInHours(target, now) <= hours;
};

export const getTodayDateString = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const getCurrentTimeISO = (): string => {
  return new Date().toISOString();
};

export const getMaxEndDate = (startDate: string, maxDays: number): string => {
  return addDays(parseISO(startDate), maxDays - 1).toISOString();
};

export const getBorrowDuration = (startTime: string, endTime: string): number => {
  return Math.ceil(differenceInDays(parseISO(endTime), parseISO(startTime))) + 1;
};
