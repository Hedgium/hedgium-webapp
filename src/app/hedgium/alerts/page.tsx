// pages/notifications/index.tsx
'use client'

import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  relatedEntity?: {
    type: 'strategy' | 'position' | 'order';
    id: string;
    name: string;
  };
}

const NotificationsPage: NextPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [activeCategory, setActiveCategory] = useState<'all' | 'trading' | 'system'>('all');

  useEffect(() => {
    // Simulate API fetch
    const fetchNotifications = async () => {
      try {
        // In a real app, this would be an API call
        const mockNotifications: Notification[] = [
          {
            id: '1',
            type: 'success',
            title: 'Strategy Executed',
            message: 'Your Moving Average Crossover strategy has successfully entered a long position on AAPL.',
            timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
            read: false,
            relatedEntity: {
              type: 'strategy',
              id: 'strat-1',
              name: 'Moving Average Crossover'
            }
          },
          {
            id: '2',
            type: 'warning',
            title: 'Price Alert',
            message: 'TSLA has dropped 5% below your entry price of $210.75. Consider adjusting your stop loss.',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            read: false,
            relatedEntity: {
              type: 'position',
              id: 'pos-3',
              name: 'TSLA Position'
            }
          },
          {
            id: '3',
            type: 'error',
            title: 'Order Failed',
            message: 'Failed to execute buy order for NVDA. Insufficient buying power.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            read: true,
            relatedEntity: {
              type: 'order',
              id: 'order-4',
              name: 'NVDA Buy Order'
            }
          },
          {
            id: '4',
            type: 'info',
            title: 'System Update',
            message: 'Scheduled maintenance will occur this weekend. The system will be unavailable from 2 AM to 4 AM EST.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
            read: true
          },
          {
            id: '5',
            type: 'success',
            title: 'Profit Target Reached',
            message: 'MSFT has reached your profit target of $327.89. Position has been partially closed.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
            read: true,
            relatedEntity: {
              type: 'position',
              id: 'pos-2',
              name: 'MSFT Position'
            }
          },
          {
            id: '6',
            type: 'warning',
            title: 'High Volatility Alert',
            message: 'Unusual volatility detected in BTC/USD. Consider adjusting position size or stop loss levels.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
            read: true,
            relatedEntity: {
              type: 'strategy',
              id: 'strat-4',
              name: 'Crypto Momentum'
            }
          },
          {
            id: '7',
            type: 'info',
            title: 'New Feature Available',
            message: 'Backtesting module is now available. Test your strategies against historical market data.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36), // 36 hours ago
            read: true
          },
          {
            id: '8',
            type: 'error',
            title: 'Connection Issue',
            message: 'Temporary connectivity issue with data feed. Historical data unaffected.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
            read: true
          }
        ];
        setNotifications(mockNotifications);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  const filteredNotifications = notifications.filter(notification => {
    // Apply read/unread filter
    if (filter === 'unread' && notification.read) return false;
    
    // Apply category filter
    if (activeCategory === 'trading' && !notification.relatedEntity) return false;
    if (activeCategory === 'system' && notification.relatedEntity) return false;
    
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-2">Stay updated with your trading activities and system alerts</p>
          </div>
          <div className="flex items-center mt-4 md:mt-0">
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 mr-3"
              >
                Mark all as read
              </button>
            )}
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {unreadCount} unread
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${filter === 'unread' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setFilter('unread')}
            >
              Unread
            </button>
            
            <div className="ml-auto flex gap-2">
              <button
                className={`px-4 py-2 rounded-lg ${activeCategory === 'all' ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setActiveCategory('all')}
              >
                All Categories
              </button>
              <button
                className={`px-4 py-2 rounded-lg ${activeCategory === 'trading' ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setActiveCategory('trading')}
              >
                Trading
              </button>
              <button
                className={`px-4 py-2 rounded-lg ${activeCategory === 'system' ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setActiveCategory('system')}
              >
                System
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <div className="text-2xl text-gray-500 mb-4">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications found'}
            </div>
            <p className="text-gray-400">
              {filter === 'unread' ? 'You\'re all caught up!' : 'Try changing your filters to see more notifications'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${
                  notification.type === 'success' ? 'border-green-500' :
                  notification.type === 'warning' ? 'border-yellow-500' :
                  notification.type === 'error' ? 'border-red-500' :
                  'border-blue-500'
                } ${!notification.read ? 'ring-2 ring-blue-100' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <div className={`p-2 rounded-full mr-4 ${
                      notification.type === 'success' ? 'bg-green-100 text-green-600' :
                      notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      notification.type === 'error' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {notification.type === 'success' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {notification.type === 'warning' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      {notification.type === 'error' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      {notification.type === 'info' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <p className="text-gray-700 mt-1">{notification.message}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {notification.relatedEntity && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {notification.relatedEntity.type}: {notification.relatedEntity.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Mark as read"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-gray-400 hover:text-red-500"
                      title="Delete notification"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
  
  return date.toLocaleDateString();
}

export default NotificationsPage;