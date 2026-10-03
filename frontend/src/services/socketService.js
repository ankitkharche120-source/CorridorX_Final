import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.activeSubscriptions = new Map();
  }

  connect() {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      autoConnect: true,
      withCredentials: true
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log(`[CorridorX Socket] Connected to central coordination engine: ${this.socket.id}`);
      
      // Resubscribe to active rooms after reconnect
      this.activeSubscriptions.forEach((room, roomType) => {
        this.socket.emit(`join:${roomType}`, room);
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.warn(`[CorridorX Socket] Disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[CorridorX Socket] Connection error:', err.message);
    });

    return this.socket;
  }

  // Room Subscription Methods
  joinTrip(tripId) {
    if (!tripId) return;
    this.activeSubscriptions.set('trip', tripId);
    if (this.socket && this.isConnected) {
      this.socket.emit('join:trip', tripId);
    }
  }

  joinAmbulance(ambulanceId) {
    if (!ambulanceId) return;
    this.activeSubscriptions.set('ambulance', ambulanceId);
    if (this.socket && this.isConnected) {
      this.socket.emit('join:ambulance', ambulanceId);
    }
  }

  joinHospital(hospitalId) {
    if (!hospitalId) return;
    this.activeSubscriptions.set('hospital', hospitalId);
    if (this.socket && this.isConnected) {
      this.socket.emit('join:hospital', hospitalId);
    }
  }

  joinControlCenter() {
    this.activeSubscriptions.set('control-center', true);
    if (this.socket && this.isConnected) {
      this.socket.emit('join:control-center');
    }
  }

  // Emitters
  sendAmbulanceTelemetry(payload) {
    if (this.socket && this.isConnected) {
      this.socket.emit('ambulance:telemetry', payload);
    }
  }

  updateAmbulanceStatus(ambulanceId, status) {
    if (this.socket && this.isConnected) {
      this.socket.emit('ambulance:status', { ambulanceId, status });
    }
  }

  updateHospitalStatus(hospitalId, updates) {
    if (this.socket && this.isConnected) {
      this.socket.emit('hospital:status', { hospitalId, ...updates });
    }
  }

  // Listeners
  onTripLocation(callback) {
    if (!this.socket) this.connect();
    this.socket.on('trip:locationUpdated', callback);
    return () => this.socket?.off('trip:locationUpdated', callback);
  }

  onTripEta(callback) {
    if (!this.socket) this.connect();
    this.socket.on('trip:etaUpdated', callback);
    return () => this.socket?.off('trip:etaUpdated', callback);
  }

  onTripStatusChanged(callback) {
    if (!this.socket) this.connect();
    this.socket.on('trip:statusChanged', callback);
    return () => this.socket?.off('trip:statusChanged', callback);
  }

  onCorridorUpdate(callback) {
    if (!this.socket) this.connect();
    this.socket.on('corridor:node-update', callback);
    return () => this.socket?.off('corridor:node-update', callback);
  }

  onBoardUpdate(callback) {
    if (!this.socket) this.connect();
    this.socket.on('board:updated', callback);
    return () => this.socket?.off('board:updated', callback);
  }

  onHospitalAlert(callback) {
    if (!this.socket) this.connect();
    this.socket.on('hospital:pre-alert', callback);
    this.socket.on('hospital:incoming-casualty', callback);
    return () => {
      this.socket?.off('hospital:pre-alert', callback);
      this.socket?.off('hospital:incoming-casualty', callback);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
