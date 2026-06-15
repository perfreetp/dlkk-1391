import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Package,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  ChevronRight,
  Info,
  User,
  Phone,
  Home,
} from 'lucide-react';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { Modal } from '@/components/Modal';
import { useToolStore } from '@/store/toolStore';
import { useAuthStore } from '@/store/authStore';
import { useRecordStore } from '@/store/recordStore';
import { formatDateCN, formatDateTime, getTodayDateString, getMaxEndDate, getBorrowDuration } from '@/utils/date';
import { LoginModal } from '@/components/LoginModal';
import type { Reservation } from '@/types';

export const Reserve = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const { getToolById, createReservation, buildings, categories } = useToolStore();
  const { currentUser, updateDepositBalance } = useAuthStore();
  const { borrowTool } = useRecordStore();

  const [step, setStep] = useState<number>(1);
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [purpose, setPurpose] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdReservation, setCreatedReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState('');

  const tool = toolId ? getToolById(toolId) : undefined;
  const building = tool ? buildings.find((b) => b.id === tool.buildingId) : undefined;
  const category = tool ? categories.find((c) => c.id === tool.categoryId) : undefined;

  const maxEndDate = tool ? getMaxEndDate(startDate, tool.maxBorrowDays) : '';

  useEffect(() => {
    if (tool && !endDate) {
      setEndDate(getTodayDateString());
    }
  }, [tool, endDate]);

  if (!tool) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">工具不存在</h2>
        <p className="text-gray-500 mb-4">您访问的工具可能已被删除或不存在</p>
        <button
          onClick={() => navigate('/tools')}
          className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg"
        >
          返回工具目录
        </button>
      </div>
    );
  }

  const borrowDays = getBorrowDuration(
    `${startDate}T${startTime}:00`,
    `${endDate}T${endTime}:00`
  );
  const totalDeposit = tool.depositAmount;
  const canAfford = currentUser && currentUser.depositBalance >= totalDeposit;

  const handleNext = () => {
    setError('');

    if (!currentUser) {
      setShowLogin(true);
      return;
    }

    if (currentUser.isBlacklisted) {
      setError('您已被列入黑名单，无法预约工具');
      return;
    }

    if (step === 1) {
      if (!startDate || !endDate) {
        setError('请选择借用起止日期');
        return;
      }
      if (new Date(endDate) < new Date(startDate)) {
        setError('归还日期不能早于借用日期');
        return;
      }
      if (borrowDays > tool.maxBorrowDays) {
        setError(`最长借用期限为 ${tool.maxBorrowDays} 天`);
        return;
      }
      if (!purpose.trim()) {
        setError('请填写借用事由');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!agreeTerms) {
        setError('请阅读并同意借用须知');
        return;
      }
      if (!canAfford) {
        setError(`押金余额不足，请先充值。当前余额: ¥${currentUser?.depositBalance || 0}`);
        return;
      }
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!currentUser) return;

    const startTimeISO = `${startDate}T${startTime}:00`;
    const endTimeISO = `${endDate}T${endTime}:00`;

    const reservation = createReservation(
      currentUser.id,
      tool.id,
      startTimeISO,
      endTimeISO,
      purpose
    );

    if (reservation) {
      updateDepositBalance(currentUser.id, totalDeposit, 'recharge', `预约${tool.name}押金`);
      setCreatedReservation(reservation);
      setShowSuccess(true);
    } else {
      setError('预约失败，工具可能已无库存');
    }
  };

  const handleBorrowNow = () => {
    if (!currentUser || !createdReservation) return;

    const expectedReturnTime = `${endDate}T${endTime}:00`;
    borrowTool(
      createdReservation.id,
      currentUser.id,
      tool.id,
      totalDeposit,
      expectedReturnTime
    );

    navigate('/records');
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/tools')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">预约工具</h1>
          <p className="text-sm text-gray-500">填写信息完成预约</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center mb-8 bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
          </div>
          <span className={`font-medium ${step >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
            填写信息
          </span>
        </div>
        <div className="w-16 h-0.5 bg-gray-200 mx-2">
          <div
            className={`h-full bg-primary-500 transition-all ${step >= 2 ? 'w-full' : 'w-0'}`}
          />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            2
          </div>
          <span className={`font-medium ${step >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
            确认预约
          </span>
        </div>
      </div>

      {/* Tool Info Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="flex gap-4 p-4">
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
            <img src={tool.image} alt={tool.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">{tool.name}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{tool.description}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
              <span className="flex items-center gap-1 text-gray-500">
                <Package className="w-4 h-4" />
                库存: {tool.availableStock}/{tool.totalStock}
              </span>
              <span className="flex items-center gap-1 text-gray-500">
                <MapPin className="w-4 h-4" />
                {building?.name}
              </span>
              <span className="flex items-center gap-1 text-gray-500">
                <Calendar className="w-4 h-4" />
                最长{tool.maxBorrowDays}天
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Form */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">借用信息</h3>

          {/* User Info Preview */}
          {currentUser ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">预约人信息</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{currentUser.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{currentUser.phone}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Home className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{currentUser.roomNumber}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800">请先登录</p>
                  <p className="text-sm text-orange-600 mt-1">登录后才能提交预约申请</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                借用日期 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (new Date(e.target.value) > new Date(endDate)) {
                      setEndDate(e.target.value);
                    }
                  }}
                  min={getTodayDateString()}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                归还日期 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={maxEndDate}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                最长可借至 {formatDateCN(maxEndDate)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                取件时间 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                    <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                      {hour.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                归还时间 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                    <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                      {hour.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              借用事由 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="请简要说明借用用途，如：安装家具、打扫卫生等"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{purpose.length}/200</p>
          </div>

          {/* Duration & Deposit Preview */}
          <div className="p-4 bg-primary-50 border border-primary-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-700">
                  借用时长: <span className="font-semibold">{borrowDays} 天</span>
                </p>
                <p className="text-xs text-primary-600 mt-1">
                  {formatDateCN(startDate)} {startTime} ~ {formatDateCN(endDate)} {endTime}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">需支付押金</p>
                <p className="text-2xl font-bold text-primary-600">¥{totalDeposit}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg active:scale-98 flex items-center justify-center gap-2"
          >
            下一步
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">确认预约信息</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-1">借用工具</p>
                <p className="font-medium text-gray-900">{tool.name}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-1">工具分类</p>
                <p className="font-medium text-gray-900">{category?.name}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-1">取件时间</p>
                <p className="font-medium text-gray-900">
                  {formatDateCN(startDate)} {startTime}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-1">归还时间</p>
                <p className="font-medium text-gray-900">
                  {formatDateCN(endDate)} {endTime}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-1">借用时长</p>
                <p className="font-medium text-gray-900">{borrowDays} 天</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-1">取件地点</p>
                <p className="font-medium text-gray-900">{building?.name}物业服务台</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">借用事由</p>
              <p className="text-sm text-gray-900">{purpose}</p>
            </div>
          </div>

          {/* Deposit Info */}
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-orange-800">押金支付</p>
                  <p className="text-xl font-bold text-orange-600">¥{totalDeposit}</p>
                </div>
                <p className="text-sm text-orange-600">
                  当前余额: ¥{currentUser?.depositBalance || 0}
                  {!canAfford && (
                    <span className="text-red-500 ml-2">(余额不足，请先充值)</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-800 mb-2">借用须知</p>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• 请在预约时间内取件，逾期24小时未取预约将自动取消</li>
                  <li>• 按时归还，逾期将产生每天押金10%的滞纳金</li>
                  <li>• 工具损坏需照价赔偿，严重损坏将被列入黑名单</li>
                  <li>• 归还时请保持工具清洁完好</li>
                </ul>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600">
              我已阅读并同意以上《借用须知》及《社区工具借用管理规定》
            </span>
          </label>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
            >
              上一步
            </button>
            <button
              onClick={handleNext}
              disabled={!agreeTerms || !canAfford}
              className={`flex-1 py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                agreeTerms && canAfford
                  ? 'bg-primary-500 hover:bg-primary-600 text-white hover:shadow-lg active:scale-98'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              确认预约并支付押金
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title="预约成功" size="md">
        {createdReservation && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce-in">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">预约成功！</h3>
              <p className="text-gray-500 mt-2">请在预约时间内到物业前台取件</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">预约编号</span>
                <span className="font-mono font-medium">{createdReservation.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">工具名称</span>
                <span className="font-medium">{tool.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">取件时间</span>
                <span className="font-medium">{formatDateTime(createdReservation.startTime)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">取件地点</span>
                <span className="font-medium">{building?.name}物业服务台</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-500">支付押金</span>
                <span className="font-bold text-primary-600">¥{totalDeposit}</span>
              </div>
            </div>

            <QRCodeDisplay value={createdReservation.qrCode} size={160} />

            <p className="text-sm text-gray-500">
              请出示此二维码或预约编号给物业工作人员扫码取件
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/records')}
                className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
              >
                查看记录
              </button>
              <button
                onClick={handleBorrowNow}
                className="py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all"
              >
                立即借出
              </button>
            </div>
          </div>
        )}
      </Modal>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
};
