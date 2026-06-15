import { useState } from 'react';
import {
  User,
  Home,
  Phone,
  CreditCard,
  History,
  HelpCircle,
  LogOut,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Shield,
  Clock,
  Package,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { LoginModal } from '@/components/LoginModal';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuthStore } from '@/store/authStore';
import { useRecordStore } from '@/store/recordStore';
import { useToolStore } from '@/store/toolStore';
import { formatDateTime, formatDateCN, isOverdue } from '@/utils/date';
import { getNotices } from '@/utils/storage';
import type { Deposit } from '@/types';

export const Profile = () => {
  const { currentUser, login, logout, updateDepositBalance } = useAuthStore();
  const { getRecordsByUser, getDepositsByUser, getCompensationsByUser } = useRecordStore();
  const { tools, buildings, categories } = useToolStore();

  const [showLogin, setShowLogin] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'records' | 'deposit' | 'faq'>('info');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  const userRecords = currentUser ? getRecordsByUser(currentUser.id) : [];
  const userDeposits = currentUser ? getDepositsByUser(currentUser.id) : [];
  const userCompensations = currentUser ? getCompensationsByUser(currentUser.id) : [];
  const allNotices = getNotices();
  const faqList = allNotices.filter((n) => n.type === 'faq');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const getTool = (toolId: string) => tools.find((t) => t.id === toolId);
  const getBuilding = (buildingId: string) => buildings.find((b) => b.id === buildingId);
  const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);

  const handleRecharge = () => {
    if (!currentUser || !rechargeAmount || Number(rechargeAmount) <= 0) {
      showToast('请输入有效的充值金额', 'error');
      return;
    }

    updateDepositBalance(currentUser.id, Number(rechargeAmount), 'recharge', '押金充值');
    showToast(`成功充值 ¥${rechargeAmount}`);
    setShowRecharge(false);
    setRechargeAmount('');
  };

  const quickAmounts = [50, 100, 200, 500];

  const stats = currentUser
    ? {
        totalBorrowed: userRecords.length,
        currentlyBorrowing: userRecords.filter((r) => r.status === 'borrowed').length,
        overdueCount: userRecords.filter(
          (r) => r.status === 'borrowed' && isOverdue(r.expectedReturnTime)
        ).length,
        totalDeposit: currentUser.depositBalance,
      }
    : null;

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">请先登录</h2>
          <p className="text-gray-500 mb-6">登录后可查看您的个人信息和借用记录</p>
          <button
            onClick={() => setShowLogin(true)}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg"
          >
            立即登录
          </button>
        </div>
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
        {toast.show && (
          <div
            className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-20 h-20 rounded-full border-4 border-white/30 shadow-lg"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{currentUser.name}</h1>
                {currentUser.role === 'admin' && (
                  <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
                    管理员
                  </span>
                )}
                {currentUser.isBlacklisted && (
                  <span className="px-2 py-0.5 bg-red-500 rounded text-xs font-medium">
                    黑名单
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-white/80 text-sm">
                <span className="flex items-center gap-1">
                  <Home className="w-4 h-4" />
                  {currentUser.roomNumber}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {currentUser.phone}
                </span>
                <span className="flex items-center gap-1">
                  <CreditCard className="w-4 h-4" />
                  押金余额：<span className="text-white font-semibold">¥{currentUser.depositBalance}</span>
                </span>
              </div>
              {currentUser.isBlacklisted && (
                <div className="mt-3 bg-red-500/30 rounded-lg px-4 py-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">您已被列入黑名单，暂时无法借用工具，请联系物业处理</span>
                </div>
              )}
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              退出
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.totalBorrowed}</p>
              <p className="text-sm text-gray-500 mt-1">累计借用</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.currentlyBorrowing}</p>
              <p className="text-sm text-gray-500 mt-1">当前借用</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.overdueCount}</p>
              <p className="text-sm text-gray-500 mt-1">逾期次数</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-primary-500">¥{stats.totalDeposit}</p>
              <p className="text-sm text-gray-500 mt-1">押金余额</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-6 overflow-x-auto">
        {[
          { id: 'info', label: '个人信息', icon: User },
          { id: 'records', label: '借用记录', icon: History },
          { id: 'deposit', label: '押金管理', icon: CreditCard },
          { id: 'faq', label: '常见问题', icon: HelpCircle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 min-w-24 px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === 'info' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-500" />
              个人信息
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">姓名</p>
                    <p className="font-medium text-gray-900">{currentUser.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Home className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">房号</p>
                    <p className="font-medium text-gray-900">{currentUser.roomNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">手机号</p>
                    <p className="font-medium text-gray-900">{currentUser.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">用户状态</p>
                    <p className={`font-medium ${currentUser.isBlacklisted ? 'text-red-600' : 'text-green-600'}`}>
                      {currentUser.isBlacklisted ? '已列入黑名单' : '正常'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  信用记录
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-yellow-700">逾期次数：</span>
                    <span
                      className={`font-semibold ${
                        currentUser.overdueCount >= 3 ? 'text-red-600' : 'text-yellow-800'
                      }`}
                    >
                      {currentUser.overdueCount} 次
                    </span>
                    <p className="text-xs text-yellow-600 mt-1">逾期5次将自动加入黑名单</p>
                  </div>
                  <div>
                    <span className="text-yellow-700">损坏次数：</span>
                    <span
                      className={`font-semibold ${
                        currentUser.damageCount >= 2 ? 'text-red-600' : 'text-yellow-800'
                      }`}
                    >
                      {currentUser.damageCount} 次
                    </span>
                    <p className="text-xs text-yellow-600 mt-1">损坏3次将自动加入黑名单</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-primary-500" />
              我的借用记录
            </h2>
            {userRecords.length > 0 ? (
              <div className="space-y-4">
                {userRecords.map((record) => {
                  const tool = getTool(record.toolId);
                  const building = tool ? getBuilding(tool.buildingId) : undefined;
                  const category = tool ? getCategory(tool.categoryId) : undefined;
                  const recordOverdue =
                    record.status === 'borrowed' && isOverdue(record.expectedReturnTime);

                  return (
                    <div
                      key={record.id}
                      className={`border rounded-lg p-4 transition-colors hover:bg-gray-50 ${
                        recordOverdue ? 'border-red-200 bg-red-50/50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={tool?.image}
                          alt={tool?.name}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-gray-900 truncate">{tool?.name}</h4>
                            <StatusBadge status={record.status} />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                            {category && (
                              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                {category.name}
                              </span>
                            )}
                            {building && <span>{building.name}</span>}
                            <span>押金：¥{record.depositAmount}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              借出：{formatDateCN(record.borrowTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="w-3.5 h-3.5" />
                              应还：{formatDateCN(record.expectedReturnTime)}
                            </span>
                            {record.actualReturnTime && (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                实还：{formatDateCN(record.actualReturnTime)}
                              </span>
                            )}
                          </div>
                          {recordOverdue && (
                            <p className="mt-2 text-sm text-red-600 font-medium">
                              ⚠️ 已逾期，请尽快归还
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400">暂无借用记录</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'deposit' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-500" />
                押金管理
              </h2>
              <button
                onClick={() => setShowRecharge(true)}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                充值押金
              </button>
            </div>

            <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-600 mb-1">当前押金余额</p>
              <p className="text-4xl font-bold text-primary-600">¥{currentUser.depositBalance}</p>
              <p className="text-xs text-gray-500 mt-2">
                押金用于借用工具时抵扣，归还工具后自动退还
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  押金流水记录
                </h3>
                {userDeposits.length > 0 ? (
                  <div className="space-y-2">
                    {userDeposits.map((deposit: Deposit) => (
                      <div
                        key={deposit.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              deposit.type === 'recharge'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-orange-100 text-orange-600'
                            }`}
                          >
                            {deposit.type === 'recharge' ? (
                              <Plus className="w-4 h-4" />
                            ) : (
                              <ArrowDownLeft className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {deposit.type === 'recharge' ? '押金充值' : '押金退还'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {deposit.remark || formatDateTime(deposit.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-semibold ${
                            deposit.type === 'recharge' ? 'text-green-600' : 'text-orange-600'
                          }`}
                        >
                          {deposit.type === 'recharge' ? '+' : '-'}¥{deposit.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">暂无押金流水</p>
                  </div>
                )}
              </div>

              {userCompensations.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    赔付记录
                  </h3>
                  <div className="space-y-2">
                    {userCompensations.map((compensation) => (
                      <div
                        key={compensation.id}
                        className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 text-sm">工具损坏赔付</p>
                          <p className="text-xs text-gray-500">{compensation.reason}</p>
                          <p className="text-xs text-gray-400">
                            {formatDateTime(compensation.createdAt)}
                          </p>
                        </div>
                        <span className="font-semibold text-red-600">-¥{compensation.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary-500" />
              常见问题
            </h2>
            <div className="space-y-3">
              {faqList.map((faq) => (
                <div
                  key={faq.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                    }
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900 pr-4">{faq.title}</span>
                    {expandedFaq === faq.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="px-4 pb-4 text-gray-600 text-sm border-t border-gray-100 pt-3">
                      {faq.content.split('\n').map((line, index) => (
                        <p key={index} className={index > 0 ? 'mt-2' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">需要更多帮助？</h3>
              <p className="text-sm text-blue-700">
                如有其他问题，请联系物业前台：
              </p>
              <p className="text-blue-600 font-semibold mt-1">📞 400-123-4567</p>
              <p className="text-blue-600 font-semibold">⏰ 工作时间：8:00 - 20:00</p>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showRecharge} onClose={() => setShowRecharge(false)} size="sm" title="押金充值">
        <div className="p-6">
          <p className="text-gray-600 mb-4">选择或输入充值金额</p>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => setRechargeAmount(String(amount))}
                className={`py-3 rounded-lg font-medium transition-colors ${
                  rechargeAmount === String(amount)
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ¥{amount}
              </button>
            ))}
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">自定义金额</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                ¥
              </span>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="请输入充值金额"
                min="1"
                step="1"
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg mb-6">
            <p className="text-xs text-yellow-700">
              <span className="font-medium">温馨提示：</span>
              押金用于借用工具时抵扣，归还工具后自动退还，可随时申请提现
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowRecharge(false)}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleRecharge}
              className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg"
            >
              确认充值
            </button>
          </div>
        </div>
      </Modal>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

      {toast.show && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};
