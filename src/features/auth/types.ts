export type UserRole = 'user' | 'admin';

export interface AuthUser {
	id: string;
	name: string;
	email: string;
	role?: UserRole;
	currency?: string;
	timezone?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	name: string;
	email: string;
	password: string;
	currency: string;
	timezone: string;
}

export interface AuthSuccessData {
	user: AuthUser;
	accessToken: string;
}

export type LoginSuccessData = AuthSuccessData;
export type RegisterSuccessData = AuthSuccessData;
