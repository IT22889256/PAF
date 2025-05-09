import { BellIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { toast } from "react-toastify";

const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [showNotifications, setShowNotifications] = useState(false);
const notificationRef = useRef(null);

useEffect(() => {
  if (user) {
    fetchNotifications();
  }

  function handleClickOutside(event) {
    if (
      notificationRef.current &&
      !notificationRef.current.contains(event.target)
    ) {
      setShowNotifications(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [user]);

const fetchNotifications = async () => {
  try {
    const { data } = await axios.get(
      "http://localhost:8081/api/notifications",
      { withCredentials: true }
    );
    setNotifications(data);
    setUnreadCount(data.filter((n) => !n.read).length);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    toast.error("Failed to load notifications");
  }
};
