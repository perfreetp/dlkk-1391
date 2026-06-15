import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Wrench,
  ClipboardList,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRecordStore } from '@/store/recordStore';
import { LoginModal } from './LoginModal';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const { getOverdueRecords, getSoonDueRecords } = useRecordStore();
  const [showLogin, setShowLogin] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const overdueRecords = currentUser ? getOverdueRecords().filter((r) => r.userId === currentUser.id) : [];
  const soonDueRecords = currentUser ? getSoonDueRecords().filter((r) => r.userId === currentUser.id) : [];
  const hasAlert = overdueRecords.length > 0 || soonDueRecords.length > 0;

  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/tools', label: '工具目录', icon: Wrench },
    { path: '/records', label: '借还记录', icon: ClipboardList, requireAuth: true },
    { path: '/profile', label: '个人中心', icon: User, requireAuth: true },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.requireAuth && !currentUser) {
      setShowLogin(true);
      return;
    }
    navigate(item.path);
    setShowMobileMenu(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowMobileMenu(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Desktop Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">社区工具借用</h1>
                <p className="text-xs text-gray-500 hidden sm:block">共享工具 · 便捷生活</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* User Section */}
            <div className="flex items-center gap-3">
              {currentUser ? (
                <div className="hidden md:flex items-center gap-3">
                  {hasAlert && (
                    <div className="relative">
                      <Bell className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center animate-bounce-in">
                        {overdueRecords.length + soonDueRecords.length}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                      <p className="text-xs text-gray-500">
                        {currentUser.role === 'admin' ? '物业管理员' : currentUser.roomNumber}
                      </p>
                    </div>
                  </div>
                  {currentUser.isBlacklisted && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      黑名单
                    </span>
                  )}
                  <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="退出登录"
                  >
                    <LogOut className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="hidden md:block px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all hover:shadow-md active:scale-95"
                >
                  登录 / 注册
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {showMobileMenu ? (
                  <X className="w-6 h-6 text-gray-600" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-100 animate-slide-up">
            <div className="px-4 py-3 space-y-1">
              {currentUser && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-3">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{currentUser.name}</p>
                    <p className="text-sm text-gray-500">
                      {currentUser.role === 'admin' ? '物业管理员' : currentUser.roomNumber}
                    </p>
                  </div>
                </div>
              )}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item)}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-all ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              {currentUser ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">退出登录</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowLogin(true);
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center justify-center w-full px-4 py-3 bg-primary-500 text-white rounded-lg font-medium"
                >
                  登录 / 注册
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Alert Banner */}
      {currentUser && hasAlert && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-sm text-orange-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {overdueRecords.length > 0 && (
                <span className="font-medium">您有 {overdueRecords.length} 个工具已逾期，请尽快归还！</span>
              )}
              {soonDueRecords.length > 0 && !overdueRecords.length && (
                <span className="font-medium">您有 {soonDueRecords.length} 个工具将在24小时内到期，请及时归还。</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item)}
                className={`flex flex-col items-center justify-center gap-0.5 ${
                  isActive ? 'text-primary-600' : 'text-gray-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <footer className="hidden md:block bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>© 2026 社区工具借用平台 · 让共享更便捷</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-primary-600 transition-colors">使用协议</a>
              <a href="#" className="hover:text-primary-600 transition-colors">隐私政策</a>
              <a href="#" className="hover:text-primary-600 transition-colors">联系物业</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Bottom padding for mobile nav */}
      <div className="md:hidden h-16" />

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
};
