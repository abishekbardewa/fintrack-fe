import { useEffect, useState } from 'react';

const STORAGE_KEY = 'fintrack.sidebar-collapsed';

export function useSidebarCollapsed() {
	const [collapsed, setCollapsed] = useState(() => {
		try {
			return window.localStorage.getItem(STORAGE_KEY) === '1';
		} catch {
			return false;
		}
	});

	useEffect(() => {
		try {
			window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
		} catch {
			// Ignore quota / private-mode write failures.
		}
	}, [collapsed]);

	return [collapsed, setCollapsed] as const;
}
