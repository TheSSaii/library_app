import { API_URL, REQUEST_TIMEOUT_MS } from '@/config/env';
import type { AuthResult } from '@/types';

import { createApiClient } from './client';

/**
 * VERSIÓN PROVISIONAL (semana 9). La API exige un token pero todavía no hay pantallas de inicio de
 * sesión, así que la app entra con tu estudiante de prueba (variables del .env) la primera vez que
 * lo necesita. ⚠️ Se elimina en la semana 10: nunca dejes credenciales en una app real.
 */
const publicApi = createApiClient({ baseUrl: API_URL, timeoutMs: REQUEST_TIMEOUT_MS });

let token: string | null = null;

async function demoLogin(): Promise<string> {
  const email = process.env.EXPO_PUBLIC_DEV_EMAIL;
  const password = process.env.EXPO_PUBLIC_DEV_PASSWORD;
  if (!email || !password) {
    throw new Error('Define EXPO_PUBLIC_DEV_EMAIL y EXPO_PUBLIC_DEV_PASSWORD en el archivo .env');
  }
  const result = await publicApi.post<AuthResult>(
    '/api/auth/login',
    { email, password },
    { auth: false },
  );
  token = result.tokens.idToken;
  return token;
}

export const api = createApiClient({
  baseUrl: API_URL,
  timeoutMs: REQUEST_TIMEOUT_MS,
  auth: {
    getAccessToken: async () => token ?? demoLogin(),
    refreshSession: async () => {
      await demoLogin();
      return true;
    },
  },
});
