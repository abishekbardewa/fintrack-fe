import { apiPrivate } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/lib/api/types';
import type {
	ChangePasswordRequest,
	MeData,
	UpdateMeRequest,
} from '@/features/settings/types';

const ME_BASE = '/me';

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

export async function getMe() {
	const { data } = await apiPrivate.get<ApiResponse<MeData>>(ME_BASE);
	return unwrapData(data, 'Failed to load profile.');
}

export async function updateMe(payload: UpdateMeRequest) {
	const { data } = await apiPrivate.patch<ApiResponse<MeData>>(ME_BASE, payload);
	return unwrapData(data, 'Failed to update profile.');
}

export async function updateAvatar(file: File) {
	const formData = new FormData();
	formData.append('avatar', file);

	const { data } = await apiPrivate.put<ApiResponse<MeData>>(
		`${ME_BASE}/avatar`,
		formData,
		{ headers: { 'Content-Type': undefined } },
	);
	return unwrapData(data, 'Failed to update avatar.');
}

export async function changePassword(payload: ChangePasswordRequest) {
	const { data } = await apiPrivate.patch<ApiResponse<null>>(
		`${ME_BASE}/password`,
		payload,
	);
	if (data.success === false) {
		throw new ApiError(
			data.message || 'Failed to change password.',
			data.statusCode ?? 0,
			data.details,
		);
	}
}
