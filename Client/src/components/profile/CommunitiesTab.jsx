import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CommunityDetail from './CommunityDetail';
import { X } from 'react-feather';

export default function CommunitiesTab() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    isPrivate: false,
    tags: []
  });
  const [currentTag, setCurrentTag] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const publicRes = await axios.get('http://localhost:8081/api/communities', {
          withCredentials: true
        });
        
        if (user && user.id) {
          const userRes = await axios.get(`http://localhost:8081/api/communities/user/${user.id}`, {
            withCredentials: true
          });
          setUserCommunities(userRes.data);
        }
        
        setCommunities(publicRes.data);
      } catch (error) {
        toast.error('Failed to load communities');
        console.error('Error fetching communities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!newCommunity.name.trim()) {
      toast.error('Community name is required');
      return;
    }

    try {
      const { data } = await axios.post(
        'http://localhost:8081/api/communities',
        newCommunity,
        { withCredentials: true }
      );
      
      setCommunities([...communities, data]);
      setUserCommunities([...userCommunities, data]);
      setShowCreateModal(false);
      setNewCommunity({
        name: '',
        description: '',
        isPrivate: false,
        tags: []
      });
      toast.success('Community created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create community');
      console.error('Error creating community:', error);
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !newCommunity.tags.includes(currentTag.trim())) {
      setNewCommunity({
        ...newCommunity,
        tags: [...newCommunity.tags, currentTag.trim()]
      });
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setNewCommunity({
      ...newCommunity,
      tags: newCommunity.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleJoinCommunity = async (communityId, isMember) => {
    try {
      const endpoint = isMember ? 'leave' : 'join';
      await axios.post(
        `http://localhost:8081/api/communities/${communityId}/${endpoint}`,
        {},
        { withCredentials: true }
      );

      setCommunities(communities.map(community => {
        if (community.id === communityId) {
          const updatedMembers = isMember 
            ? community.members.filter(member => member !== user.id)
            : [...community.members, user.id];
          return { ...community, members: updatedMembers };
        }
        return community;
      }));

      if (isMember) {
        setUserCommunities(userCommunities.filter(c => c.id !== communityId));
      } else {
        const joinedCommunity = communities.find(c => c.id === communityId);
        if (joinedCommunity) {
          setUserCommunities([...userCommunities, {
            ...joinedCommunity,
            members: [...joinedCommunity.members, user.id]
          }]);
        }
      }

      toast.success(`Successfully ${isMember ? 'left' : 'joined'} the community!`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${isMember ? 'leave' : 'join'} community`);
    }
  };

  const handleViewCommunity = (community) => {
    setSelectedCommunity(community);
  };

  const handleBackToCommunities = () => {
    setSelectedCommunity(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-4 text-gray-600 text-lg font-medium">Loading communities...</span>
      </div>
    );
  }

  if (selectedCommunity) {
    return <CommunityDetail 
      community={selectedCommunity} 
      onBack={handleBackToCommunities} 
      currentUserId={user?.id} 
    />;
  }

  const displayCommunities = activeTab === 'all' ? communities : userCommunities;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-indigo-900">Communities</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-md font-semibold"
        >
          Create Community
        </button>
      </div>

      <div className="flex border-b border-gray-200 mb-8">
        <button
          className={`py-3 px-6 font-semibold text-sm transition-colors ${
            activeTab === 'all' 
              ? 'border-b-2 border-indigo-600 text-indigo-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('all')}
        >
          All Communities
        </button>
        <button
          className={`py-3 px-6 font-semibold text-sm transition-colors ${
            activeTab === 'joined' 
              ? 'border-b-2 border-indigo-600 text-indigo-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('joined')}
        >
          My Communities
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayCommunities.length > 0 ? (
          displayCommunities.map(community => (
            <div key={community.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-indigo-900">{community.name}</h3>
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    community.isPrivate ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {community.isPrivate ? 'Private' : 'Public'}
                  </span>
                </div>
                <p className="text-gray-600 mt-3 leading-relaxed">{community.description}</p>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {community.tags && community.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <div className="mt-5 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {community.members?.length || 0} member{(community.members?.length || 0) !== 1 ? 's' : ''}
                  </span>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleViewCommunity(community)}
                      className="px-4 py-1.5 rounded-lg text-sm bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleJoinCommunity(community.id, community.members?.includes(user?.id))}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        community.members?.includes(user?.id)
                          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {community.members?.includes(user?.id) ? 'Leave' : 'Join'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 text-lg font-medium">
              {activeTab === 'all' 
                ? 'No communities found. Be the first to create one!' 
                : 'You haven\'t joined any communities yet.'}
            </p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-indigo-900">Create New Community</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateCommunity}>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newCommunity.name}
                    onChange={(e) => setNewCommunity({...newCommunity, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-gray-800"
                    placeholder="Community name"
                    required
                  />
                </div>
                
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={newCommunity.description}
                    onChange={(e) => setNewCommunity({...newCommunity, description: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none text-gray-800"
                    rows="4"
                    placeholder="What's this community about?"
                  />
                </div>
                
                <div className="mb-5 flex items-center">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newCommunity.isPrivate}
                    onChange={(e) => setNewCommunity({...newCommunity, isPrivate: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-700 font-medium">Private Community</label>
                </div>
                
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags</label>
                  <div className="flex mb-3">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-gray-800"
                      placeholder="Add a tag"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newCommunity.tags.map(tag => (
                      <div key={tag} className="flex items-center bg-indigo-100 px-3 py-1.5 rounded-full text-indigo-800 text-sm font-medium">
                        <span className="mr-1.5">#{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors shadow-md"
                  >
                    Create Community
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}