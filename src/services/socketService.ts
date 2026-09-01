// @ts-nocheck
import { io, Socket } from 'socket.io-client';
import { BASE_URL } from './apiClient';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    // Connect to backend via WebSockets
    const socketUrl = BASE_URL.replace('/api', '');
    console.log(`⚡ Connecting Socket.io client to ${socketUrl}...`);
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log(`🟢 [Socket.io] Connected successfully! Socket ID: ${socket.id}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔴 [Socket.io] Disconnected: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      console.log(`⚠️ [Socket.io] Connection Error: ${error.message}`);
    });
  }
  return socket;
};

export const subscribeToOrderUpdates = (callback: (orderData: any) => void) => {
  const s = getSocket();
  s.on('order_status_updated', callback);
  s.on('new_order_placed', callback);

  return () => {
    s.off('order_status_updated', callback);
    s.off('new_order_placed', callback);
  };
};

export const subscribeToMaintenanceUpdates = (callback: (data: any) => void) => {
  const s = getSocket();
  s.on('maintenance_mode_updated', callback);
  s.on('settings_updated', callback);

  return () => {
    s.off('maintenance_mode_updated', callback);
    s.off('settings_updated', callback);
  };
};
