import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function CommunityDetail({ community, onBack, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState({});
  const messagesEndRef = useRef(null);
  const stompClient = useRef(null);
  const messageInputRef = useRef(null);



  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`http://localhost:8081/api/communities/${community.id}/messages`, {
          withCredentials: true
        });
        setMessages(data);
        
        await axios.post(`http://localhost:8081/api/communities/${community.id}/mark-as-read`, {}, {
          withCredentials: true
        });
      } catch (error) {
        toast.error('Failed to load messages');
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [community.id]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const userIds = new Set();
      messages.forEach(msg => userIds.add(msg.senderId));
      
      if (community.ownerId) userIds.add(community.ownerId);
      
      const usersToFetch = [...userIds].filter(id => !users[id]);
      
      if (usersToFetch.length === 0) return;
      
      try {
        const newUsers = {};
        
        await Promise.all(usersToFetch.map(async id => {
          try {
            const response = await axios.get(`http://localhost:8081/api/users/${id}`, { 
              withCredentials: true 
            });
            newUsers[id] = {
              id: response.data.id,
              name: response.data.name || `User ${id.substring(0, 4)}`,
              username: response.data.username || `user${id.substring(0, 4)}`,
              avatar: response.data.avatar || '/default-avatar.png'
            };
          } catch (error) {
            console.error(`Error fetching user ${id}:`, error);
            newUsers[id] = { 
              id, 
              name: `User ${id.substring(0, 4)}`, 
              username: `user${id.substring(0, 4)}`,
              avatar: '/default-avatar.png'
            };
          }
        }));
        
        setUsers(prev => ({...prev, ...newUsers}));
      } catch (error) {
        console.error('Error in user details fetch:', error);
      }
    };

    if (messages.length > 0) {
      fetchUserDetails();
    }
  }, [messages, community.ownerId, users]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const message = {
        communityId: community.id,
        content: newMessage,
      };

      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.publish({
          destination: `/app/community/${community.id}/sendMessage`,
          body: JSON.stringify(message)
        });
      } else {
        await axios.post(`http://localhost:8081/api/communities/${community.id}/messages`, message, {
          withCredentials: true
        });
        const { data } = await axios.get(`http://localhost:8081/api/communities/${community.id}/messages`, {
          withCredentials: true
        });
        setMessages(data);
      }

      setNewMessage('');
      messageInputRef.current?.focus();
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getUserInfo = (userId) => {
    return users[userId] || { 
      name: `User ${userId.substring(0, 4)}`, 
      username: `user${userId.substring(0, 4)}`,
      avatar: '/default-avatar.png'
    };
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center shadow-sm">
        <button
          onClick={onBack}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="flex items-center">
          {community.ownerId && users[community.ownerId]?.avatar && (
            <img 
              src={users[community.ownerId].avatar} 
              alt={users[community.ownerId].name}
              className="w-10 h-10 rounded-full mr-3 border-2 border-indigo-200 object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-avatar.png';
              }}
            />
          )}
          <div>
            <h2 className="text-xl font-bold text-indigo-900">{community.name}</h2>
            <p className="text-sm text-gray-500">
              {community.members?.length || 0} member{(community.members?.length || 0) !== 1 ? 's' : ''} • {community.isPrivate ? 'Private' : 'Public'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-gray-600 font-medium">Loading messages...</span>
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message) => {
              const user = getUserInfo(message.senderId);
              return (
                <div 
                  key={message.id} 
                  className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  {message.senderId !== currentUserId && (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full mr-2 self-end mb-1 border border-gray-200 object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                  )}
                  <div 
                    className={`max-w-[70%] rounded-lg px-4 py-2.5 shadow-sm ${
                      message.senderId === currentUserId 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    {message.senderId !== currentUserId && (
                      <p className="text-xs font-semibold text-indigo-900 mb-1">
                        {user.name}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs ${message.senderId === currentUserId ? 'text-indigo-200' : 'text-gray-500'} text-right mt-1.5`}>
                      {formatDate(message.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 text-lg font-medium">No messages yet.</p>
              <p className="text-gray-500 text-sm mt-1">Be the first to start the conversation!</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-100 bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            type="text"
            ref={messageInputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-gray-800"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`px-5 py-2.5 rounded-r-lg font-semibold transition-all ${
              !newMessage.trim()
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}