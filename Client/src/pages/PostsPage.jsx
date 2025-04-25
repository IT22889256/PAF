// src/pages/PostsPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';

export default function PostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get('http://localhost:8081/api/posts', {
        withCredentials: true
      });
      setPosts(data);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`http://localhost:8081/api/posts/${postId}`, {
        withCredentials: true
      });
      setPosts(posts.filter(post => post.id !== postId));
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
      setPosts(posts.map(post => 
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
      setPosts(posts.map(post => 
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
      setPosts(posts.map(post => 
        post.id === postId ? updatedPost : post
      ));
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchPosts}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {user && <CreatePost onPostCreated={handlePostCreated} />}
        
        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={handleDeletePost}
                onLike={handleLikePost}
                onComment={handleAddComment}
                onCommentDelete={handleDeleteComment}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No posts yet. Be the first to share!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}