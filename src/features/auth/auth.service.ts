import { api } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import { ApiError } from '@/lib/api/errors';
import type {
	AuthUser,
	LoginRequest,
	LoginSuccessData,
	RegisterRequest,
	RegisterSuccessData,
} from '@/features/auth/types';

const AUTH_BASE = '/auth';

function normalizeUser(user: AuthUser & { _id?: string }): AuthUser {
	const { _id, ...rest } = user;
	return {
		...rest,
		id: user.id || _id || '',
		role: user.role === 'admin' ? 'admin' : 'user',
	};
}

function unwrapData<T>(body: ApiResponse<T>, fallbackMessage: string): T {
	if (!body.success || body.data == null) {
		throw new ApiError(
			body.message || fallbackMessage,
			body.statusCode ?? 0,
			body.success === false ? body.details : undefined,
		);
	}
	return body.data;
}

export async function loginUser(payload: LoginRequest): Promise<LoginSuccessData> {
	const { data } = await api.post<ApiResponse<LoginSuccessData>>(`${AUTH_BASE}/login`, payload);
	const result = unwrapData(data, 'Login failed. Please try again.');
	if (!result.accessToken || !result.user) {
		throw new ApiError('Login failed. Please try again.', data.statusCode ?? 0);
	}
	return {
		accessToken: result.accessToken,
		user: normalizeUser(result.user),
	};
}

export async function registerUser(payload: RegisterRequest): Promise<RegisterSuccessData> {
	const { data } = await api.post<ApiResponse<RegisterSuccessData>>(
		`${AUTH_BASE}/create-account`,
		payload,
	);
	const result = unwrapData(data, 'Registration failed. Please try again.');
	if (!result.accessToken || !result.user) {
		throw new ApiError('Registration failed. Please try again.', data.statusCode ?? 0);
	}
	return {
		accessToken: result.accessToken,
		user: normalizeUser(result.user),
	};
}
