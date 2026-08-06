import type { AuthUser } from '@/features/auth/types';

export interface MeData {
	user: AuthUser;
}

export interface UpdateMeRequest {
	name?: string;
	currency?: string;
}

export interface ChangePasswordRequest {
	currentPassword: string;
	newPassword: string;
}
