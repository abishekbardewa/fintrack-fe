import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { AuthUser } from '@/features/auth/types';
import {
	clearAuthStorage,
	getAccessToken,
	readStoredJson,
	setAccessToken,
	USER_KEY,
	writeStoredJson,
} from '@/lib/api/storage';

interface AuthState {
	user: AuthUser | null;
	isAuthenticated: boolean;
}

const initialState: AuthState = {
	user: readStoredJson<AuthUser>(USER_KEY),
	isAuthenticated: Boolean(getAccessToken()),
};

export const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		setCredentials: (state, action: PayloadAction<{ user: AuthUser; accessToken: string }>) => {
			state.user = action.payload.user;
			state.isAuthenticated = true;
			setAccessToken(action.payload.accessToken);
			writeStoredJson(USER_KEY, action.payload.user);
		},
		setUser: (state, action: PayloadAction<AuthUser | null>) => {
			state.user = action.payload;
			state.isAuthenticated = Boolean(action.payload && getAccessToken());
			if (action.payload) {
				writeStoredJson(USER_KEY, action.payload);
			}
		},
		clearUser: (state) => {
			state.user = null;
			state.isAuthenticated = false;
			clearAuthStorage();
		},
	},
});

export const { setCredentials, setUser, clearUser } = authSlice.actions;

export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;

export default authSlice.reducer;
