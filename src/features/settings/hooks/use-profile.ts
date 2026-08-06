import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAppDispatch } from '@/app/hooks';
import { setUser } from '@/features/auth/authSlice';
import {
	changePassword,
	getMe,
	updateMe,
} from '@/features/settings/profile.service';
import type { ChangePasswordRequest, UpdateMeRequest } from '@/features/settings/types';

export const profileKeys = {
	all: ['profile'] as const,
	me: () => [...profileKeys.all, 'me'] as const,
};

export function useMeQuery() {
	const dispatch = useAppDispatch();

	return useQuery({
		queryKey: profileKeys.me(),
		queryFn: async () => {
			const data = await getMe();
			dispatch(setUser(data.user));
			return data;
		},
	});
}

export function useUpdateMeMutation() {
	const queryClient = useQueryClient();
	const dispatch = useAppDispatch();

	return useMutation({
		mutationFn: (payload: UpdateMeRequest) => updateMe(payload),
		onSuccess: (data) => {
			dispatch(setUser(data.user));
			queryClient.setQueryData(profileKeys.me(), data);
		},
	});
}

export function useChangePasswordMutation() {
	return useMutation({
		mutationFn: (payload: ChangePasswordRequest) => changePassword(payload),
	});
}
