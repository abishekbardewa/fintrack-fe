import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/hooks/use-dashboard';
import { goalKeys } from '@/features/goals/hooks/use-goals';
import { investmentKeys } from '@/features/investments/hooks/use-investments';
import { savingKeys } from '@/features/savings/hooks/use-savings';
import { trendsKeys } from '@/features/trends/hooks/use-trends';
import {
	createTransaction,
	deleteTransaction,
	getTransactionMonthSummary,
	importTransactions,
	listTransactions,
	suggestDescriptions,
	updateTransaction,
} from '@/features/transactions/transaction.service';
import type {
	CreateTransactionRequest,
	ImportTransactionsRequest,
	TransactionListParams,
	TransactionMonthSummaryParams,
	UpdateTransactionRequest,
} from '@/features/transactions/types';

function invalidateAnalytics(queryClient: ReturnType<typeof useQueryClient>) {
	void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
	void queryClient.invalidateQueries({ queryKey: goalKeys.all });
	void queryClient.invalidateQueries({ queryKey: savingKeys.all });
	void queryClient.invalidateQueries({ queryKey: ['savings-circles'] });
	void queryClient.invalidateQueries({ queryKey: investmentKeys.all });
	void queryClient.invalidateQueries({ queryKey: trendsKeys.all });
}

export const transactionKeys = {
	all: ['transactions'] as const,
	list: (params: TransactionListParams) => [...transactionKeys.all, 'list', params] as const,
	monthSummary: (params: TransactionMonthSummaryParams) =>
		[...transactionKeys.all, 'month-summary', params] as const,
	suggestions: (params: {
		categoryId: string;
		subcategoryId?: string;
		type?: string;
	}) => [...transactionKeys.all, 'suggestions', params] as const,
};

export function useTransactionsQuery(params: TransactionListParams) {
	return useQuery({
		queryKey: transactionKeys.list(params),
		queryFn: () => listTransactions(params),
		placeholderData: (previous) => previous,
	});
}

export function useTransactionMonthSummaryQuery(params: TransactionMonthSummaryParams) {
	return useQuery({
		queryKey: transactionKeys.monthSummary(params),
		queryFn: () => getTransactionMonthSummary(params),
	});
}

export function useSuggestDescriptionsQuery(
	params: { categoryId: string; subcategoryId?: string; type?: string },
	enabled: boolean,
) {
	return useQuery({
		queryKey: transactionKeys.suggestions(params),
		queryFn: () => suggestDescriptions(params),
		enabled: enabled && Boolean(params.categoryId),
		staleTime: 5 * 60 * 1000,
	});
}

export function useCreateTransactionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateTransactionRequest) => createTransaction(payload),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
			invalidateAnalytics(queryClient);
		},
	});
}

export function useUpdateTransactionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdateTransactionRequest }) =>
			updateTransaction(id, payload),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
			invalidateAnalytics(queryClient);
		},
	});
}

export function useDeleteTransactionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteTransaction(id),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
			invalidateAnalytics(queryClient);
		},
	});
}

export function useImportTransactionsMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: ImportTransactionsRequest) => importTransactions(payload),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
			invalidateAnalytics(queryClient);
		},
	});
}
