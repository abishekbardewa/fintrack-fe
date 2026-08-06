import axios from 'axios';

import { env } from '@/config/env';
import { clearAuthStorage, getAccessToken } from '@/lib/api/storage';

export const api = axios.create({
	baseURL: env.apiUrl,
	headers: {
		'Content-Type': 'application/json',
	},
});

export const apiPrivate = axios.create({
	baseURL: env.apiUrl,
	headers: {
		'Content-Type': 'application/json',
	},
});

apiPrivate.interceptors.request.use(
	(config) => {
		const accessToken = getAccessToken();
		if (accessToken) {
			config.headers.Authorization = `Bearer ${accessToken}`;
		}
		return config;
	},
	(error) => Promise.reject(error),
);

apiPrivate.interceptors.response.use(
	(response) => response,
	(error) => {
		if (axios.isAxiosError(error) && error.response?.status === 401) {
			const url = error.config?.url ?? '';
			const isPasswordChange = url.includes('/me/password');
			if (!isPasswordChange) {
				clearAuthStorage();
				if (window.location.pathname !== '/login') {
					window.location.assign('/login');
				}
			}
		}
		return Promise.reject(error);
	},
);
