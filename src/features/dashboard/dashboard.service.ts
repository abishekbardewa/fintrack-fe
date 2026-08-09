import { apiPrivate } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/lib/api/types';
import type { DashboardData, DashboardPeriodType } from '@/features/dashboard/types';

const DASHBOARD_BASE = '/dashboard';

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

export async function getDashboard(period: DashboardPeriodType) {
	const { data } = await apiPrivate.get<ApiResponse<DashboardData>>(DASHBOARD_BASE, {
		params: { period },
	});
	return unwrapData(data, 'Failed to load dashboard.');
}
