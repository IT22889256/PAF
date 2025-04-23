// src/components/CreatePost.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [skillCategory, setSkillCategory] = useState('');
  const [tags, setTags] = useState('');
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [filePreviews, setFilePreviews] = useState([]);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).slice(0, 3 - files.length);
    
    // Validate files
    for (const file of newFiles) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error('Only image and video files are allowed');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size should be less than 10MB');
        return;
      }
      if (file.type.startsWith('video/') && file.size > 30 * 1024 * 1024) { // 30MB limit for videos
        toast.error('Video size should be less than 30MB');
        return;
      }
    }

    setFiles([...files, ...newFiles]);
    
    // Create previews
    const newPreviews = newFiles.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image'
    }));
    setFilePreviews([...filePreviews, ...newPreviews]);
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    const newPreviews = [...filePreviews];
    URL.revokeObjectURL(newPreviews[index].url); // Clean up memory
    newPreviews.splice(index, 1);
    setFilePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) {
      toast.error('Please add content or media to your post');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // First upload files if any
      const mediaUrls = [];
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formData = new FormData();
          formData.append('file', file);
          
          const { data } = await axios.post('http://localhost:8081/api/upload', formData, {
            withCredentials: true,
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              );
              setUploadProgress(prev => ({
                ...prev,
                [file.name]: progress
              }));
            }
          });
          mediaUrls.push(data.fileUrl);
        }
      }
      
      // Then create the post
      const postData = {
        content,
        skillCategory,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        mediaUrls
      };
      
      const { data: post } = await axios.post(
        'http://localhost:8081/api/posts',
        postData,
        { withCredentials: true }
      );
      
      toast.success('Post created successfully');
      setContent('');
      setSkillCategory('');
      setTags('');
      setFiles([]);
      setFilePreviews([]);
      setUploadProgress({});
      
      if (onPostCreated) {
        onPostCreated(post);
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What skill are you sharing today?"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>
        
        {/* File Previews */}
        {filePreviews.length > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-2">
            {filePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square bg-gray-100 rounded-md overflow-hidden">
                {preview.type === 'video' ? (
                  <video
                    src={preview.url}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={preview.url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                {uploadProgress[preview.name] > 0 && uploadProgress[preview.name] < 100 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50">
                    <div
                      className="h-1 bg-blue-500"
                      style={{ width: `${uploadProgress[preview.name]}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skill Category</label>
            <input
              type="text"
              value={skillCategory}
              onChange={(e) => setSkillCategory(e.target.value)}
              placeholder="e.g., Photography, Cooking"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., landscape, portrait, tutorial"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <label className="cursor-pointer px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200">
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileChange}
                multiple
                disabled={files.length >= 3 || isSubmitting}
              />
              <span className="flex items-center space-x-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm">Add Media ({files.length}/3)</span>
              </span>
            </label>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && files.length === 0)}
            className={`px-4 py-2 rounded-md ${
              isSubmitting || (!content.trim() && files.length === 0)
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}