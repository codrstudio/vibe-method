import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { AuthContext, getConfig } from './config'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

export function setAccessCookie(
  response: NextResponse,
  token: string,
  context: AuthContext
): void {
  const config = getConfig(context)
  response.cookies.set(config.accessCookie, token, {
    ...COOKIE_OPTIONS,
    maxAge: config.accessTTL,
  })
}

export function setRefreshCookie(
  response: NextResponse,
  token: string,
  context: AuthContext
): void {
  const config = getConfig(context)
  response.cookies.set(config.refreshCookie, token, {
    ...COOKIE_OPTIONS,
    maxAge: config.refreshTTL,
  })
}

export function clearAuthCookies(response: NextResponse, context: AuthContext): void {
  const config = getConfig(context)
  response.cookies.set(config.accessCookie, '', { ...COOKIE_OPTIONS, maxAge: 0 })
  response.cookies.set(config.refreshCookie, '', { ...COOKIE_OPTIONS, maxAge: 0 })
}

export async function getAccessToken(context: AuthContext): Promise<string | undefined> {
  const config = getConfig(context)
  const cookieStore = await cookies()
  return cookieStore.get(config.accessCookie)?.value
}

export async function getRefreshToken(context: AuthContext): Promise<string | undefined> {
  const config = getConfig(context)
  const cookieStore = await cookies()
  return cookieStore.get(config.refreshCookie)?.value
}
