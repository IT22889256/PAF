// src/components/PostCard.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function PostCard({ post, onDelete, onLike, onComment }) {
  const { user } = useAuth();
  const [commentContent, setCommentContent] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLike = async () => {
    if (!user) return;
    setIsLiking(true);
    try {
      await onLike(post.id);
    } catch (error) {
      toast.error('Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    setIsCommenting(true);
    try {
      await onComment(post.id, commentContent);
      setCommentContent('');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(post.id);
    } catch (error) {
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      {/* Post Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={post.user?.profilePicture || '/default-avatar.png'}
              alt={post.user?.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold">{post.user?.name}</h3>
              <p className="text-xs text-gray-500">
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          {user?.email === post.userId && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <p className="mb-3">{post.content}</p>
        
        {/* Media Gallery */}
        {post.mediaUrls?.length > 0 && (
          <div className={`grid gap-2 mb-3 ${
            post.mediaUrls.length === 1 ? 'grid-cols-1' : 
            post.mediaUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
          }`}>
            {post.mediaUrls.map((url, index) => (
              <div key={index} className="relative aspect-square bg-gray-100 rounded-md overflow-hidden">
                <img
                  src={url}
                  alt={`Post media ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Skill Category */}
        {post.skillCategory && (
          <div className="mb-3">
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              {post.skillCategory}
            </span>
          </div>
        )}

        {/* Like and Comment Buttons */}
        <div className="flex items-center space-x-4 pt-2 border-t">
          <button
            onClick={handleLike}
            disabled={isLiking || !user}
            className={`flex items-center space-x-1 ${
              post.likes?.includes(user?.email) ? 'text-red-500' : 'text-gray-500'
            } ${!user ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-600'}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill={post.likes?.includes(user?.email) ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>{post.likes?.length || 0}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-gray-500 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>{post.comments?.length || 0}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="bg-gray-50 p-4 border-t">
          {/* Comment Form */}
          {user && (
            <form onSubmit={handleCommentSubmit} className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCommenting}
                />
                <button
                  type="submit"
                  disabled={!commentContent.trim() || isCommenting}
                  className={`px-3 py-2 rounded-md ${
                    !commentContent.trim() || isCommenting
                      ? 'bg-blue-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {isCommenting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {post.comments?.length > 0 ? (
              post.comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-2">
                  <img
                    src={comment.user?.profilePicture || '/default-avatar.png'}
                    alt={comment.user?.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 bg-white p-2 rounded-md shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm">{comment.user?.name}</h4>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      {(user?.email === comment.userId || user?.email === post.userId) && (
                        <button
                          onClick={() => onCommentDelete(post.id, comment.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-2">No comments yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}