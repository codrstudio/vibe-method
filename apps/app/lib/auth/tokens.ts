import { randomUUID } from 'crypto'
import { signJWT, JWTPayload } from './jwt'
import { hashPassword } from './password'
import { AuthContext, getConfig } from './config'
import { query } from '../db'

export interface UserData {
  id: string
  email: string
  name: string
  role: string
  phone?: string | null
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export async function generateTokens(
  user: UserData,
  context: AuthContext
): Promise<TokenPair> {
  const accessToken = await signJWT(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone ?? null,
      context,
    },
    context
  )

  const refreshToken = randomUUID()

  return { accessToken, refreshToken }
}

export async function saveRefreshToken(
  userId: string,
  refreshToken: string,
  context: AuthContext,
  deviceInfo?: object,
  ipAddress?: string
): Promise<void> {
  const config = getConfig(context)
  const tokenHash = await hashPassword(refreshToken)
  const expiresAt = new Date(Date.now() + config.refreshTTL * 1000)

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, expiresAt, deviceInfo ? JSON.stringify(deviceInfo) : null, ipAddress]
  )
}

export async function revokeRefreshToken(userId: string): Promise<void> {
  await query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  )
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1`,
    [userId]
  )
}
