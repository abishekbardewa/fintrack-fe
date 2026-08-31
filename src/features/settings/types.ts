import type { AuthUser } from '@/features/auth/types';

export interface MeData {
	user: AuthUser;
}

export interface UpdateMeRequest {
	name?: string;
	currency?: string;
	openingBalance?: {
		amount: number;
		currency: string;
	};
	startingBalancePromptDismissed?: true;
}

export interface ChangePasswordRequest {
	currentPassword: string;
	newPassword: string;
}
