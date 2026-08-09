import type { AuthUser, UserRole } from '@/features/auth/types';

export function getUserRole(user: AuthUser | null | undefined): UserRole {
	return user?.role === 'admin' ? 'admin' : 'user';
}

export function homePathForRole(role: UserRole): string {
	return role === 'admin' ? '/admin/exchange-rates' : '/dashboard';
}

export function homePathForUser(user: AuthUser | null | undefined): string {
	return homePathForRole(getUserRole(user));
}
