// src/components/Notifications.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { BellIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const handleNewNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    toast.info(notification.content);
  };

  useWebSocket(user?.id, handleNewNotification);
 
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get('http://localhost:8081/api/notifications', {
        withCredentials: true
      });
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `http://localhost:8081/api/notifications/${notificationId}/read`,
        {},
        { withCredentials: true }
      );
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        'http://localhost:8081/api/notifications/mark-all-read',
        {},
        { withCredentials: true }
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    // Add navigation logic based on notification type
    // Example: navigate to post/comment
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setShowPanel(!showPanel)}
        className="p-2 rounded-full hover:bg-gray-100 relative"
      >
        <BellIcon className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="p-3 border-b flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold">Notifications</h3>
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all as read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 border-b cursor-pointer ${!notification.read ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <p className="text-sm">{notification.content}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                    {!notification.read && (
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}