import { toast } from 'react-toastify';

const [isLiking, setIsLiking] = useState(false);
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
