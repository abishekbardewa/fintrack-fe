import { useQuery } from '@tanstack/react-query';

import { useAppSelector } from '@/app/hooks';
import { selectUser } from '@/features/auth/authSlice';
import { getTrends } from '@/features/trends/trends.service';
import type { TrendsRangeType } from '@/features/trends/types';
import { toApiError } from '@/lib/api/errors';

export const trendsKeys = {
	all: ['trends'] as const,
	detail: (userId: string, range: TrendsRangeType, categoryIds: string[]) =>
		[...trendsKeys.all, userId, range, [...categoryIds].sort().join(',')] as const,
};

export function useTrendsQuery(range: TrendsRangeType, categoryIds: string[] = []) {
	const userId = useAppSelector(selectUser)?.id ?? '';

	return useQuery({
		queryKey: trendsKeys.detail(userId, range, categoryIds),
		queryFn: () => getTrends(range, categoryIds),
		enabled: Boolean(userId),
		placeholderData: (previous) => previous,
		retry: (failureCount, error) => {
			if (toApiError(error).statusCode === 422) return false;
			return failureCount < 1;
		},
	});
}
