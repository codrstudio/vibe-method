import { SignJWT, jwtVerify, JWTPayload as JoseJWTPayload } from 'jose'
import { AuthContext, getConfig } from './config'

export interface JWTPayload extends JoseJWTPayload {
  sub: string
  email: string
  name: string
  role: string
  phone?: string | null
  context: AuthContext
}

export async function signJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  context: AuthContext
): Promise<string> {
  const config = getConfig(context)
  const secret = new TextEncoder().encode(config.jwtSecret)

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${config.accessTTL}s`)
    .sign(secret)
}

export async function verifyJWT(
  token: string,
  context: AuthContext
): Promise<JWTPayload | null> {
  const config = getConfig(context)
  const secret = new TextEncoder().encode(config.jwtSecret)

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as JWTPayload
  } catch {
    return null
  }
}
