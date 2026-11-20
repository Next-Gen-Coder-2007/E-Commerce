import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Bell,
  Package,
  Sparkles,
  ShieldCheck,
  CheckCheck,
  Trash2,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { useNotifications, NotificationItem } from '../context/NotificationContext';

export const NotificationDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isOpen,
    closeNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'order' | 'price_drop' | 'promo'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'JUST NOW';
      if (diffMins < 60) return `${diffMins}M AGO`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}H AGO`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}D AGO`;
    } catch {
      return '';
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'order':
        return <Package className="w-3.5 h-3.5 text-[#DB4A2B]" />;
      case 'price_drop':
        return <Tag className="w-3.5 h-3.5 text-[#F8A348]" />;
      case 'promo':
        return <Sparkles className="w-3.5 h-3.5 text-[#FF89A9]" />;
      case 'system':
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-[#1E1E1E]" />;
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.link) {
      closeNotifications();
      navigate(item.link);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-satoshi text-[#1E1E1E] select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1E1E1E]/75 backdrop-blur-xs transition-opacity"
        onClick={closeNotifications}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div className="w-screen max-w-md bg-[#E4E2DD] border-l-2 border-[#1E1E1E] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-6 border-b-2 border-[#1E1E1E] flex items-center justify-between bg-[#FFFFFF]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#1E1E1E] text-[#E4E2DD] flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-clash text-lg font-bold uppercase tracking-tight text-[#1E1E1E]">
                    DISPATCH ALERTS
                  </h2>
                  {unreadCount > 0 && (
                    <span className="text-[9px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 bg-[#DB4A2B] text-[#FFFFFF]">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-mono text-[#444444] uppercase tracking-wider">
                  REAL-TIME TELEMETRY FEED
                </p>
              </div>
            </div>

            <button
              onClick={closeNotifications}
              className="p-2 text-[#1E1E1E] hover:text-[#DB4A2B] hover:bg-[#E4E2DD] transition-colors cursor-pointer"
              aria-label="Close Notifications"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions & Filter Tabs */}
          <div className="px-6 py-3 border-b border-[#1E1E1E]/20 bg-[#D9D6D0] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'ALL' },
                { id: 'order', label: 'ORDERS' },
                { id: 'price_drop', label: 'PRICE DROPS' },
                { id: 'promo', label: 'PROMOS' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#1E1E1E] text-[#E4E2DD]'
                      : 'bg-transparent text-[#444444] hover:text-[#1E1E1E]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {notifications.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="inline-flex items-center gap-1 text-[10px] text-[#444444] hover:text-[#1E1E1E] cursor-pointer uppercase font-bold"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>READ ALL</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[#444444] hover:text-[#DB4A2B] cursor-pointer p-1 transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 bg-[#FFFFFF] border border-[#1E1E1E]/20 flex items-center justify-center mx-auto text-[#444444]">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="font-clash text-sm font-bold uppercase text-[#1E1E1E]">
                  NO ACTIVE ALERTS
                </h3>
                <p className="text-xs text-[#444444] max-w-xs mx-auto">
                  Order shipments, tracking updates, and price alert telemetry will appear here.
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 border transition cursor-pointer relative group ${
                    n.isRead
                      ? 'bg-[#FFFFFF]/70 border-[#1E1E1E]/15 text-[#444444]'
                      : 'bg-[#FFFFFF] border-2 border-[#1E1E1E] text-[#1E1E1E] shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#E4E2DD] flex items-center justify-center">
                        {getIcon(n.type)}
                      </div>
                      <span className="font-clash text-xs font-bold uppercase tracking-tight text-[#1E1E1E]">
                        {n.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[9px] text-[#444444]">
                        {formatRelativeTime(n.timestamp)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(n.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#444444] hover:text-[#DB4A2B] transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-[#444444]">
                    {n.message}
                  </p>

                  {n.link && (
                    <div className="mt-2 text-[10px] font-mono font-bold uppercase text-[#DB4A2B] flex items-center gap-1 group-hover:underline">
                      <span>OPEN DETAILS</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
