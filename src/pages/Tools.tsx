import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Building2,
  Grid3X3,
  X,
  Package,
  Calendar,
  MapPin,
  Clock,
  ShieldAlert,
  ChevronRight,
  Eye,
  QrCode,
  Settings,
  Save,
} from 'lucide-react';
import { ToolCard } from '@/components/ToolCard';
import { Modal } from '@/components/Modal';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { useToolStore } from '@/store/toolStore';
import { useAuthStore } from '@/store/authStore';
import { formatDateCN, getTodayDateString } from '@/utils/date';
import type { Tool } from '@/types';

export const Tools = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toolIdParam = searchParams.get('tool');

  const {
    tools,
    categories,
    buildings,
    searchKeyword,
    selectedCategory,
    selectedBuilding,
    setSearchKeyword,
    setSelectedCategory,
    setSelectedBuilding,
    getFilteredTools,
    getToolById,
    getAvailableSlots,
    updateTool,
    getAdjustmentLogsByTool,
  } = useToolStore();
  const { currentUser } = useAuthStore();

  const [searchInput, setSearchInput] = useState(searchKeyword);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustBuildingId, setAdjustBuildingId] = useState('');
  const [adjustTotalStock, setAdjustTotalStock] = useState('');
  const [adjustAvailableStock, setAdjustAvailableStock] = useState('');
  const [adjustToast, setAdjustToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  const filteredTools = getFilteredTools();

  useEffect(() => {
    if (toolIdParam) {
      const tool = getToolById(toolIdParam);
      if (tool) {
        setSelectedTool(tool);
      }
    }
  }, [toolIdParam, getToolById]);

  useEffect(() => {
    setSearchInput(searchKeyword);
  }, [searchKeyword]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchKeyword(searchInput);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchKeyword('');
    setSelectedCategory('');
    setSelectedBuilding('');
  };

  const handleReserve = (tool: Tool) => {
    setSelectedTool(null);
    navigate(`/reserve/${tool.id}`);
  };

  const openAdjustModal = (tool: Tool) => {
    setAdjustBuildingId(tool.buildingId);
    setAdjustTotalStock(String(tool.totalStock));
    setAdjustAvailableStock(String(tool.availableStock));
    setShowAdjustModal(true);
  };

  const handleAdjustSave = () => {
    if (!selectedTool) return;
    const total = Number(adjustTotalStock);
    const available = Number(adjustAvailableStock);
    if (total <= 0 || available < 0 || available > total) {
      setAdjustToast({ show: true, message: '库存数量不合理，可用数量不能超过总数且不能为负', type: 'error' });
      setTimeout(() => setAdjustToast({ show: false, message: '', type: 'success' }), 3000);
      return;
    }
    updateTool(selectedTool.id, {
      buildingId: adjustBuildingId,
      totalStock: total,
      availableStock: available,
    });
    setSelectedTool(null);
    setShowAdjustModal(false);
    setAdjustToast({ show: true, message: '工具调配成功', type: 'success' });
    setTimeout(() => setAdjustToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || '未知分类';
  };

  const getBuildingName = (buildingId: string) => {
    return buildings.find((b) => b.id === buildingId)?.name || '未知楼栋';
  };

  const availableSlots = selectedTool ? getAvailableSlots(selectedTool.id, selectedDate) : [];
  const isAvailableToday = availableSlots.some((slot) => slot);

  const timeSlots = Array.from({ length: 14 }, (_, i) => `${i + 8}:00`);

  const hasActiveFilters = searchKeyword || selectedCategory || selectedBuilding;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工具目录</h1>
          <p className="text-sm text-gray-500 mt-1">
            共 {filteredTools.length} 件工具可借用
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              showFilters || hasActiveFilters
                ? 'bg-primary-50 border-primary-200 text-primary-600'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                {(searchKeyword ? 1 : 0) + (selectedCategory ? 1 : 0) + (selectedBuilding ? 1 : 0)}
              </span>
            )}
          </button>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索工具名称、描述..."
            className="w-full pl-12 pr-24 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchKeyword('');
              }}
              className="absolute right-16 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all"
          >
            搜索
          </button>
        </div>
      </form>

      {/* Filters */}
      {(showFilters || hasActiveFilters) && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">筛选条件</h3>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
                清除全部
              </button>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">工具分类</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    !selectedCategory
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  全部
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      selectedCategory === category.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">所在楼栋</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedBuilding('')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    !selectedBuilding
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  全部
                </button>
                {buildings.map((building) => (
                  <button
                    key={building.id}
                    onClick={() => setSelectedBuilding(building.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
                      selectedBuilding === building.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Building2 className="w-3 h-3" />
                    {building.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">当前筛选：</span>
          {searchKeyword && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-600 text-sm rounded-full">
              搜索: {searchKeyword}
              <button onClick={() => { setSearchInput(''); setSearchKeyword(''); }}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 text-sm rounded-full">
              {getCategoryName(selectedCategory)}
              <button onClick={() => setSelectedCategory('')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedBuilding && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-600 text-sm rounded-full">
              {getBuildingName(selectedBuilding)}
              <button onClick={() => setSelectedBuilding('')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Tools Grid/List */}
      {filteredTools.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedTool(tool)}
              >
                <div className="w-full sm:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50">
                  <img
                    src={tool.image}
                    alt={tool.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (tool.availableStock > 0) {
                          navigate(`/reserve/${tool.id}`);
                        }
                      }}
                      disabled={tool.availableStock === 0}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        tool.availableStock > 0
                          ? 'bg-primary-500 hover:bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {tool.availableStock > 0 ? '立即预约' : '暂无库存'}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      库存: {tool.availableStock}/{tool.totalStock}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      最长{tool.maxBorrowDays}天
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {getBuildingName(tool.buildingId)}
                    </span>
                    <span className="flex items-center gap-1 text-primary-600 font-medium">
                      押金 ¥{tool.depositAmount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无符合条件的工具</h3>
          <p className="text-gray-500 mb-4">请尝试调整筛选条件或搜索关键词</p>
          <button
            onClick={handleClearFilters}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-all"
          >
            清除筛选条件
          </button>
        </div>
      )}

      {/* Tool Detail Modal */}
      <Modal
        isOpen={!!selectedTool}
        onClose={() => setSelectedTool(null)}
        title={selectedTool?.name || ''}
        size="lg"
      >
        {selectedTool && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50">
                <img
                  src={selectedTool.image}
                  alt={selectedTool.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  {selectedTool.availableStock > 0 ? (
                    <span className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full">
                      可借
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
                      已借完
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTool.name}</h3>
                  <p className="text-gray-600 mt-2">{selectedTool.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">库存</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedTool.availableStock}/{selectedTool.totalStock}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">押金</p>
                    <p className="text-lg font-semibold text-primary-600">¥{selectedTool.depositAmount}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">最长借用</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedTool.maxBorrowDays}天</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">累计借用</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedTool.borrowCount}次</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span>规格: {selectedTool.specification}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span>存放位置: {getBuildingName(selectedTool.buildingId)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span>分类: {getCategoryName(selectedTool.categoryId)}</span>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">使用须知</p>
                      <p className="text-sm text-orange-600 mt-1">{selectedTool.usageNotes}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Slots */}
            <div className="border-t border-gray-100 pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">可借时段查询</h4>
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min={getTodayDateString()}
                />
                <span className="text-sm text-gray-500">{formatDateCN(selectedDate)}</span>
              </div>
              <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
                {timeSlots.map((time, index) => (
                  <div
                    key={time}
                    className={`text-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                      availableSlots[index]
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                  >
                    {time}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-green-100 rounded border border-green-300" />
                  可预约
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-gray-100 rounded border border-gray-300" />
                  已预约
                </span>
              </div>
            </div>

            {/* Adjustment Logs */}
            <div className="border-t border-gray-100 pt-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary-500" />
                最近调配记录
              </h4>
              {(() => {
                const logs = getAdjustmentLogsByTool(selectedTool.id).slice(0, 5);
                if (logs.length === 0) {
                  return (
                    <p className="text-sm text-gray-400 text-center py-6">暂无调配记录</p>
                  );
                }
                return (
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {log.operatorName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDateCN(log.createdAt)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {log.changes.map((c, i) => (
                            <p key={i} className="text-xs text-gray-600 flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
                                {c.label}
                              </span>
                              <span className="text-gray-500 line-through">{String(c.oldValue)}</span>
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                              <span className="text-primary-600 font-medium">{String(c.newValue)}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* QR Code for Admin */}
            <div className="border-t border-gray-100 pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">工具识别码</h4>
              <div className="flex items-start gap-6">
                <QRCodeDisplay value={`TOOL-${selectedTool.id}`} size={120} showValue={false} />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-3">
                    物业扫码借出/归还工具
                  </p>
                  <p className="text-xs text-gray-500 font-mono">工具编号: {selectedTool.id}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => openAdjustModal(selectedTool)}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white hover:shadow-lg active:scale-98"
                >
                  <Settings className="w-5 h-5" />
                  调配工具
                </button>
              )}
              <button
                onClick={() => handleReserve(selectedTool)}
                disabled={selectedTool.availableStock === 0 || !isAvailableToday}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  selectedTool.availableStock > 0 && isAvailableToday
                    ? 'bg-primary-500 hover:bg-primary-600 text-white hover:shadow-lg active:scale-98'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <QrCode className="w-5 h-5" />
                {selectedTool.availableStock === 0
                  ? '暂无库存'
                  : !isAvailableToday
                  ? '所选日期已约满'
                  : '立即预约'}
              </button>
              <button
                onClick={() => setSelectedTool(null)}
                className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                关闭
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Adjust Tool Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title="调配工具"
        size="md"
      >
        <div className="p-6">
          {selectedTool && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <img src={selectedTool.image} alt="" className="w-16 h-16 object-cover rounded-lg" />
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedTool.name}</h4>
                  <p className="text-sm text-gray-500">{selectedTool.specification}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">所在楼栋</label>
                  <select
                    value={adjustBuildingId}
                    onChange={(e) => setAdjustBuildingId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">总库存数量</label>
                  <input
                    type="number"
                    value={adjustTotalStock}
                    onChange={(e) => setAdjustTotalStock(e.target.value)}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">当前值：{selectedTool.totalStock}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">可用库存数量</label>
                  <input
                    type="number"
                    value={adjustAvailableStock}
                    onChange={(e) => setAdjustAvailableStock(e.target.value)}
                    min="0"
                    max={adjustTotalStock}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">当前值：{selectedTool.availableStock}（不可超过总库存）</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleAdjustSave}
                  className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  保存调配
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {adjustToast.show && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
            adjustToast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {adjustToast.message}
        </div>
      )}
    </div>
  );
};
