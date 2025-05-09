const [userAvatars, setUserAvatars] = useState({});

const fetchNotifications = async () => {
  try {
    const { data } = await axios.get('http://localhost:8081/api/notifications', { withCredentials: true });
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.read).length);

    const senderIds = [...new Set(data.map(n => n.senderId))].filter(id => id && !userAvatars[id]);
    if (senderIds.length > 0) {
      const newAvatars = {};
      await Promise.all(senderIds.map(async id => {
        try {
          const response = await axios.get(`http://localhost:8081/api/users/${id}`, { withCredentials: true });
          newAvatars[id] = response.data.avatar || '/default-avatar.png';
        } catch (error) {
          console.error(`Failed to fetch avatar for user ${id}:`, error);
          newAvatars[id] = '/default-avatar.png';
        }
      }));
      setUserAvatars(prev => ({ ...prev, ...newAvatars }));
    }
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    toast.error('Failed to load notifications');
  }
};

