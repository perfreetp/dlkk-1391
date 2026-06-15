import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  QrCode,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Users,
  Ban,
  CreditCard,
  ChevronRight,
  Upload,
  X,
  Calendar,
  MapPin,
  User,
  Phone,
  Settings,
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { StatusBadge } from '@/components/StatusBadge';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { LoginModal } from '@/components/LoginModal';
import { useAuthStore } from '@/store/authStore';
import { useRecordStore } from '@/store/recordStore';
import { useToolStore } from '@/store/toolStore';
import { formatDateTime, formatDateCN, isOverdue, isSoonDue } from '@/utils/date';
import type { BorrowRecord, BorrowStatus } from '@/types';

const statusFilters: { value: BorrowStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'borrowed', label: '借用中' },
  { value: 'returned', label: '已归还' },
  { value: 'damaged', label: '已损坏' },
  { value: 'lost', label: '已丢失' },
];

export const Records = () => {
  const { currentUser, users, toggleBlacklist } = useAuthStore();
  const {
    records,
    damageReports,
    borrowTool,
    returnTool,
    reportDamage,
    processDamageReport,
    getRecordsByUser,
    getOverdueRecords,
    getSoonDueRecords,
    getStatistics,
  } = useRecordStore();
  const { tools, buildings, categories, reservations, updateReservationStatus } = useToolStore();

  const [statusFilter, setStatusFilter] = useState<BorrowStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [showProcessDamageModal, setShowProcessDamageModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecord | null>(null);
  const [selectedDamageReport, setSelectedDamageReport] = useState<typeof damageReports[0] | null>(null);

  const [scanCode, setScanCode] = useState('');
  const [damageDescription, setDamageDescription] = useState('');
  const [damageImage, setDamageImage] = useState('');
  const [compensationAmount, setCompensationAmount] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  const statistics = getStatistics();
  const overdueRecords = getOverdueRecords();
  const soonDueRecords = getSoonDueRecords();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const filteredRecords = useMemo(() => {
    if (!currentUser) return [];

    const recordList = currentUser.role === 'admin' ? records : getRecordsByUser(currentUser.id);

    return recordList
      .filter((r) => {
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (searchTerm) {
          const tool = tools.find((t) => t.id === r.toolId);
          const user = users.find((u) => u.id === r.userId);
          const searchLower = searchTerm.toLowerCase();
          return (
            tool?.name.toLowerCase().includes(searchLower) ||
            user?.name.toLowerCase().includes(searchLower) ||
            r.id.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (a.status === 'borrowed' && b.status !== 'borrowed') return -1;
        if (b.status === 'borrowed' && a.status !== 'borrowed') return 1;
        if (a.status === 'borrowed' && b.status === 'borrowed') {
          const aOverdue = isOverdue(a.expectedReturnTime);
          const bOverdue = isOverdue(b.expectedReturnTime);
          if (aOverdue && !bOverdue) return -1;
          if (!aOverdue && bOverdue) return 1;
        }
        return new Date(b.borrowTime).getTime() - new Date(a.borrowTime).getTime();
      });
  }, [currentUser, records, statusFilter, searchTerm, tools, users, getRecordsByUser]);

  const getTool = (toolId: string) => tools.find((t) => t.id === toolId);
  const getUser = (userId: string) => users.find((u) => u.id === userId);
  const getBuilding = (buildingId: string) => buildings.find((b) => b.id === buildingId);

  const handleBorrow = () => {
    if (!scanCode) {
      showToast('请输入预约编号', 'error');
      return;
    }

    const reservation = reservations.find((r) => r.id === scanCode || r.qrCode === scanCode);
    if (!reservation) {
      showToast('未找到该预约记录', 'error');
      return;
    }

    if (reservation.status !== 'approved') {
      showToast('该预约未通过审核', 'error');
      return;
    }

    const record = borrowTool(
      reservation.id,
      reservation.userId,
      reservation.toolId,
      getTool(reservation.toolId)?.depositAmount || 0,
      reservation.endTime
    );

    if (record) {
      updateReservationStatus(reservation.id, 'completed');
      showToast('借出成功');
      setShowBorrowModal(false);
      setScanCode('');
    } else {
      showToast('借出失败，工具库存不足', 'error');
    }
  };

  const handleReturn = () => {
    if (!scanCode) {
      showToast('请输入借还编号', 'error');
      return;
    }

    const record = records.find(
      (r) => (r.id === scanCode || r.reservationId === scanCode) && r.status === 'borrowed'
    );
    if (!record) {
      showToast('未找到该借用记录', 'error');
      return;
    }

    setSelectedRecord(record);
    setShowReturnModal(true);
    setScanCode('');
  };

  const confirmReturn = (isDamaged: boolean) => {
    if (!selectedRecord) return;

    const success = returnTool(selectedRecord.id, isDamaged);
    if (success) {
      showToast(isDamaged ? '已标记损坏，请等待处理' : '归还成功，押金已退还');
      setShowReturnModal(false);
      setSelectedRecord(null);
    } else {
      showToast('归还失败', 'error');
    }
  };

  const handleReportDamage = (record: BorrowRecord) => {
    setSelectedRecord(record);
    setDamageDescription('');
    setDamageImage('');
    setShowDamageModal(true);
  };

  const submitDamageReport = () => {
    if (!selectedRecord || !damageDescription) {
      showToast('请填写损坏描述', 'error');
      return;
    }

    const report = reportDamage(
      selectedRecord.id,
      selectedRecord.userId,
      damageDescription,
      damageImage || 'https://picsum.photos/400/300?random=' + Date.now()
    );

    if (report) {
      showToast('损坏已上报，管理员会尽快处理');
      setShowDamageModal(false);
      setSelectedRecord(null);
      setDamageDescription('');
      setDamageImage('');
    }
  };

  const handleProcessDamage = (report: typeof damageReports[0]) => {
    setSelectedDamageReport(report);
    setCompensationAmount('');
    setShowProcessDamageModal(true);
  };

  const confirmProcessDamage = () => {
    if (!selectedDamageReport || !compensationAmount || Number(compensationAmount) <= 0) {
      showToast('请输入有效的赔付金额', 'error');
      return;
    }

    processDamageReport(selectedDamageReport.id, Number(compensationAmount));
    showToast('损坏处理完成，已从押金扣除赔付');
    setShowProcessDamageModal(false);
    setSelectedDamageReport(null);
    setCompensationAmount('');
  };

  const simulateImageUpload = () => {
    setDamageImage('https://picsum.photos/400/300?random=' + Date.now());
    showToast('图片上传成功');
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">请先登录</h2>
          <p className="text-gray-500 mb-6">登录后可查看您的借还记录</p>
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
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">借还记录</h1>
        <p className="text-gray-500">
          {currentUser.role === 'admin' ? '管理所有借还记录，查看统计数据' : '查看您的借用历史和当前借用'}
        </p>
      </div>

      {currentUser.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">工具总数</p>
                <p className="text-3xl font-bold text-gray-900">{statistics.totalTools}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">借用中</p>
                <p className="text-3xl font-bold text-blue-600">{statistics.totalBorrowed}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">逾期数量</p>
                <p className="text-3xl font-bold text-orange-600">{statistics.overdueCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">损坏数量</p>
                <p className="text-3xl font-bold text-red-600">{statistics.damageCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Ban className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {currentUser.role === 'admin' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-500" />
            今日工作台
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* 待取件 */}
            <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-blue-500" />
                  待取件
                </h4>
                <span className="px-2.5 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                  {reservations.filter((r) => r.status === 'approved').length}
                </span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {reservations
                  .filter((r) => r.status === 'approved')
                  .slice(0, 5)
                  .map((r) => {
                    const tool = getTool(r.toolId);
                    const user = getUser(r.userId);
                    return (
                      <div
                        key={r.id}
                        className="bg-white rounded-lg p-3 border border-blue-100 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start gap-2">
                          <img src={tool?.image} className="w-10 h-10 object-cover rounded-md" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{tool?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.name}</p>
                            <p className="text-xs text-blue-600">{formatDateCN(r.startTime)}</p>
                          </div>
                          <button
                            onClick={() => {
                              setScanCode(r.id);
                              setShowBorrowModal(true);
                            }}
                            className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md flex-shrink-0"
                          >
                            借出
                          </button>
                        </div>
                      </div>
                    );
                  })}
                {reservations.filter((r) => r.status === 'approved').length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-6">暂无待取件</p>
                )}
              </div>
            </div>

            {/* 待归还 */}
            <div className="border border-green-100 bg-green-50/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  今日待归还
                </h4>
                <span className="px-2.5 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                  {records.filter((r) => {
                    if (r.status !== 'borrowed') return false;
                    const today = new Date().toISOString().split('T')[0];
                    const expDate = r.expectedReturnTime.split('T')[0];
                    return expDate <= today && !isOverdue(r.expectedReturnTime);
                  }).length}
                </span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {records
                  .filter((r) => {
                    if (r.status !== 'borrowed') return false;
                    const today = new Date().toISOString().split('T')[0];
                    const expDate = r.expectedReturnTime.split('T')[0];
                    return expDate <= today && !isOverdue(r.expectedReturnTime);
                  })
                  .slice(0, 5)
                  .map((r) => {
                    const tool = getTool(r.toolId);
                    const user = getUser(r.userId);
                    return (
                      <div
                        key={r.id}
                        className="bg-white rounded-lg p-3 border border-green-100 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start gap-2">
                          <img src={tool?.image} className="w-10 h-10 object-cover rounded-md" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{tool?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.name}</p>
                            <p className="text-xs text-green-600">
                              应还：{formatDateCN(r.expectedReturnTime)}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedRecord(r);
                              setShowReturnModal(true);
                            }}
                            className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-md flex-shrink-0"
                          >
                            归还
                          </button>
                        </div>
                      </div>
                    );
                  })}
                {records.filter((r) => {
                    if (r.status !== 'borrowed') return false;
                    const today = new Date().toISOString().split('T')[0];
                    const expDate = r.expectedReturnTime.split('T')[0];
                    return expDate <= today && !isOverdue(r.expectedReturnTime);
                  }).length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-6">暂无今日待归还</p>
                )}
              </div>
            </div>

            {/* 逾期 */}
            <div className="border border-red-100 bg-red-50/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  逾期未还
                </h4>
                <span className="px-2.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {overdueRecords.length}
                </span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {overdueRecords.slice(0, 5).map((r) => {
                  const tool = getTool(r.toolId);
                  const user = getUser(r.userId);
                  return (
                    <div
                      key={r.id}
                      className="bg-white rounded-lg p-3 border border-red-100 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-2">
                        <img src={tool?.image} className="w-10 h-10 object-cover rounded-md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{tool?.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.name}</p>
                          <p className="text-xs text-red-600">
                            逾期：{formatDateCN(r.expectedReturnTime)}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedRecord(r);
                            setShowReturnModal(true);
                          }}
                          className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md flex-shrink-0"
                        >
                          催还
                        </button>
                      </div>
                    </div>
                  );
                })}
                {overdueRecords.length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-6">暂无逾期</p>
                )}
              </div>
            </div>

            {/* 损坏待处理 */}
            <div className="border border-orange-100 bg-orange-50/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Ban className="w-4 h-4 text-orange-500" />
                  损坏待处理
                </h4>
                <span className="px-2.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                  {damageReports.filter((d) => d.status === 'pending').length}
                </span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {damageReports
                  .filter((d) => d.status === 'pending')
                  .slice(0, 5)
                  .map((d) => {
                    const r = records.find((x) => x.id === d.recordId);
                    const tool = r ? getTool(r.toolId) : null;
                    const user = getUser(d.userId);
                    return (
                      <div
                        key={d.id}
                        className="bg-white rounded-lg p-3 border border-orange-100 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start gap-2">
                          <img src={d.image} className="w-10 h-10 object-cover rounded-md" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{tool?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.name}</p>
                            <p className="text-xs text-orange-600 truncate">{d.description}</p>
                          </div>
                          <button
                            onClick={() => handleProcessDamage(d)}
                            className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded-md flex-shrink-0"
                          >
                            处理
                          </button>
                        </div>
                      </div>
                    );
                  })}
                {damageReports.filter((d) => d.status === 'pending').length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-6">暂无损坏待处理</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {(overdueRecords.length > 0 || soonDueRecords.length > 0) && currentUser.role !== 'admin' && (
        <div className="mb-6 space-y-2">
          {overdueRecords.map((record) => {
            const tool = getTool(record.toolId);
            return (
              <div
                key={record.id}
                className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-red-700 font-medium">
                      【{tool?.name}】已逾期，请尽快归还
                    </p>
                    <p className="text-red-500 text-sm">
                      应归还时间：{formatDateTime(record.expectedReturnTime)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedRecord(record);
                    setShowReturnModal(true);
                  }}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg"
                >
                  立即归还
                </button>
              </div>
            );
          })}
          {soonDueRecords
            .filter((r) => !overdueRecords.some((o) => o.id === r.id))
            .map((record) => {
              const tool = getTool(record.toolId);
              return (
                <div
                  key={record.id}
                  className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3"
                >
                  <Clock className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="text-orange-700 font-medium">
                      【{tool?.name}】将在24小时内到期
                    </p>
                    <p className="text-orange-500 text-sm">
                      应归还时间：{formatDateTime(record.expectedReturnTime)}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {currentUser.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              热门工具排行
            </h3>
            {statistics.popularTools.length > 0 ? (
              <div className="space-y-3">
                {statistics.popularTools.map((item, index) => (
                  <div key={item.toolId} className="flex items-center gap-4">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? 'bg-yellow-100 text-yellow-600'
                          : index === 1
                          ? 'bg-gray-100 text-gray-600'
                          : index === 2
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="flex-1 text-gray-700">{item.toolName}</span>
                    <span className="text-primary-500 font-semibold">{item.count} 次</span>
                    <div className="w-32 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(item.count / (statistics.popularTools[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">暂无借用数据</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-500" />
              分类统计
            </h3>
            {statistics.categoryStats.length > 0 ? (
              <div className="space-y-3">
                {statistics.categoryStats.map((item) => (
                  <div key={item.categoryId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.categoryName}</span>
                      <span className="text-gray-900 font-medium">{item.count} 次</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{
                          width: `${(item.count / (statistics.categoryStats[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">暂无分类数据</p>
            )}
          </div>
        </div>
      )}

      {currentUser.role === 'admin' && damageReports.filter((d) => d.status === 'pending').length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            待处理损坏报告
          </h3>
          <div className="space-y-3">
            {damageReports
              .filter((d) => d.status === 'pending')
              .map((report) => {
                const user = getUser(report.userId);
                const record = records.find((r) => r.id === report.recordId);
                const tool = record ? getTool(record.toolId) : null;
                return (
                  <div
                    key={report.id}
                    className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={report.image}
                        alt="损坏图片"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {tool?.name} - {user?.name}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          上报时间：{formatDateTime(report.reportedAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleProcessDamage(report)}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg"
                    >
                      处理
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {currentUser.role === 'admin' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            用户管理
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">用户</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">房号</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">电话</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">逾期次数</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">损坏次数</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">押金余额</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter((u) => u.role === 'resident')
                  .map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                          <span className="text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{user.roomNumber}</td>
                      <td className="py-3 px-4 text-gray-600">{user.phone}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.overdueCount >= 3
                              ? 'bg-red-100 text-red-600'
                              : user.overdueCount > 0
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-green-100 text-green-600'
                          }`}
                        >
                          {user.overdueCount}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.damageCount >= 2
                              ? 'bg-red-100 text-red-600'
                              : user.damageCount > 0
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-green-100 text-green-600'
                          }`}
                        >
                          {user.damageCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 font-medium">
                        ¥{user.depositBalance}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleBlacklist(user.id)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            user.isBlacklisted
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          }`}
                        >
                          {user.isBlacklisted ? '黑名单' : '正常'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {currentUser.role === 'admin' && (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setScanCode('');
                    setShowBorrowModal(true);
                  }}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  扫码借出
                </button>
                <button
                  onClick={() => {
                    setScanCode('');
                    setShowReturnModal(true);
                  }}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  扫码归还
                </button>
              </div>
            )}
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={
                    currentUser.role === 'admin'
                      ? '搜索工具名称、用户姓名、记录编号'
                      : '搜索工具名称或记录编号'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      statusFilter === filter.value
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => {
              const tool = getTool(record.toolId);
              const user = getUser(record.userId);
              const building = tool ? getBuilding(tool.buildingId) : undefined;
              const recordOverdue = record.status === 'borrowed' && isOverdue(record.expectedReturnTime);
              const recordSoonDue =
                record.status === 'borrowed' && !recordOverdue && isSoonDue(record.expectedReturnTime);

              return (
                <div
                  key={record.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    recordOverdue ? 'bg-red-50/50' : recordSoonDue ? 'bg-orange-50/50' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <img
                      src={tool?.image}
                      alt={tool?.name}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 truncate">{tool?.name}</h4>
                          {currentUser.role === 'admin' && user && (
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {user.name} ({user.roomNumber})
                            </p>
                          )}
                        </div>
                        <StatusBadge status={record.status} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          借出：{formatDateCN(record.borrowTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          应还：{formatDateCN(record.expectedReturnTime)}
                        </span>
                        {record.actualReturnTime && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            实还：{formatDateCN(record.actualReturnTime)}
                          </span>
                        )}
                        {building && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {building.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5" />
                          押金：¥{record.depositAmount}
                        </span>
                      </div>
                      {recordOverdue && (
                        <p className="mt-2 text-sm text-red-600 font-medium">⚠️ 已逾期，请尽快归还</p>
                      )}
                      {recordSoonDue && (
                        <p className="mt-2 text-sm text-orange-600 font-medium">⏰ 即将到期，请按时归还</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {record.status === 'borrowed' && currentUser.role !== 'admin' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowReturnModal(true);
                            }}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg"
                          >
                            归还
                          </button>
                          <button
                            onClick={() => handleReportDamage(record)}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg"
                          >
                            损坏上报
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">暂无借还记录</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showBorrowModal} onClose={() => setShowBorrowModal(false)} size="md" title="扫码借出">
        <div className="p-6">
          <p className="text-gray-600 mb-4">请输入预约编号或扫描预约二维码</p>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">预约编号</label>
            <input
              type="text"
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              placeholder="例如：RES202401010001"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">提示：</span>
              演示数据可使用预约编号 RES001、RES002、RES003 进行测试
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBorrowModal(false)}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleBorrow}
              className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg"
            >
              确认借出
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} size="md" title="归还工具">
        <div className="p-6">
          {selectedRecord ? (
            <>
              {(() => {
                const tool = getTool(selectedRecord.toolId);
                const user = getUser(selectedRecord.userId);
                const recordOverdue = isOverdue(selectedRecord.expectedReturnTime);
                return (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <img src={tool?.image} alt="" className="w-16 h-16 object-cover rounded-lg" />
                      <div>
                        <h4 className="font-semibold text-gray-900">{tool?.name}</h4>
                        {currentUser.role === 'admin' && user && (
                          <p className="text-sm text-gray-500">
                            借用人：{user.name} ({user.roomNumber})
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          押金：¥{selectedRecord.depositAmount}
                        </p>
                      </div>
                    </div>
                    {recordOverdue && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-red-700 font-medium">⚠️ 该工具已逾期</p>
                        <p className="text-red-600 text-sm mt-1">
                          应归还时间：{formatDateTime(selectedRecord.expectedReturnTime)}
                        </p>
                      </div>
                    )}
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">借出时间</span>
                        <span className="text-gray-900">{formatDateTime(selectedRecord.borrowTime)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">应归还时间</span>
                        <span className="text-gray-900">{formatDateTime(selectedRecord.expectedReturnTime)}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">请确认工具是否完好无损</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => confirmReturn(false)}
                        className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg"
                      >
                        完好归还
                      </button>
                      <button
                        onClick={() => {
                          setShowReturnModal(false);
                          if (selectedRecord) {
                            setDamageDescription('');
                            setDamageImage('');
                            setShowDamageModal(true);
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg"
                      >
                        有损坏，去上报
                      </button>
                    </div>
                  </>
                );
              })()}
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-4">请输入借还记录编号</p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">记录编号</label>
                <input
                  type="text"
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  placeholder="例如：REC202401010001"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleReturn}
                  className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg"
                >
                  查询
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal isOpen={showDamageModal} onClose={() => setShowDamageModal(false)} size="md" title="损坏上报">
        <div className="p-6">
          {selectedRecord && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={getTool(selectedRecord.toolId)?.image}
                  alt=""
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {getTool(selectedRecord.toolId)?.name}
                  </h4>
                  <p className="text-sm text-gray-500">记录编号：{selectedRecord.id}</p>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">损坏描述 *</label>
                <textarea
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  placeholder="请详细描述工具的损坏情况..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">上传照片</label>
                {damageImage ? (
                  <div className="relative inline-block">
                    <img src={damageImage} alt="" className="w-32 h-32 object-cover rounded-lg" />
                    <button
                      onClick={() => setDamageImage('')}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={simulateImageUpload}
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-primary-500 hover:bg-primary-50/50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">点击上传照片（模拟）</span>
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDamageModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={submitDamageReport}
                  className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg"
                >
                  提交上报
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showProcessDamageModal}
        onClose={() => setShowProcessDamageModal(false)}
        size="md"
        title="处理损坏报告"
      >
        <div className="p-6">
          {selectedDamageReport && (
            <>
              <div className="flex items-start gap-4 mb-6">
                <img
                  src={selectedDamageReport.image}
                  alt=""
                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="text-gray-700 mb-2">{selectedDamageReport.description}</p>
                  <p className="text-sm text-gray-500">
                    上报人：{getUser(selectedDamageReport.userId)?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    上报时间：{formatDateTime(selectedDamageReport.reportedAt)}
                  </p>
                  {(() => {
                    const record = records.find((r) => r.id === selectedDamageReport.recordId);
                    return record ? (
                      <p className="text-sm text-gray-500 mt-1">
                        押金金额：<span className="text-primary-500 font-medium">¥{record.depositAmount}</span>
                      </p>
                    ) : null;
                  })()}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  赔付金额（元）*
                </label>
                <input
                  type="number"
                  value={compensationAmount}
                  onChange={(e) => setCompensationAmount(e.target.value)}
                  placeholder="请输入赔付金额"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
                <p className="text-sm text-gray-400 mt-2">
                  赔付金额将从用户押金中扣除，剩余部分自动退还
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowProcessDamageModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={confirmProcessDamage}
                  className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg"
                >
                  确认处理
                </button>
              </div>
            </>
          )}
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
