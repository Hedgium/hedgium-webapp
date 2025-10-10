'use client'

import { NextPage } from 'next';
import { useState, useEffect, useRef } from 'react';
import { Check, Trash, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useNotificationStore } from "@/store/notificationStore";

const NotificationsPage: NextPage = () => {
  
  const {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  const [filterNotifications, setFilterNotifications] = useState([]);


  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(()=>{
    if (filter=="all") setFilterNotifications(notifications)
    if (filter=="unread") setFilterNotifications(notifications.filter((n) => !n.read))
  },[filter, notifications])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold ">Notifications</h1>
            <p className=" mt-2">Stay updated with your trading activities and system alerts</p>
          </div>
          <div className="flex items-center mt-4 md:mt-0">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-base-200 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 mr-3 cursor-pointer"
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
        <div className="bg-base-200 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 cursor-pointer rounded-lg ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`px-4 py-2 cursor-pointer rounded-lg ${filter === 'unread' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setFilter('unread')}
            >
              Unread
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {filterNotifications?.length === 0 ? (
          <div className="text-center py-12 rounded-xl shadow">
            <div className="text-2xl  mb-4">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications found'}
            </div>
            <p className="">
              {filter === 'unread' ? 'You\'re all caught up!' : 'Try changing your filters to see more notifications'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">


            {filterNotifications?.map(notification => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${
                  notification.type === 'SUCCESS' ? 'border-green-500' :
                  notification.type === 'WARNING' ? 'border-yellow-500' :
                  notification.type === 'ERROR' ? 'border-red-500' :
                  'border-blue-500'
                } ${!notification.read ? 'ring-2 ring-blue-100' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    {/* Type Icon */}
                    <div className={`p-2 rounded-full mr-4 flex items-center justify-center ${
                      notification.type === 'SUCCESS' ? 'bg-green-100 text-green-600' :
                      notification.type === 'WARNING' ? 'bg-yellow-100 text-yellow-600' :
                      notification.type === 'ERROR' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {notification.type === 'SUCCESS' && (
                        <CheckCircle className="h-5 w-5" />
                      )}
                      {notification.type === 'WARNING' && (
                        <AlertTriangle className="h-5 w-5" />
                      )}
                      {notification.type === 'ERROR' && (
                        <XCircle className="h-5 w-5" />
                      )}
                      {notification.type === 'INFO' && (
                        <Info className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold ">{notification.title}</h3>
                      <p className=" mt-1">{notification.message}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {notification.related_model_name}
                        </span>
                        <span className="text-xs">
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
                        <Check className='h-4 w-4' />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-gray-400 hover:text-red-500 cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash className='h-4 w-4' />
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