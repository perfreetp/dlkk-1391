import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Drill,
  ArrowUpFromLine,
  Truck,
  Ruler,
  SprayCan,
  Flower,
  ArrowRight,
  QrCode,
  CalendarCheck,
  ShieldCheck,
  Megaphone,
  ChevronRight,
} from 'lucide-react';
import { ToolCard } from '@/components/ToolCard';
import { useToolStore } from '@/store/toolStore';
import { getNotices } from '@/utils/storage';
import type { Notice, ToolCategory } from '@/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Drill,
  ArrowUpFromLine,
  Truck,
  Ruler,
  SprayCan,
  Flower,
};

export const Home = () => {
  const navigate = useNavigate();
  const { categories, getPopularTools, setSearchKeyword, setSelectedCategory } = useToolStore();
  const [searchInput, setSearchInput] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);

  const popularTools = getPopularTools(6);
  const topNotices = notices.filter((n) => n.isTop).slice(0, 3);

  useEffect(() => {
    setNotices(getNotices());
  }, []);

  useEffect(() => {
    if (topNotices.length > 1) {
      const timer = setInterval(() => {
        setCurrentNoticeIndex((prev) => (prev + 1) % topNotices.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [topNotices.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchKeyword(searchInput);
    navigate('/tools');
  };

  const handleCategoryClick = (category: ToolCategory) => {
    setSelectedCategory(category.id);
    setSearchKeyword('');
    navigate('/tools');
  };

  const handleQuickReserve = () => {
    navigate('/tools');
  };

  const handleQuickScan = () => {
    navigate('/records');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative px-6 py-12 md:py-16 md:px-12">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              社区工具共享平台
            </h1>
            <p className="text-lg text-primary-100 mb-8">
              电钻、梯子、手推车，想借就借，登记无忧。让邻里共享更简单，让生活更便捷。
            </p>

            {/* Search Box */}
            <form onSubmit={handleSearch} className="relative max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="搜索工具名称，如：电钻、梯子..."
                  className="w-full pl-12 pr-32 py-4 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-all hover:shadow-lg active:scale-95"
                >
                  搜索
                </button>
              </div>
            </form>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 mt-8">
              <div className="flex items-center gap-2 text-white/80">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">100%</p>
                  <p className="text-sm text-white/70">押金保障</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">12+</p>
                  <p className="text-sm text-white/70">工具种类</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">秒级</p>
                  <p className="text-sm text-white/70">扫码借还</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcement Marquee */}
      {topNotices.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center">
            <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border-r border-orange-100">
              <Megaphone className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <span className="text-sm font-medium text-orange-700 whitespace-nowrap">公告</span>
            </div>
            <div className="flex-1 px-4 py-3 overflow-hidden">
              {topNotices.map((notice, index) => (
                <div
                  key={notice.id}
                  className={`flex items-center gap-2 transition-all duration-500 ${
                    index === currentNoticeIndex ? 'block' : 'hidden'
                  }`}
                >
                  <span className="text-sm text-gray-700 truncate">{notice.title}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/profile#faq')}
              className="hidden sm:flex items-center gap-1 px-4 py-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              更多
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={handleQuickReserve}
          className="group flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <CalendarCheck className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900">立即预约</p>
            <p className="text-xs text-gray-500">选择工具快速预约</p>
          </div>
        </button>
        <button
          onClick={handleQuickScan}
          className="group flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <QrCode className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900">扫码借还</p>
            <p className="text-xs text-gray-500">扫码快速借出归还</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/profile#records')}
          className="group flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <CalendarCheck className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900">我的记录</p>
            <p className="text-xs text-gray-500">查看历史借用记录</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/profile#deposit')}
          className="group flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900">押金管理</p>
            <p className="text-xs text-gray-500">充值退款一键操作</p>
          </div>
        </button>
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">工具分类</h2>
          <button
            onClick={() => navigate('/tools')}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            查看全部
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((category) => {
            const Icon = iconMap[category.icon] || Drill;
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className="group flex flex-col items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-all">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">{category.name}</p>
                  <p className="text-xs text-gray-500 hidden sm:block">{category.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Popular Tools */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">热门工具</h2>
          <button
            onClick={() => navigate('/tools')}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            查看全部
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} showPopularity />
          ))}
        </div>
      </section>

      {/* Usage Guide */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">借用指南</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: '搜索工具',
              desc: '按分类或关键词查找需要的工具',
              color: 'from-blue-500 to-blue-600',
            },
            {
              step: '02',
              title: '提交预约',
              desc: '选择借用时段，支付押金完成预约',
              color: 'from-green-500 to-green-600',
            },
            {
              step: '03',
              title: '扫码取件',
              desc: '凭预约码到物业扫码借出工具',
              color: 'from-orange-500 to-orange-600',
            },
            {
              step: '04',
              title: '按时归还',
              desc: '使用完毕扫码归还，押金自动退回',
              color: 'from-purple-500 to-purple-600',
            },
          ].map((item) => (
            <div key={item.step} className="relative">
              <div
                className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center text-white font-bold text-lg mb-3`}
              >
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
