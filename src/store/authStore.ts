import { create } from 'zustand';
import type { User, DepositType } from '@/types';
import {
  getCurrentUser,
  setCurrentUser,
  getUsers,
  setUsers,
} from '@/utils/storage';
import { useRecordStore } from './recordStore';

interface AuthState {
  currentUser: User | null;
  users: User[];
  refresh: () => void;
  login: (phone: string, roomNumber?: string) => { success: boolean; message: string };
  loginAsAdmin: (username: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  updateDepositBalance: (userId: string, amount: number, type: DepositType, remark?: string) => void;
  toggleBlacklist: (userId: string) => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: getCurrentUser(),
  users: getUsers(),

  refresh: () => {
    set({
      currentUser: getCurrentUser(),
      users: getUsers(),
    });
  },

  login: (phone: string, roomNumber?: string) => {
    const users = useRecordStore.getState().getUsersState();
    const user = users.find(
      (u) => u.phone === phone && (!roomNumber || u.roomNumber === roomNumber)
    );

    if (!user) {
      return { success: false, message: '未找到用户，请检查手机号和房号' };
    }

    if (user.isBlacklisted) {
      return { success: false, message: '您已被列入黑名单，暂时无法使用' };
    }

    useRecordStore.getState().setCurrentUserState(user);
    setCurrentUser(user);
    set({ currentUser: user });

    return { success: true, message: '登录成功' };
  },

  loginAsAdmin: (username: string, password: string) => {
    const users = useRecordStore.getState().getUsersState();
    const admin = users.find(
      (u) => u.role === 'admin' && u.username === username && u.password === password
    );

    if (!admin) {
      return { success: false, message: '账号或密码错误' };
    }

    useRecordStore.getState().setCurrentUserState(admin);
    setCurrentUser(admin);
    set({ currentUser: admin });

    return { success: true, message: '登录成功' };
  },

  logout: () => {
    useRecordStore.getState().setCurrentUserState(null);
    setCurrentUser(null);
    set({ currentUser: null });
  },

  updateDepositBalance: (userId: string, amount: number, type: DepositType, remark?: string) => {
    useRecordStore.getState().addDeposit(userId, amount, type, remark);
    get().refresh();
  },

  toggleBlacklist: (userId: string) => {
    const users = useRecordStore.getState().getUsersState();
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const updatedUser = {
      ...user,
      isBlacklisted: !user.isBlacklisted,
    };
    useRecordStore.getState().updateUser(updatedUser);
    get().refresh();
  },

  updateUser: (updatedUser: User) => {
    useRecordStore.getState().updateUser(updatedUser);
    get().refresh();
  },
}));
