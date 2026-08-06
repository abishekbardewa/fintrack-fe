import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	createTransaction,
	deleteTransaction,
	listTransactions,
	suggestDescriptions,
	updateTransaction,
} from '@/features/transactions/transaction.service';
import type {
	CreateTransactionRequest,
	TransactionListParams,
	UpdateTransactionRequest,
} from '@/features/transactions/types';

export const transactionKeys = {
	all: ['transactions'] as const,
	list: (params: TransactionListParams) => [...transactionKeys.all, 'list', params] as const,
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
		},
	});
}

export function useDeleteTransactionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteTransaction(id),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
		},
	});
}
