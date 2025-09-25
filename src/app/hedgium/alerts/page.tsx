'use client'

import { NextPage } from 'next';
import { useState, useEffect, useRef } from 'react';
import { authFetch } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
interface RelatedEntity {
  type: 'strategy' | 'position' | 'order';
  id: number;
  name: string;
}

interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string; // ISO string from API
  read: boolean;
  related_entity?: RelatedEntity;
  related_model_name: 'strategy' | 'position' | 'order'
  related_model_id: number
}

const NotificationsPage: NextPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [activeCategory, setActiveCategory] = useState<'all' | 'trading' | 'system'>('all');

  const {accessToken} = useAuthStore();

  const fetchNotifications = async () => {
    try {
      const res = await authFetch('/notifications/', { method: 'GET' });
      
      setNotifications(await res.json());
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  
  const reconnectTimeout = useRef(null); // Moved useRef outside useEffect
  const wsRef = useRef(null); // Store WebSocket instance to avoid redeclaring

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const maxRetries = 5; // Maximum number of reconnection attempts
    const retryDelay = 3000; // Delay between retries in milliseconds (3 seconds)
    let retryCount = 0; // Current retry attempt

    const connectWebSocket = () => {
      wsRef.current = new WebSocket(`${protocol}://${process.env.NEXT_PUBLIC_BACKEND_DOMAIN}/ws/notifications/?token=${accessToken}`);
      console.log(`${protocol}://${process.env.NEXT_PUBLIC_BACKEND_DOMAIN}/ws/notifications/?token=${accessToken}`)
      wsRef.current.onopen = () => {
        console.log('WebSocket connected ✅');
        retryCount = 0; // Reset retry count on successful connection
      };

      wsRef.current.onmessage = (event) => {
        const newNotification = JSON.parse(event.data);
        setNotifications((prev) => [newNotification, ...prev]); // Prepend new notification
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected ❌');

        if (retryCount < maxRetries) {
          retryCount += 1;
          console.log(`Attempting to reconnect (${retryCount}/${maxRetries}) in ${retryDelay / 1000} seconds...`);
          reconnectTimeout.current = setTimeout(connectWebSocket, retryDelay);
        } else {
          console.log('Max reconnection attempts reached. Giving up.');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        wsRef.current.close(); // Close the WebSocket to trigger onclose
      };
    };

    // Initial connection
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current); // Clear any pending reconnect timeout
      }
      if (wsRef.current) {
        wsRef.current.close(); // Close the WebSocket
      }
    };
  }, [accessToken]); // Re-run effect if accessToken changes

  const markAsRead = async (id: number) => {
    try {
      await authFetch(`/notifications/${id}/read/`, { method: 'POST' });
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await authFetch('/notifications/mark-all-read/', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await authFetch(`/notifications/${id}/`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const filteredNotifications = notifications;

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
                className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 mr-3 cursor-pointer"
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
            {filteredNotifications.map(notification => (
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
                    {/* Type Icon */}
                    <div className={`p-2 rounded-full mr-4 flex items-center justify-center ${
                      notification.type === 'success' ? 'bg-green-100 text-green-600' :
                      notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      notification.type === 'error' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {notification.type === 'success' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {notification.type === 'warning' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M4.93 19h14.14l1.41-2.83L12 3 3.52 16.17 4.93 19z" />
                        </svg>
                      )}
                      {notification.type === 'error' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {notification.type === 'info' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 3a9 9 0 110 18 9 9 0 010-18z" />
                        </svg>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <p className="text-gray-700 mt-1">{notification.message}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {notification.related_model_name}
                          </span>

                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(new Date(notification.timestamp))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                        title="Mark as read"
                      >
                        ✔
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-gray-400 hover:text-red-500 cursor-pointer"
                      title="Delete notification"
                    >
                      🗑
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

// Helper function to format "time ago"
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export default NotificationsPage;
