// Add to src/hooks/useWebSocket.js
import { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { over } from 'stompjs';

export function useWebSocket(userId, onNotification) {
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const socket = new SockJS('http://localhost:8081/ws');
    const client = over(socket);
    
    client.connect({}, () => {
      client.subscribe(`/user/${userId}/queue/notifications`, (message) => {
        const notification = JSON.parse(message.body);
        onNotification(notification);
      });
    });

    setStompClient(client);

    return () => {
      if (client) client.disconnect();
    };
  }, [userId, onNotification]);

  return stompClient;
}