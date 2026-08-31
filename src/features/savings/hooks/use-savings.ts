import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/hooks/use-dashboard';
import { goalKeys } from '@/features/goals/hooks/use-goals';
import { investmentKeys } from '@/features/investments/hooks/use-investments';
import {
	addSavingReturn,
	addSavingStartingBalance,
	contributeToSaving,
	createSaving,
	deleteSaving,
	deleteSavingTransaction,
	getSaving,
	listSavings,
	listSavingTransactions,
	updateSaving,
	updateSavingTransaction,
	withdrawFromSaving,
} from '@/features/savings/saving.service';
import type {
	CreateSavingRequest,
	SavingMovementRequest,
	SavingTransactionListParams,
	StartingBalanceRequest,
	UpdateSavingRequest,
	UpdateSavingTransactionRequest,
} from '@/features/savings/types';

export const savingKeys = {
	all: ['savings'] as const,
	list: () => [...savingKeys.all, 'list'] as const,
	one: (id: string) => [...savingKeys.all, 'one', id] as const,
	transactions: (savingId: string, params?: SavingTransactionListParams) =>
		params
			? ([...savingKeys.all, 'transactions', savingId, params] as const)
			: ([...savingKeys.all, 'transactions', savingId] as const),
};

export function useSavingsQuery() {
	return useQuery({
		queryKey: savingKeys.list(),
		queryFn: listSavings,
	});
}

export function useSavingQuery(savingId: string | null) {
	return useQuery({
		queryKey: savingKeys.one(savingId ?? ''),
		queryFn: () => getSaving(savingId!),
		enabled: Boolean(savingId),
	});
}

export function useSavingTransactionsQuery(
	savingId: string | null,
	params: SavingTransactionListParams = {},
) {
	return useQuery({
		queryKey: savingKeys.transactions(savingId ?? '', params),
		queryFn: () => listSavingTransactions(savingId!, params),
		enabled: Boolean(savingId),
		placeholderData: (previous) => previous,
	});
}

function invalidateSavings(queryClient: ReturnType<typeof useQueryClient>) {
	void queryClient.invalidateQueries({ queryKey: savingKeys.all });
	void queryClient.invalidateQueries({ queryKey: ['savings-circles'] });
	void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
	void queryClient.invalidateQueries({ queryKey: goalKeys.all });
	void queryClient.invalidateQueries({ queryKey: investmentKeys.all });
}

export function useCreateSavingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateSavingRequest) => createSaving(payload),
		onSuccess: () => invalidateSavings(queryClient),
	});
}

export function useUpdateSavingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdateSavingRequest }) =>
			updateSaving(id, payload),
		onSuccess: () => invalidateSavings(queryClient),
	});
}

export function useDeleteSavingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteSaving(id),
		onSuccess: () => invalidateSavings(queryClient),
	});
}

export function useAddSavingStartingBalanceMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			savingId,
			payload,
		}: {
			savingId: string;
			payload: StartingBalanceRequest;
		}) => addSavingStartingBalance(savingId, payload),
		onSuccess: (_data, variables) => {
			invalidateSavings(queryClient);
			void queryClient.invalidateQueries({
				queryKey: savingKeys.transactions(variables.savingId),
			});
		},
	});
}

export function useContributeToSavingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			savingId,
			payload,
		}: {
			savingId: string;
			payload: SavingMovementRequest;
		}) => contributeToSaving(savingId, payload),
		onSuccess: (_data, variables) => {
			invalidateSavings(queryClient);
			void queryClient.invalidateQueries({
				queryKey: savingKeys.transactions(variables.savingId),
			});
		},
	});
}

export function useWithdrawFromSavingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			savingId,
			payload,
		}: {
			savingId: string;
			payload: SavingMovementRequest;
		}) => withdrawFromSaving(savingId, payload),
		onSuccess: (_data, variables) => {
			invalidateSavings(queryClient);
			void queryClient.invalidateQueries({
				queryKey: savingKeys.transactions(variables.savingId),
			});
		},
	});
}

export function useAddSavingReturnMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			savingId,
			payload,
		}: {
			savingId: string;
			payload: SavingMovementRequest;
		}) => addSavingReturn(savingId, payload),
		onSuccess: (_data, variables) => {
			invalidateSavings(queryClient);
			void queryClient.invalidateQueries({
				queryKey: savingKeys.transactions(variables.savingId),
			});
		},
	});
}

export function useUpdateSavingTransactionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			savingId,
			transactionId,
			payload,
		}: {
			savingId: string;
			transactionId: string;
			payload: UpdateSavingTransactionRequest;
		}) => updateSavingTransaction(savingId, transactionId, payload),
		onSuccess: (_data, variables) => {
			invalidateSavings(queryClient);
			void queryClient.invalidateQueries({
				queryKey: savingKeys.transactions(variables.savingId),
			});
		},
	});
}

export function useDeleteSavingTransactionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			savingId,
			transactionId,
		}: {
			savingId: string;
			transactionId: string;
		}) => deleteSavingTransaction(savingId, transactionId),
		onSuccess: (_data, variables) => {
			invalidateSavings(queryClient);
			void queryClient.invalidateQueries({
				queryKey: savingKeys.transactions(variables.savingId),
			});
		},
	});
}
