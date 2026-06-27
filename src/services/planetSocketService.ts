import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENTS, type PlanetUpdatePayload, type UnitUpdatePayload } from '../types/socket';
import { Logger } from '../utils/logger';
import { getSocketUrl, SOCKET_IO_PATH } from '../utils/socketUrl';

const logger = new Logger('PlanetSocketService');

type UnitUpdateHandler = (payload: UnitUpdatePayload) => void;

class PlanetSocketService {
  private socket: Socket | null = null;
  private joinedPlanetId: string | null = null;
  private unitUpdateHandlers = new Set<UnitUpdateHandler>();
  private connectPromise: Promise<Socket> | null = null;

  private handleUnitUpdate = (payload: UnitUpdatePayload) => {
    this.logReceived(SOCKET_EVENTS.UNIT_UPDATE, payload);
    for (const handler of this.unitUpdateHandlers) {
      handler(payload);
    }
  };

  private handlePlanetUpdate = (payload: PlanetUpdatePayload) => {
    this.logReceived(SOCKET_EVENTS.PLANET_UPDATE, payload);
  };

  private logReceived(event: string, payload: unknown): void {
    logger.debug('received', { event, payload });
  }

  private emitEvent(socket: Socket, event: string, payload: unknown): void {
    logger.debug('emit', { event, payload });
    socket.emit(event, payload);
  }

  private ensureListeners(socket: Socket): void {
    socket.off(SOCKET_EVENTS.UNIT_UPDATE, this.handleUnitUpdate);
    socket.on(SOCKET_EVENTS.UNIT_UPDATE, this.handleUnitUpdate);
    socket.off(SOCKET_EVENTS.PLANET_UPDATE, this.handlePlanetUpdate);
    socket.on(SOCKET_EVENTS.PLANET_UPDATE, this.handlePlanetUpdate);
  }

  async connect(): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.connectPromise != null) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise((resolve, reject) => {
      const socket = io(getSocketUrl(), {
        path: SOCKET_IO_PATH,
        transports: ['websocket'],
        withCredentials: true,
      });

      const onConnect = () => {
        cleanup();
        this.socket = socket;
        this.ensureListeners(socket);
        this.connectPromise = null;
        logger.debug('WebSocket connected', { id: socket.id });
        resolve(socket);
      };

      const onConnectError = (error: Error) => {
        cleanup();
        this.connectPromise = null;
        reject(error);
      };

      const cleanup = () => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onConnectError);
      };

      socket.once('connect', onConnect);
      socket.once('connect_error', onConnectError);
    });

    return this.connectPromise;
  }

  async joinPlanet(planetId: string): Promise<void> {
    const socket = await this.connect();

    if (this.joinedPlanetId === planetId) {
      return;
    }

    if (this.joinedPlanetId != null) {
      this.emitEvent(socket, SOCKET_EVENTS.PLANET_LEAVE, { planetId: this.joinedPlanetId });
    }

    this.emitEvent(socket, SOCKET_EVENTS.PLANET_JOIN, { planetId });
    this.joinedPlanetId = planetId;
  }

  leavePlanet(): void {
    if (this.socket == null || this.joinedPlanetId == null) {
      return;
    }

    this.emitEvent(this.socket, SOCKET_EVENTS.PLANET_LEAVE, { planetId: this.joinedPlanetId });
    this.joinedPlanetId = null;
  }

  subscribeUnitUpdate(handler: UnitUpdateHandler): () => void {
    this.unitUpdateHandlers.add(handler);
    return () => {
      this.unitUpdateHandlers.delete(handler);
    };
  }

  async subscribeToPlanet(planetId: string, handler: UnitUpdateHandler): Promise<() => void> {
    await this.joinPlanet(planetId);
    return this.subscribeUnitUpdate(handler);
  }

  disconnect(): void {
    this.leavePlanet();
    this.unitUpdateHandlers.clear();

    if (this.socket != null) {
      this.socket.off(SOCKET_EVENTS.UNIT_UPDATE, this.handleUnitUpdate);
      this.socket.off(SOCKET_EVENTS.PLANET_UPDATE, this.handlePlanetUpdate);
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectPromise = null;
  }
}

export const planetSocketService = new PlanetSocketService();
