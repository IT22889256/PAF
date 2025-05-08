import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function PostCard({ 
  post, 
  onLike, 
  onComment,
  onCommentDelete,
  onFollowUser,
  isFollowingUser
}) {
  const { user } = useAuth();
  const isAuthor = user && post.userId === user.id;
  
  const [commentContent, setCommentContent] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(null);

  useEffect(() => {
    if (isFollowingUser !== undefined) {
      setIsFollowing(isFollowingUser);
    }
  }, [isFollowingUser]);

  const hasLiked = user && post.likes?.includes(user.email);

  const handleLike = async () => {
    if (!user) {
      toast.info('Please login to like posts');
      return;
    }
    
    setIsLiking(true);
    try {
      await onLike(post.id);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to toggle like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.info('Please login to follow users');
      return;
    }
    
    if (isAuthor) {
      toast.info("You can't follow yourself");
      return;
    }
  
    if (!onFollowUser || typeof onFollowUser !== 'function') {
      console.error('onFollowUser is not a function');
      toast.error('Follow functionality not available');
      return;
    }
  
    setIsFollowingLoading(true);
    try {
      const success = await onFollowUser(post.userId, !isFollowing);
      
      if (success) {
        setIsFollowing(!isFollowing);
        toast.success(!isFollowing ? 'Followed successfully' : 'Unfollowed successfully');
      } else {
        toast.error('Failed to toggle follow');
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast.error(error.response?.data?.error || 'Failed to toggle follow');
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    
    if (!user) {
      toast.info('Please login　　　　　to comment');
      return;
    }
    
    setIsCommenting(true);
    try {
      await onComment(post.id, commentContent);
      setCommentContent('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    setIsDeletingComment(commentId);
    try {
      await onCommentDelete(post.id, commentId);
      toast.success('Comment deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete comment');
    } finally {
      setIsDeletingComment(null);
    }
  };

  const LoadingSpinner = () => (
    <svg 
      className="animate-spin h-4 w-4 mr-1" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const ProfileImage = ({ src, alt, size = "w-10 h-10" }) => (
    <img
      src={src || '/default-avatar.png'}
      alt={alt || 'User'}
      className={`${size} rounded-full object-cover border-2 border-indigo-200`}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = '/default-avatar.png';
      }}
    />
  );

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border border-gray-100">
      {/* Post Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ProfileImage 
              src={post.userProfilePicture} 
              alt={post.userName || 'Author'} 
            />
            <div>
              <h3 className="font-bold text-indigo-900">{post.userName || post.user?.name}</h3>
              <p className="text-xs text-gray-500">
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          
          {!isAuthor && user && (
            <button
              onClick={handleFollow}
              disabled={isFollowingLoading}
              className={`px-4 py-1.5 text-sm rounded-full font-semibold transition-colors flex items-center ${
                isFollowing
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
              aria-label={isFollowing ? 'Unfollow user' : 'Follow user'}
            >
              {isFollowingLoading ? (
                <span className="flex items-center">
                  <LoadingSpinner />
                  {isFollowing ? 'Unfollowing...' : 'Following...'}
                </span>
              ) : (
                isFollowing ? 'Following' : 'Follow'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="p-6">
        <p className="mb-4 text-gray-800 whitespace-pre-line leading-relaxed">{post.content}</p>
        
        {post.mediaUrls?.length > 0 && (
          <div className={`grid gap-3 mb-4 ${
            post.mediaUrls.length === 1 ? 'grid-cols-1' : 
            post.mediaUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
          }`}>
            {post.mediaUrls.map((url, index) => (
              <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={url}
                  alt={`Post media ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-image.png';
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags?.map((tag, index) => (
            <span key={`tag-${index}`} className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
              #{tag}
            </span>
          ))}
          {post.skillCategory && (
            <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
              {post.skillCategory}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-6 pt-3 border-t border-gray-100">
          <button
            onClick={handleLike}
            disabled={isLiking || !user}
            className={`flex items-center space-x-1.5 text-sm font-medium transition-colors ${
              hasLiked ? 'text-red-500' : 'text-gray-500'
            } ${!user ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-600'}`}
            aria-label={hasLiked ? 'Unlike post' : 'Like post'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill={hasLiked ? 'currentColor' : 'none'}
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
            className="flex items-center space-x-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Toggle comments"
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

      {showComments && (
        <div className="bg-gray-50 p-6 border-t border-gray-100">
          {user ? (
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-gray-800"
                  disabled={isCommenting}
                  aria-label="Comment input"
                />
                <button
                  type="submit"
                  disabled={!commentContent.trim() || isCommenting}
                  className={`px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center ${
                    !commentContent.trim() || isCommenting
                      ? 'bg-indigo-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  aria-label="Submit comment"
                >
                  {isCommenting ? (
                    <>
                      <LoadingSpinner />
                      <span>Posting...</span>
                    </>
                  ) : 'Post'}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-center text-gray-500 italic mb-6 text-sm font-medium">
              Please login to add comments
            </p>
          )}

          <div className="space-y-4">
            {post.comments?.length > 0 ? (
              post.comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3">
                  <ProfileImage 
                    src={comment.userProfilePicture} 
                    alt={comment.userName || 'Commenter'} 
                    size="w-8 h-8" 
                  />
                  <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm text-indigo-900">{comment.userName}</h4>
                        <p className="text-sm text-gray-800 whitespace-pre-line mt-1">{comment.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {(user?.email === comment.userEmail || user?.email === post.userId) && (
                        <button
                          onClick={() => handleCommentDelete(comment.id)}
                          disabled={isDeletingComment === comment.id}
                          className={`text-red-500 hover:text-red-700 text-xs font-medium transition-colors ${
                            isDeletingComment === comment.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          aria-label="Delete comment"
                        >
                          {isDeletingComment === comment.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-3 text-sm font-medium">No comments yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}