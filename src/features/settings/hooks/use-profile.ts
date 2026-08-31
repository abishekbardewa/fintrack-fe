import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAppDispatch } from '@/app/hooks';
import { setUser } from '@/features/auth/authSlice';
import { dashboardKeys } from '@/features/dashboard/hooks/use-dashboard';
import { goalKeys } from '@/features/goals/hooks/use-goals';
import { investmentKeys } from '@/features/investments/hooks/use-investments';
import { savingKeys } from '@/features/savings/hooks/use-savings';
import {
	changePassword,
	getMe,
	updateAvatar,
	updateMe,
} from '@/features/settings/profile.service';
import type { ChangePasswordRequest, UpdateMeRequest } from '@/features/settings/types';
import { trendsKeys } from '@/features/trends/hooks/use-trends';

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
			void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
			void queryClient.invalidateQueries({ queryKey: goalKeys.all });
			void queryClient.invalidateQueries({ queryKey: savingKeys.all });
			void queryClient.invalidateQueries({ queryKey: ['savings-circles'] });
			void queryClient.invalidateQueries({ queryKey: investmentKeys.all });
			void queryClient.invalidateQueries({ queryKey: trendsKeys.all });
		},
	});
}

export function useUpdateAvatarMutation() {
	const queryClient = useQueryClient();
	const dispatch = useAppDispatch();

	return useMutation({
		mutationFn: (file: File) => updateAvatar(file),
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
