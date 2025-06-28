import { cookies } from 'next/headers';
import { apiClient } from './api/client';

export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export interface Session {
  user: User;
  expires: Date;
}

interface AuthResponse {
  user?: {
    id: string;
    email: string;
    createdAt: string;
  };
}

const SESSION_COOKIE_NAME = 'auth-session';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function authenticateUser(
  email: string,
  password: string,
): Promise<User | null> {
  try {
    // Call external API to authenticate user
    const response = (await apiClient.authenticateUser(
      email,
      password,
    )) as AuthResponse;

    if (response?.user) {
      return {
        id: response.user.id,
        email: response.user.email,
        createdAt: new Date(response.user.createdAt),
      };
    }

    return null;
  } catch (error) {
    console.error('Authentication failed:', error);
    return null;
  }
}

export async function registerUser(
  email: string,
  password: string,
): Promise<User | null> {
  try {
    // Check if user exists
    const existingUser = await apiClient.getUser(email);
    if (
      existingUser &&
      Array.isArray(existingUser) &&
      existingUser.length > 0
    ) {
      throw new Error('User already exists');
    }

    // Create user via external API
    const response = (await apiClient.createUser(
      email,
      password,
    )) as AuthResponse;

    if (response?.user) {
      return {
        id: response.user.id,
        email: response.user.email,
        createdAt: new Date(response.user.createdAt),
      };
    }

    return null;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}

export async function createSession(user: User): Promise<void> {
  const session: Session = {
    user,
    expires: new Date(Date.now() + SESSION_DURATION),
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    expires: session.expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie) {
      return null;
    }

    const session: Session = JSON.parse(sessionCookie.value);

    // Check if session is expired
    if (new Date() > new Date(session.expires)) {
      await deleteSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user || null;
}
