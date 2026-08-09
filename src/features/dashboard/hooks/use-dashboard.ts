import { useQuery } from '@tanstack/react-query';

import { getDashboard } from '@/features/dashboard/dashboard.service';
import type { DashboardPeriodType } from '@/features/dashboard/types';

export const dashboardKeys = {
	all: ['dashboard'] as const,
	detail: (period: DashboardPeriodType) => [...dashboardKeys.all, period] as const,
};

export function useDashboardQuery(period: DashboardPeriodType) {
	return useQuery({
		queryKey: dashboardKeys.detail(period),
		queryFn: () => getDashboard(period),
		placeholderData: (previous) => previous,
	});
}
