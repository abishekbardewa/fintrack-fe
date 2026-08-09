import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAppSelector } from '@/app/hooks';
import { selectUser } from '@/features/auth/authSlice';

export function AuthQueryCacheReset() {
	const userId = useAppSelector(selectUser)?.id ?? null;
	const queryClient = useQueryClient();
	const previousUserIdRef = useRef(userId);

	useEffect(() => {
		if (previousUserIdRef.current === userId) return;
		previousUserIdRef.current = userId;
		queryClient.clear();
	}, [userId, queryClient]);

	return null;
}
