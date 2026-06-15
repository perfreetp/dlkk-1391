import { useState } from 'react';
import { Phone, Home, Lock, User, X } from 'lucide-react';
import { Modal } from './Modal';
import { useAuthStore } from '@/store/authStore';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const [loginType, setLoginType] = useState<'resident' | 'admin'>('resident');
  const [phone, setPhone] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loginAsAdmin } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (loginType === 'resident') {
      if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        setError('请输入有效的手机号码');
        return;
      }
      if (!roomNumber) {
        setError('请输入您的房号');
        return;
      }
      const result = login(phone, roomNumber);
      if (result.success) {
        onClose();
        setPhone('');
        setRoomNumber('');
      } else {
        setError(result.message);
      }
    } else {
      if (!username || !password) {
        setError('请输入用户名和密码');
        return;
      }
      const result = loginAsAdmin(username, password);
      if (result.success) {
        onClose();
        setUsername('');
        setPassword('');
      } else {
        setError(result.message);
      }
    }
  };

  const handleDemoLogin = (demoType: 'resident' | 'admin') => {
    setError('');
    if (demoType === 'resident') {
      const result = login('13800138001', '1号楼1单元101室');
      if (result.success) onClose();
      else setError(result.message);
    } else {
      const result = loginAsAdmin('admin', 'admin123');
      if (result.success) onClose();
      else setError(result.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="登录" size="sm">
      <div className="space-y-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              loginType === 'resident'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setLoginType('resident')}
          >
            居民登录
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              loginType === 'admin'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setLoginType('admin')}
          >
            物业管理员
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loginType === 'resident' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  手机号码
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号码"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    maxLength={11}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  房号
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="例如：1号楼1单元101室"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                首次输入手机号将自动注册，请确保信息准确
              </p>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  用户名
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-all hover:shadow-md active:scale-98"
          >
            {loginType === 'resident' ? '登录 / 注册' : '登录'}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-3 text-center">演示账号快速登录</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('resident')}
              className="py-2 px-3 text-sm bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
            >
              居民：张三
            </button>
            <button
              onClick={() => handleDemoLogin('admin')}
              className="py-2 px-3 text-sm bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
            >
              管理员
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
