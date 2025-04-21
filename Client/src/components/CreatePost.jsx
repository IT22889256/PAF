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