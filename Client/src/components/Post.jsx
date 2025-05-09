// src/components/Post.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function Post({ post, onUpdate }) {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handleLike = async () => {
    try {
      setIsLiking(true);
      const { data } = await axios.post(
        `http://localhost:8081/api/posts/${post.id}/like`,
        {},
        { withCredentials: true }
      );
      onUpdate(data);
    } catch (error) {
      console.error('Failed to like post:', error);
      toast.error('Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setIsCommenting(true);
      const { data } = await axios.post(
        `http://localhost:8081/api/posts/${post.id}/comments`,
        { content: newComment },
        { withCredentials: true }
      );
      onUpdate(data);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const { data } = await axios.post(
        `http://localhost:8081/api/posts/${post.id}/comments/${commentId}/like`,
        {},
        { withCredentials: true }
      );
      onUpdate(data);
    } catch (error) {
      console.error('Failed to like comment:', error);
      toast.error('Failed to like comment');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Post header and content */}
      {/* ... existing post content ... */}
      
      {/* Like and Comment buttons */}
      <div className="flex items-center border-t border-b border-gray-100 py-2 mb-4">
        <button
          onClick={handleLike}
          disabled={isLiking || !user}
          className={`flex items-center mr-4 ${post.likes?.includes(user?.id) ? 'text-red-500' : 'text-gray-500'} hover:text-red-600 disabled:opacity-50`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {post.likes?.length || 0}
        </button>
        
        <button className="flex items-center text-gray-500 hover:text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {post.comments?.length || 0}
        </button>
      </div>
      
      {/* Comment section */}
      <div className="mb-4">
        <div className="flex mb-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-grow px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!user}
          />
          <button
            onClick={handleAddComment}
            disabled={isCommenting || !newComment.trim() || !user}
            className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isCommenting ? 'Posting...' : 'Post'}
          </button>
        </div>

        {post.comments?.map(comment => (
          <div key={comment.id} className="flex mb-3">
            <div className="flex-grow">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <span className="font-semibold text-sm mr-2">{comment.user?.name}</span>
                  <span className="text-gray-500 text-xs">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleLikeComment(comment.id)}
                    className={`ml-auto text-xs ${comment.likes?.includes(user?.id) ? 'text-red-500' : 'text-gray-500'} hover:text-red-600`}
                    disabled={!user}
                  >
                    Like ({comment.likes?.length || 0})
                  </button>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
              
              {/* Comment replies */}
              {comment.replies?.map(reply => (
                <div key={reply.id} className="ml-6 mt-2">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center mb-1">
                      <span className="font-semibold text-xs mr-2">{reply.user?.name}</span>
                      <span className="text-gray-500 text-2xs">
                        {new Date(reply.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}