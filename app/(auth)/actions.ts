'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';

import { registerUser, createSession } from '@/lib/auth';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Hardcoded credentials check
  if (email === 'a@gmail.com' && password === '1') {
    const user = {
      id: 'hardcoded-user-id',
      email: 'a@gmail.com',
      createdAt: new Date(),
    };

    await createSession(user);
    redirect('/');
  } else {
    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const user = await registerUser(
      validatedData.email,
      validatedData.password,
    );

    if (user) {
      await createSession(user);
      redirect('/');
    } else {
      return { status: 'failed' };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    if (error instanceof Error && error.message === 'User already exists') {
      return { status: 'user_exists' };
    }

    return { status: 'failed' };
  }
};
