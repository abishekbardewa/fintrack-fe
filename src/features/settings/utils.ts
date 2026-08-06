export function userInitials(name?: string | null) {
	if (!name?.trim()) return 'FT';
	const parts = name.trim().split(/\s+/);
	const first = parts[0]?.[0] ?? '';
	const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
	return (first + second).toUpperCase() || 'FT';
}
