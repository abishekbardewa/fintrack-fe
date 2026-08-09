import { apiPrivate } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/lib/api/types';
import type { TrendsData, TrendsRangeType } from '@/features/trends/types';

const TRENDS_BASE = '/trends';

function unwrapData<T>(body: ApiResponse<T>, fallbackMessage: string): T {
	if (!body.success || body.data == null) {
		throw new ApiError(
			body.message || fallbackMessage,
			body.statusCode ?? 0,
			body.success === false ? body.details : undefined,
		);
	}
	return body.data;
}

export async function getTrends(range: TrendsRangeType, categoryIds: string[] = []) {
	const { data } = await apiPrivate.get<ApiResponse<TrendsData>>(TRENDS_BASE, {
		params: {
			range,
			...(categoryIds.length > 0 ? { categoryIds: categoryIds.join(',') } : {}),
		},
	});
	return unwrapData(data, 'Failed to load trends.');
}
