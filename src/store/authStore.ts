import { create } from 'zustand';
import type { User, DepositType } from '@/types';
import {
  getUsers,
  setUsers,
  getCurrentUser,
  setCurrentUser,
  getDeposits,
  setDeposits,
  generateId,
} from '@/utils/storage';
import { getCurrentTimeISO } from '@/utils/date';

interface AuthState {
  currentUser: User | null;
  users: User[];
  login: (phone: string, roomNumber?: string) => { success: boolean; message: string };
  loginAsAdmin: (username: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  updateUser: (user: User) => void;
  updateDepositBalance: (userId: string, amount: number, type: DepositType, remark?: string) => void;
  toggleBlacklist: (userId: string) => void;
  checkBlacklist: (userId: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: getCurrentUser(),
  users: getUsers(),

  login: (phone: string, roomNumber?: string) => {
    const users = getUsers();
    let user = users.find((u) => u.phone === phone);

    if (!user) {
      const newUser: User = {
        id: generateId('U'),
        name: `居民${phone.slice(-4)}`,
        phone,
        roomNumber: roomNumber || '未填写',
        role: 'resident',
        isBlacklisted: false,
        depositBalance: 0,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`,
        overdueCount: 0,
        damageCount: 0,
      };
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      setCurrentUser(newUser);
      set({ currentUser: newUser, users: updatedUsers });
      return { success: true, message: '注册成功并已登录' };
    }

    if (roomNumber && user.roomNumber !== roomNumber) {
      user.roomNumber = roomNumber;
      const updatedUsers = users.map((u) => (u.id === user!.id ? user! : u));
      setUsers(updatedUsers);
      set({ users: updatedUsers });
    }

    if (user.isBlacklisted) {
      return { success: false, message: '您已被列入黑名单，无法登录' };
    }

    setCurrentUser(user);
    set({ currentUser: user });
    return { success: true, message: '登录成功' };
  },

  loginAsAdmin: (username: string, password: string) => {
    if (username === 'admin' && password === 'admin123') {
      const users = getUsers();
      const admin = users.find((u) => u.role === 'admin');
      if (admin) {
        setCurrentUser(admin);
        set({ currentUser: admin });
        return { success: true, message: '管理员登录成功' };
      }
    }
    return { success: false, message: '用户名或密码错误' };
  },

  logout: () => {
    setCurrentUser(null);
    set({ currentUser: null });
  },

  updateUser: (updatedUser: User) => {
    const users = getUsers();
    const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updatedUsers);
    if (get().currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      set({ currentUser: updatedUser, users: updatedUsers });
    } else {
      set({ users: updatedUsers });
    }
  },

  updateDepositBalance: (userId: string, amount: number, type: DepositType, remark?: string) => {
    const users = getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    let newBalance = user.depositBalance;
    if (type === 'recharge') newBalance = user.depositBalance + amount;
    else if (type === 'freeze') newBalance = user.depositBalance - amount;
    else if (type === 'unfreeze') newBalance = user.depositBalance + amount;
    else if (type === 'refund') newBalance = user.depositBalance + amount;

    const updatedUser = { ...user, depositBalance: newBalance };
    const updatedUsers = users.map((u) => (u.id === userId ? updatedUser : u));
    setUsers(updatedUsers);

    const deposits = getDeposits();
    const newDeposit = {
      id: generateId('DEP'),
      userId,
      amount,
      type,
      status: 'success' as const,
      createdAt: getCurrentTimeISO(),
      remark,
    };
    const updatedDeposits = [...deposits, newDeposit];
    setDeposits(updatedDeposits);

    if (get().currentUser?.id === userId) {
      setCurrentUser(updatedUser);
      set({ currentUser: updatedUser, users: updatedUsers });
    } else {
      set({ users: updatedUsers });
    }
  },

  toggleBlacklist: (userId: string) => {
    const users = getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const updatedUser = { ...user, isBlacklisted: !user.isBlacklisted };
    const updatedUsers = users.map((u) => (u.id === userId ? updatedUser : u));
    setUsers(updatedUsers);
    set({ users: updatedUsers });
  },

  checkBlacklist: (userId: string) => {
    const users = getUsers();
    const user = users.find((u) => u.id === userId);
    return user?.isBlacklisted || false;
  },
}));
