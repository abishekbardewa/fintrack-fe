import { z } from 'zod';

const envSchema = z.object({
	VITE_APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
	VITE_API_URL: z.string().min(1, 'VITE_API_URL is required'),
});

const parsed = envSchema.safeParse({
	VITE_APP_ENV: import.meta.env.VITE_APP_ENV ?? import.meta.env.MODE,
	VITE_API_URL: import.meta.env.VITE_API_URL,
});

if (!parsed.success) {
	console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
	throw new Error('Invalid environment variables. Check .env.example and your local/host env.');
}

export const env = {
	appEnv: parsed.data.VITE_APP_ENV,
	apiUrl: parsed.data.VITE_API_URL,
	isDev: parsed.data.VITE_APP_ENV === 'development',
	isProd: parsed.data.VITE_APP_ENV === 'production',
} as const;
