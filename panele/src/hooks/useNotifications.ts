// src/hooks/useNotifications.ts
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { getUnreadNotificationCount, getMyNotifications, type UserNotification } from '../api/notificationsApi';

const SOCKET_URL = 'http://localhost:3000';

export const useNotifications = () => {
  const { accessToken, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<UserNotification[]>([]);
  const [connected, setConnected] = useState(false);

  // Socket bağlantısı
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    const newSocket = io(`${SOCKET_URL}/notifications`, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      loadUnreadCount();
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connected', (data) => {
      console.log('Socket authenticated:', data);
    });

    newSocket.on('notification', (notification) => {
      console.log('New notification received:', notification);
      // Yeni bildirim geldiğinde listeyi güncelle
      loadRecentNotifications();
      loadUnreadCount();
    });

    newSocket.on('unread-count-update', ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken]);

  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, [isAuthenticated]);

  const loadRecentNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const result = await getMyNotifications({ limit: 10, isRead: false });
      setRecentNotifications(result.data);
    } catch (error) {
      console.error('Failed to load recent notifications:', error);
    }
  }, [isAuthenticated]);

  // İlk yükleme
  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
      loadRecentNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return {
    socket,
    connected,
    unreadCount,
    recentNotifications,
    refreshNotifications: loadRecentNotifications,
    refreshUnreadCount: loadUnreadCount,
  };
};

