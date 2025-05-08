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
    for (const file of newFiles) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error('Only image and video files are allowed');
        return;
      }
      if (file.type.startsWith('video/') && file.size > 30 * 1024 * 1024) {
        toast.error('Video size should be less than 30MB');
        return;
      }
      if (!file.type.startsWith('video/') && file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB');
        return;
      }
    }

    setFiles([...files, ...newFiles]);
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
    URL.revokeObjectURL(newPreviews[index].url);
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
      const mediaUrls = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await axios.post('http://localhost:8081/api/upload', formData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          }
        });
        mediaUrls.push(data.fileUrl);
      }

      const postData = {
        content,
        skillCategory,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
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

      if (onPostCreated) onPostCreated(post);
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-200">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What skill are you sharing today?"
          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition"
          rows={4}
        />

        {filePreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6">
            {filePreviews.map((preview, index) => (
              <div
                key={index}
                className="relative rounded-xl overflow-hidden aspect-square bg-gray-100 group"
              >
                {preview.type === 'video' ? (
                  <video src={preview.url} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={preview.url} className="w-full h-full object-cover" alt="preview" />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-60 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {uploadProgress[preview.name] > 0 && uploadProgress[preview.name] < 100 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-40">
                    <div
                      className="h-1.5 bg-indigo-500 transition-all"
                      style={{ width: `${uploadProgress[preview.name]}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skill Category</label>
            <input
              type="text"
              value={skillCategory}
              onChange={(e) => setSkillCategory(e.target.value)}
              placeholder="e.g., Cooking, Editing"
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., tutorial, vegan, DSLR"
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <label className="cursor-pointer flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl transition">
            <input
              type="file"
              className="hidden"
              accept="image/*,video/*"
              multiple
              disabled={files.length >= 3 || isSubmitting}
              onChange={handleFileChange}
            />
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-medium">Add Media ({files.length}/3)</span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && files.length === 0)}
            className={`px-6 py-2 rounded-xl font-semibold transition ${
              isSubmitting || (!content.trim() && files.length === 0)
                ? 'bg-indigo-300 cursor-not-allowed text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow'
            }`}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
