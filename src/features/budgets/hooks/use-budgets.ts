import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	deleteBudget,
	listBudgets,
	upsertBudget,
} from '@/features/budgets/budget.service';
import type { ListBudgetsParams, UpsertBudgetRequest } from '@/features/budgets/types';
import { dashboardKeys } from '@/features/dashboard/hooks/use-dashboard';
import { transactionKeys } from '@/features/transactions/hooks/use-transactions';

export const budgetKeys = {
	all: ['budgets'] as const,
	list: (params: ListBudgetsParams) =>
		[
			...budgetKeys.all,
			'list',
			params.periodType,
			params.periodType === 'month'
				? `${params.year}-${params.month}`
				: (params.weekStart ?? ''),
		] as const,
};

export function useBudgetsQuery(params: ListBudgetsParams, enabled = true) {
	return useQuery({
		queryKey: budgetKeys.list(params),
		queryFn: () => listBudgets(params),
		enabled,
	});
}

function invalidateBudgets(queryClient: ReturnType<typeof useQueryClient>) {
	void queryClient.invalidateQueries({ queryKey: budgetKeys.all });
	void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
	void queryClient.invalidateQueries({
		queryKey: [...transactionKeys.all, 'month-summary'],
	});
}

export function useUpsertBudgetMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: UpsertBudgetRequest) => upsertBudget(payload),
		onSuccess: () => invalidateBudgets(queryClient),
	});
}

export function useDeleteBudgetMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteBudget(id),
		onSuccess: () => invalidateBudgets(queryClient),
	});
}
