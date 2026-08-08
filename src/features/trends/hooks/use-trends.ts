import { useQuery } from '@tanstack/react-query';

import { getTrends } from '@/features/trends/trends.service';
import type { TrendsRangeType } from '@/features/trends/types';

export const trendsKeys = {
	all: ['trends'] as const,
	detail: (range: TrendsRangeType, categoryIds: string[]) =>
		[...trendsKeys.all, range, [...categoryIds].sort().join(',')] as const,
};

export function useTrendsQuery(range: TrendsRangeType, categoryIds: string[] = []) {
	return useQuery({
		queryKey: trendsKeys.detail(range, categoryIds),
		queryFn: () => getTrends(range, categoryIds),
		placeholderData: (previous) => previous,
	});
}
