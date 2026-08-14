export const MAX_AVATAR_SIZE_MB = 10;
export const MAX_AVATAR_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

export const ALLOWED_AVATAR_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
] as const;

export const AVATAR_ACCEPT = ALLOWED_AVATAR_TYPES.join(',');

export function validateAvatarFile(file: File) {
	if (!(ALLOWED_AVATAR_TYPES as readonly string[]).includes(file.type)) {
		return 'Only JPEG, PNG, WebP, or GIF.';
	}
	if (file.size > MAX_AVATAR_BYTES) return `Image must be under ${MAX_AVATAR_SIZE_MB} MB.`;
	return null;
}

export function formatFileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function userInitials(name?: string | null) {
	if (!name?.trim()) return 'FT';
	const parts = name.trim().split(/\s+/);
	const first = parts[0]?.[0] ?? '';
	const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
	return (first + second).toUpperCase() || 'FT';
}
