/**
 * Authentication Middleware
 *
 * JWT validation on handshake, not per-event.
 * Following REALTIME.md pattern.
 *
 * Reads token from HTTP-only cookie (access-team or access-customer).
 */

import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { config } from '../../config.js';
import type { SocketUser, SocketData, ClientToServerEvents, ServerToClientEvents, InterServerEvents } from '../types.js';

type AuthSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  organizationId?: string;
  context?: 'team' | 'customer';
  iat: number;
  exp: number;
}

type AuthContext = 'team' | 'customer';

interface ExtractedToken {
  token: string;
  context: AuthContext;
}

/**
 * Extract token from handshake
 * Priority: 1) Cookie (access-team or access-customer), 2) auth.token fallback
 * Returns token and context for proper secret selection
 */
function extractToken(socket: AuthSocket): ExtractedToken | undefined {
  // Try to get from cookies first (HTTP-only cookie flow)
  const cookieHeader = socket.handshake.headers.cookie;
  if (cookieHeader) {
    const cookies = cookie.parse(cookieHeader);
    // Try team context first, then customer
    if (cookies['access-team']) {
      return { token: cookies['access-team'], context: 'team' };
    }
    if (cookies['access-customer']) {
      return { token: cookies['access-customer'], context: 'customer' };
    }
  }

  // Fallback to auth.token (for non-browser clients or testing)
  // Default to team context for backwards compatibility
  const authToken = socket.handshake.auth.token as string | undefined;
  if (authToken) {
    return { token: authToken, context: 'team' };
  }

  return undefined;
}

/**
 * Get JWT secret for context
 */
function getSecretForContext(context: AuthContext): string {
  return context === 'team' ? config.jwt.secretTeam : config.jwt.secretCustomer;
}

/**
 * Authentication middleware for Socket.io
 *
 * Validates JWT token from HTTP-only cookie and attaches user data to socket.
 *
 * @example
 * // Client connection (browser with cookies)
 * const socket = io('/hub', { withCredentials: true });
 */
export function authMiddleware(
  socket: AuthSocket,
  next: (err?: Error) => void
): void {
  const extracted = extractToken(socket);

  if (!extracted) {
    return next(new Error('Authentication required: No token provided'));
  }

  const { token, context } = extracted;
  const secret = getSecretForContext(context);

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Attach user data to socket
    const user: SocketUser = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId,
    };

    socket.data.user = user;
    socket.data.joinedRooms = new Set();

    // Auto-join user's private room
    socket.join(`user:${user.id}`);
    socket.data.joinedRooms.add(`user:${user.id}`);

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Authentication failed: Token expired'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Authentication failed: Invalid token'));
    }
    return next(new Error('Authentication failed: Unknown error'));
  }
}

/**
 * Optional: Role-based access middleware factory
 *
 * @example
 * hubNamespace.use(requireRole(['admin', 'attendant']));
 */
export function requireRole(allowedRoles: string[]) {
  return (socket: AuthSocket, next: (err?: Error) => void): void => {
    const user = socket.data.user;

    if (!user) {
      return next(new Error('Authorization failed: No user data'));
    }

    if (!allowedRoles.includes(user.role)) {
      return next(new Error(`Authorization failed: Role '${user.role}' not allowed`));
    }

    next();
  };
}
