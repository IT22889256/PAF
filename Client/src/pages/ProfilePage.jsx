import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PostCard from '../components/PostCard';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    skills: '',
    interests: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [userPosts, setUserPosts] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [learningPlans, setLearningPlans] = useState([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    title: '',
    description: '',
    skillCategory: ''
  });
  const [topicForm, setTopicForm] = useState({
    title: '',
    description: '',
    resources: ''
  });




  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get('http://localhost:8081/api/profile', {
          withCredentials: true
        });
        setProfile(data);
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          location: data.location || '',
          skills: data.skills?.join(', ') || '',
          interests: data.interests?.join(', ') || ''
        });
        fetchUserPosts(data.id);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (!profile) return;
    
    const fetchContent = async () => {
      setIsLoadingContent(true);
      try {
        switch (activeTab) {
          case 'posts':
            await fetchUserPosts(profile.id);
            break;
          case 'communities':
            await fetchUserCommunities(profile.id);
            break;
          case 'plans':
            await fetchLearningPlans(profile.id);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(`Failed to fetch ${activeTab}:`, error);
        toast.error(`Failed to load ${activeTab}`);
      } finally {
        setIsLoadingContent(false);
      }
    };
    
    fetchContent();
  }, [activeTab, profile]);

  const fetchUserPosts = async (userId) => {
    const { data } = await axios.get(`http://localhost:8081/api/posts/user/${userId}`, {
      withCredentials: true
    });
    setUserPosts(data);
  };

  const fetchUserCommunities = async (userId) => {
    const { data } = await axios.get(`http://localhost:8081/api/communities/user/${userId}`, {
      withCredentials: true
    });
    setUserCommunities(data);
  };

  const fetchLearningPlans = async (userId) => {
    const { data } = await axios.get(`http://localhost:8081/api/learning-plans/user/${userId}`, {
      withCredentials: true
    });
    setLearningPlans(data);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const updatedData = {
        ...formData,
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
        interests: formData.interests.split(',').map(interest => interest.trim()).filter(interest => interest)
      };

      const { data } = await axios.put(
        'http://localhost:8081/api/profile',
        updatedData,
        { withCredentials: true }
      );

      setProfile(data);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const { data } = await axios.post(
        'http://localhost:8081/api/upload',
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setUploadProgress(progress);
          }
        }
      );

      await axios.put(
        'http://localhost:8081/api/profile/picture',
        { pictureUrl: data.fileUrl },
        { withCredentials: true }
      );

      const { data: updatedProfile } = await axios.get(
        'http://localhost:8081/api/profile',
        { withCredentials: true }
      );

      setProfile(updatedProfile);
      setSelectedFile(null);
      setUploadProgress(0);
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`http://localhost:8081/api/posts/${postId}`, {
        withCredentials: true
      });
      setUserPosts(userPosts.filter(post => post.id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const { data: updatedPost } = await axios.post(
        `http://localhost:8081/api/posts/${postId}/like`,
        {},
        { withCredentials: true }
      );
      setUserPosts(userPosts.map(post => 
        post.id === postId ? updatedPost : post
      ));
    } catch (error) {
      console.error('Failed to like post:', error);
      toast.error('Failed to like post');
    }
  };

  const handleAddComment = async (postId, content) => {
    try {
      const { data: updatedPost } = await axios.post(
        `http://localhost:8081/api/posts/${postId}/comments`,
        { content },
        { withCredentials: true }
      );
      setUserPosts(userPosts.map(post => 
        post.id === postId ? updatedPost : post
      ));
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const { data: updatedPost } = await axios.delete(
        `http://localhost:8081/api/posts/${postId}/comments/${commentId}`,
        { withCredentials: true }
      );
      setUserPosts(userPosts.map(post => 
        post.id === postId ? updatedPost : post
      ));
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleCreatePlan = async () => {
    try {
      setIsSubmitting(true);
      const { data } = await axios.post(
        'http://localhost:8081/api/learning-plans',
        {
          ...planForm,
          topics: []
        },
        { withCredentials: true }
      );
      
      setLearningPlans([...learningPlans, data]);
      setShowPlanModal(false);
      setPlanForm({
        title: '',
        description: '',
        skillCategory: ''
      });
      toast.success('Learning plan created successfully');
    } catch (error) {
      console.error('Failed to create plan:', error);
      toast.error('Failed to create learning plan');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddTopic = async (planId) => {
    try {
      setIsSubmitting(true);
      const { data } = await axios.post(
        `http://localhost:8081/api/learning-plans/${planId}/topics`,
        {
          id: Date.now().toString(),
          title: topicForm.title,
          description: topicForm.description,
          resources: topicForm.resources.split(',').map(r => r.trim()),
          completed: false
        },
        { withCredentials: true }
      );
      
      setLearningPlans(learningPlans.map(plan => 
        plan.id === planId ? data : plan
      ));
      setCurrentPlan(null);
      setTopicForm({
        title: '',
        description: '',
        resources: ''
      });
      toast.success('Topic added successfully');
    } catch (error) {
      console.error('Failed to add topic:', error);
      toast.error('Failed to add topic');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCompleteTopic = async (planId, topicId) => {
    try {
      const { data } = await axios.put(
        `http://localhost:8081/api/learning-plans/${planId}/topics/${topicId}/complete`,
        {},
        { withCredentials: true }
      );
      
      setLearningPlans(learningPlans.map(plan => 
        plan.id === planId ? data : plan
      ));
      toast.success('Topic marked as completed');
    } catch (error) {
      console.error('Failed to complete topic:', error);
      toast.error('Failed to update topic');
    }
  };

  const renderTabContent = () => {
    if (isLoadingContent) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'posts':
        return (
          <div className="mt-6 space-y-4">
            {userPosts.length > 0 ? (
              userPosts.map(post => (
                <PostCard 
                  key={post.id}
                  post={post}
                  onDelete={() => handleDeletePost(post.id)}
                  onLike={() => handleLikePost(post.id)}
                  onComment={(content) => handleAddComment(post.id, content)}
                  onCommentDelete={(commentId) => handleDeleteComment(post.id, commentId)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No posts yet
              </div>
            )}
          </div>
        );
      case 'communities':
        return (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCommunities.length > 0 ? (
              userCommunities.map(community => (
                <div key={community.id} className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="font-semibold text-lg">{community.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{community.description}</p>
                  <div className="mt-3 flex items-center text-sm text-gray-500">
                    <span>{community.memberCount} members</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 col-span-full">
                No communities yet
              </div>
            )}
          </div>
        );
      
// Update the learning plans tab content in renderTabContent()
case 'plans':
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">My Learning Plans</h2>
        <button
          onClick={() => {
            setCurrentPlan(null);
            setShowPlanModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create New Plan
        </button>
      </div>

      {learningPlans.length > 0 ? (
        <div className="space-y-6">
          {learningPlans.map(plan => (
            <div key={plan.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{plan.title}</h3>
                    <p className="text-gray-600">{plan.description}</p>
                    <div className="mt-2 flex items-center">
                      <span className="text-sm text-gray-500 mr-2">
                        {plan.skillCategory}
                      </span>
                      <span className="text-sm font-medium">
                        {plan.topics.filter(t => t.completed).length} of {plan.topics.length} topics completed
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentPlan(plan);
                      setTopicForm({
                        title: '',
                        description: '',
                        resources: ''
                      });
                    }}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                  >
                    Add Topic
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{Math.round((plan.topics.filter(t => t.completed).length / plan.topics.length * 100))}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.round((plan.topics.filter(t => t.completed).length / plan.topics.length * 100))}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-3 mt-4">
                  {plan.topics.map(topic => (
                    <div key={topic.id} className="border rounded-md p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{topic.title}</h4>
                          {topic.description && (
                            <p className="text-gray-600 text-sm mt-1">{topic.description}</p>
                          )}
                          {topic.resources?.length > 0 && (
                            <div className="mt-2">
                              <h5 className="text-xs font-medium text-gray-500">Resources:</h5>
                              <ul className="list-disc list-inside text-sm text-blue-600">
                                {topic.resources.map((resource, idx) => (
                                  <li key={idx}>
                                    <a href={resource} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                      {resource}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleCompleteTopic(plan.id, topic.id)}
                          disabled={topic.completed}
                          className={`ml-4 px-3 py-1 rounded-md text-sm ${
                            topic.completed 
                              ? 'bg-green-100 text-green-800 cursor-default'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {topic.completed ? 'Completed' : 'Mark Complete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No learning plans yet. Create your first plan to get started!
        </div>
      )}
      
      {/* Plan Creation Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">Create New Learning Plan</h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={planForm.title}
                    onChange={(e) => setPlanForm({...planForm, title: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Learn React Fundamentals"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={planForm.description}
                    onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Describe what you want to achieve with this plan"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skill Category</label>
                  <input
                    type="text"
                    value={planForm.skillCategory}
                    onChange={(e) => setPlanForm({...planForm, skillCategory: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Web Development, Photography"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlan}
                disabled={!planForm.title || isSubmitting}
                className={`px-4 py-2 rounded-md text-white ${
                  !planForm.title || isSubmitting
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Creating...' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Topic Modal */}
      {currentPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">Add Topic to {currentPlan.title}</h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={topicForm.title}
                    onChange={(e) => setTopicForm({...topicForm, title: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., React Components"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={topicForm.description}
                    onChange={(e) => setTopicForm({...topicForm, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Describe what this topic covers"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resources (comma separated)</label>
                  <textarea
                    value={topicForm.resources}
                    onChange={(e) => setTopicForm({...topicForm, resources: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="https://example.com/resource1, https://example.com/resource2"
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => setCurrentPlan(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddTopic(currentPlan.id)}
                disabled={!topicForm.title || isSubmitting}
                className={`px-4 py-2 rounded-md text-white ${
                  !topicForm.title || isSubmitting
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Adding...' : 'Add Topic'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500">Failed to load profile data</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-48 relative">
            <div className="absolute -bottom-16 left-6">
              <div className="relative">
                <img
                  src={profile.profilePicture || '/default-avatar.png'}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-white object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-avatar.png';
                  }}
                />
                {isEditing && (
                  <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isUploading}
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-6 w-6 ${isUploading ? 'text-gray-400' : 'text-blue-600'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </label>
                  </div>
                )}
              </div>
              {selectedFile && (
                <div className="mt-2 bg-gray-100 p-2 rounded-md">
                  <div className="flex justify-between items-center">
                    <p className="text-sm truncate max-w-xs">{selectedFile.name}</p>
                    <button 
                      onClick={handleCancelUpload}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {uploadProgress}% {isUploading ? 'Uploading...' : 'Complete'}
                    </span>
                    <button
                      onClick={handleFileUpload}
                      disabled={isUploading}
                      className={`px-3 py-1 text-sm rounded-md ${isUploading 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                    >
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="absolute top-4 right-4 flex space-x-2">
              {!isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="p-6 pt-20">
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows="3"
                      maxLength="500"
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.bio.length}/500 characters
                    </p>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Skills (comma separated)</label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      placeholder="e.g., Photography, Cooking, Programming"
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Interests (comma separated)</label>
                    <input
                      type="text"
                      name="interests"
                      value={formData.interests}
                      onChange={handleInputChange}
                      placeholder="e.g., Travel, Music, Technology"
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded-md text-white ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{profile.name}</h1>
                {profile.location && (
                  <div className="flex items-center mt-2 text-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.bio && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">About</h3>
                    <p className="text-gray-700 whitespace-pre-line">{profile.bio}</p>
                  </div>
                )}
                
                {(profile.skills?.length > 0 || profile.interests?.length > 0) && (
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {profile.skills?.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.interests?.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.interests.map((interest, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-8 border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('posts')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'posts'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Posts
                    </button>
                    <button
                      onClick={() => setActiveTab('communities')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'communities'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Communities
                    </button>
                    <button
                      onClick={() => setActiveTab('plans')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'plans'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Learning Plans
                    </button>
                  </nav>
                </div>

                {renderTabContent()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}