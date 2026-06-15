import { Calendar, Package, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Tool } from '@/types';
import { useToolStore } from '@/store/toolStore';

interface ToolCardProps {
  tool: Tool;
  showPopularity?: boolean;
}

export const ToolCard = ({ tool, showPopularity = false }: ToolCardProps) => {
  const navigate = useNavigate();
  const { categories, buildings } = useToolStore();

  const category = categories.find((c) => c.id === tool.categoryId);
  const building = buildings.find((b) => b.id === tool.buildingId);

  const isAvailable = tool.availableStock > 0;
  const stockPercentage = (tool.availableStock / tool.totalStock) * 100;

  const getStockColor = () => {
    if (stockPercentage >= 60) return 'bg-green-500';
    if (stockPercentage >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div
      className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={() => navigate(`/tools?tool=${tool.id}`)}
    >
      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <img
          src={tool.image}
          alt={tool.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          {isAvailable ? (
            <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
              可借
            </span>
          ) : (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
              已借完
            </span>
          )}
          {showPopularity && tool.borrowCount > 100 && (
            <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              热门
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
          {tool.name}
        </h3>

        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span>库存: {tool.availableStock}/{tool.totalStock}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${getStockColor()} transition-all duration-500`}
              style={{ width: `${stockPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>最长{tool.maxBorrowDays}天</span>
            </div>
            <div className="flex items-center gap-1 text-primary-600 font-semibold">
              <span>¥{tool.depositAmount}</span>
              <span className="text-xs text-gray-400 font-normal">押金</span>
            </div>
          </div>
          {building && (
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full">
                {category?.name}
              </span>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {building.name}
              </span>
            </div>
          )}
        </div>

        <button
          className={`w-full mt-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            isAvailable
              ? 'bg-primary-500 hover:bg-primary-600 text-white hover:shadow-md active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          disabled={!isAvailable}
          onClick={(e) => {
            e.stopPropagation();
            if (isAvailable) {
              navigate(`/reserve/${tool.id}`);
            }
          }}
        >
          {isAvailable ? '立即预约' : '暂无库存'}
        </button>
      </div>
    </div>
  );
};
