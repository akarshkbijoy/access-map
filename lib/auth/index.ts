import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'accessmap-super-secret-key-change-in-prod'

export interface UserSession {
    user_id: number;
    email: string;
    role: string;
}

export async function signToken(payload: UserSession) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export async function verifyToken(token: string) {
    try {
        return jwt.verify(token, JWT_SECRET) as UserSession
    } catch (error) {
        return null
    }
}

export async function getSession() {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) return null

    return await verifyToken(token)
}

export async function clearSession() {
    const cookieStore = await cookies()
    cookieStore.delete('auth_token')
}
