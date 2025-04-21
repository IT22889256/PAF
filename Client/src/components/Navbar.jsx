// src/components/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BellIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

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
      toast.error('Failed to load notifications');
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
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
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
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">SkillShare</Link>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/communities" className="text-gray-700 hover:text-blue-600">
                Communities
              </Link>
              
              {/* Notifications Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full hover:bg-gray-100 relative"
                >
                  <BellIcon className="h-6 w-6 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-10">
                    <div className="p-3 border-b flex justify-between items-center">
                      <h3 className="font-medium">Notifications</h3>
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
                            className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                            onClick={() => {
                              markAsRead(notification.id);
                              // Add navigation logic here if needed
                            }}
                          >
                            <p className="text-sm">{notification.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
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
              
              <Link to="/profile" className="flex items-center">
                <span className="text-gray-700 hover:text-blue-600">Profile</span>
              </Link>
              <button
                onClick={logout}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="text-gray-700 hover:text-blue-600">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}