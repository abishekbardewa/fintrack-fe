const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export function getAccessToken(): string | null {
	return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string) {
	localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthStorage() {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
}

export function readStoredJson<T>(key: string): T | null {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

export function writeStoredJson(key: string, value: unknown) {
	localStorage.setItem(key, JSON.stringify(value));
}

export { TOKEN_KEY, USER_KEY };
