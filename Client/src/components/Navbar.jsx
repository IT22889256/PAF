import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BellIcon, TrashIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userAvatars, setUserAvatars] = useState({});
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }

    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get('http://localhost:8081/api/notifications', {
        withCredentials: true
      });
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);

      const senderIds = [...new Set(data.map(n => n.senderId))].filter(id => id && !userAvatars[id]);
      if (senderIds.length > 0) {
        const newAvatars = {};
        await Promise.all(senderIds.map(async id => {
          try {
            const response = await axios.get(`http://localhost:8081/api/users/${id}`, {
              withCredentials: true
            });
            newAvatars[id] = response.data.avatar || '/default-avatar.png';
          } catch (error) {
            console.error(`Failed to fetch avatar for user ${id}:`, error);
            newAvatars[id] = '/default-avatar.png';
          }
        }));
        setUserAvatars(prev => ({ ...prev, ...newAvatars }));
      }
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

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(
        `http://localhost:8081/api/notifications/${notificationId}`,
        { withCredentials: true }
      );
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const deletedNotif = notifications.find(n => n.id === notificationId);
        return deletedNotif && !deletedNotif.read ? prev - 1 : prev;
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.delete(
        'http://localhost:8081/api/notifications/clear-all',
        { withCredentials: true }
      );
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      toast.error('Failed to clear all notifications');
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const userProfilePicture = user?.profilePicture || 'http://localhost:8081/api/files/579a6954-674f-4cf5-8cf4-4e95d1f45fe8_p…';

  return (
    <nav className="bg-gradient-to-r from-gray-50 to-gray-100 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-indigo-700 flex items-center space-x-2 transition-transform hover:scale-105">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#4B5EFC" />
            <path d="M2 17L12 22L22 17V7L12 12L2 7V17Z" fill="#364FC7" opacity="0.9" />
          </svg>
          <span>SkillShare</span>
        </Link>
        
        <div className="flex items-center space-x-6">
          {user ? (
            <>
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className="p-2 rounded-full bg-gray-200 hover:bg-indigo-100 transition-colors relative"
                  aria-label="Notifications"
                >
                  <BellIcon className="h-5 w-5 text-indigo-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-100 overflow-hidden">
                    <div className="p-3 border-b flex justify-between items-center bg-indigo-50">
                      <h3 className="font-semibold text-sm text-indigo-900">Notifications</h3>
                      <div className="flex space-x-3">
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors disabled:opacity-50"
                          disabled={unreadCount === 0}
                        >
                          Mark all read
                        </button>
                        <button
                          onClick={clearAllNotifications}
                          className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50"
                          disabled={notifications.length === 0}
                        >
                          Clear all
                        </button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            className={`p-3 border-b last:border-b-0 ${!notification.read ? 'bg-indigo-50' : 'bg-white'} hover:bg-gray-50 transition-colors flex items-start space-x-2`}
                          >
                            <img
                              src={userAvatars[notification.senderId] || '/default-avatar.png'}
                              alt={notification.senderName || 'User'}
                              className="w-6 h-6 rounded-full border border-gray-200 object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/default-avatar.png';
                              }}
                            />
                            <div 
                              className="flex-grow cursor-pointer"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <p className={`text-sm ${!notification.read ? 'font-medium text-indigo-900' : 'text-gray-800'}`}>
                                <span className="font-bold">{notification.senderName || 'Unknown User'}</span> {notification.content}
                              </p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-500">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </span>
                                {!notification.read && (
                                  <span className="inline-block h-2 w-2 rounded-full bg-indigo-500"></span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete notification"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          <BellIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm font-medium">No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center space-x-2 focus:outline-none group"
                >
                  {userProfilePicture ? (
                    <img
                      src={userProfilePicture}
                      alt={user.displayName || 'Account'}
                      className="h-7 w-7 rounded-full object-cover border border-indigo-200 group-hover:border-indigo-300 transition-colors"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center border border-indigo-200 group-hover:border-indigo-300 transition-colors">
                      <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <span className="text-sm font-medium hidden sm:inline text-indigo-900 group-hover:text-indigo-600 transition-colors">
                    {user.displayName || 'Account'}
                  </span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 border border-gray-100 overflow-hidden">
                    <div className="py-1">
                      <Link 
                        to="/profile" 
                        className="block px-4 py-2 text-gray-800 hover:bg-indigo-50 hover:text-indigo-900 text-sm font-medium transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Your Profile
                      </Link>
                      <Link 
                        to="/settings" 
                        className="block px-4 py-2 text-gray-800 hover:bg-indigo-50 hover:text-indigo-900 text-sm font-medium transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Settings
                      </Link>
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 text-gray-800 hover:bg-red-50 hover:text-red-900 text-sm font-medium transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-indigo-700 font-medium hover:text-indigo-900 transition-colors text-sm"
              >
                Log in
              </Link>
              <Link 
                to="/signup"
                className="bg-indigo-600 text-white px-4 py-1.5 rounded-full font-medium hover:bg-indigo-700 transition-colors shadow-md text-sm"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className="h-1 bg-indigo-600"></div>
    </nav>
  );
}