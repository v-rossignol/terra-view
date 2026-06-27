/** Socket.IO HTTP path (see contracts/asyncapi.yaml). */
export const SOCKET_IO_PATH = '/infinity/socket.io';

/** Same-origin URL so the auth cookie is sent (Vite/Caddy proxy `/infinity/*` → backend). */
export function getSocketUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.origin;
}
