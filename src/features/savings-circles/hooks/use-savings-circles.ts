import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/hooks/use-dashboard';
import { goalKeys } from '@/features/goals/hooks/use-goals';
import { investmentKeys } from '@/features/investments/hooks/use-investments';
import { savingKeys } from '@/features/savings/hooks/use-savings';
import {
	completeSavingsCircle,
	contributeToSavingsCircle,
	createSavingsCircle,
	deleteSavingsCircle,
	deleteSavingsCircleTransaction,
	getSavingsCircle,
	listSavingsCircles,
	listSavingsCircleTransactions,
	moveSavingsCirclePayoutToSpendable,
	recordSavingsCirclePayout,
	updateSavingsCircle,
	updateSavingsCircleTransaction,
} from '@/features/savings-circles/savings-circle.service';
import type {
	CreateSavingsCircleRequest,
	SavingsCircleMovementRequest,
	SavingsCircleStatus,
	SavingsCircleTransactionListParams,
	UpdateSavingsCircleRequest,
	UpdateSavingsCircleTransactionRequest,
} from '@/features/savings-circles/types';

export const savingsCircleKeys = {
	all: ['savings-circles'] as const,
	list: (status?: SavingsCircleStatus | 'all') =>
		[...savingsCircleKeys.all, 'list', status ?? 'all'] as const,
	one: (id: string) => [...savingsCircleKeys.all, 'one', id] as const,
	transactions: (circleId: string, params?: SavingsCircleTransactionListParams) =>
		params
			? ([...savingsCircleKeys.all, 'transactions', circleId, params] as const)
			: ([...savingsCircleKeys.all, 'transactions', circleId] as const),
};

export function useSavingsCirclesQuery(status?: SavingsCircleStatus) {
	return useQuery({
		queryKey: savingsCircleKeys.list(status ?? 'all'),
		queryFn: () => listSavingsCircles(status),
	});
}

export function useSavingsCircleQuery(circleId: string | null) {
	return useQuery({
		queryKey: savingsCircleKeys.one(circleId ?? ''),
		queryFn: () => getSavingsCircle(circleId!),
		enabled: Boolean(circleId),
	});
}

export function useSavingsCircleTransactionsQuery(
	circleId: string | null,
	params: SavingsCircleTransactionListParams = {},
) {
	return useQuery({
		queryKey: savingsCircleKeys.transactions(circleId ?? '', params),
		queryFn: () => listSavingsCircleTransactions(circleId!, params),
		enabled: Boolean(circleId),
		placeholderData: (previous) => previous,
	});
}

function invalidateCircles(queryClient: ReturnType<typeof useQueryClient>) {
	void queryClient.invalidateQueries({ queryKey: savingsCircleKeys.all });
	void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
	void queryClient.invalidateQueries({ queryKey: goalKeys.all });
	void queryClient.invalidateQueries({ queryKey: savingKeys.all });
	void queryClient.invalidateQueries({ queryKey: investmentKeys.all });
}

export function useCreateSavingsCircleMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateSavingsCircleRequest) => createSavingsCircle(payload),
		onSuccess: () => invalidateCircles(queryClient),
	});
}

export function useUpdateSavingsCircleMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdateSavingsCircleRequest }) =>
			updateSavingsCircle(id, payload),
		onSuccess: () => invalidateCircles(queryClient),
	});
}

export function useDeleteSavingsCircleMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteSavingsCircle(id),
		onSuccess: () => invalidateCircles(queryClient),
	});
}

export function useContributeToSavingsCircleMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			circleId,
			payload,
		}: {
			circleId: string;
			payload: SavingsCircleMovementRequest;
		}) => contributeToSavingsCircle(circleId, payload),
		onSuccess: (_data, variables) => {
			invalidateCircles(queryClient);
			void queryClient.invalidateQueries({
				queryKey: savingsCircleKeys.transactions(variables.circleId),
			});
		},
	});
}

export function useRecordSavingsCirclePayoutMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			circleId,
			payload,
		}: {
			circleId: string;
			payload: SavingsCircleMovementRequest;
		}) => recordSavingsCirclePayout(circleId, payload),
		onSuccess: (_data, variables) => {
			invalidateCircles(queryClient);
			void queryClient.invalidateQueries({
				queryKey: savingsCircleKeys.transactions(variables.circleId),
			});
		},
	});
}

export function useMoveSavingsCirclePayoutMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			circleId,
			payload,
		}: {
			circleId: string;
			payload: SavingsCircleMovementRequest;
		}) => moveSavingsCirclePayoutToSpendable(circleId, payload),
		onSuccess: (_data, variables) => {
			invalidateCircles(queryClient);
			void queryClient.invalidateQueries({
				queryKey: savingsCircleKeys.transactions(variables.circleId),
			});
		},
	});
}

export function useCompleteSavingsCircleMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (circleId: string) => completeSavingsCircle(circleId),
		onSuccess: () => invalidateCircles(queryClient),
	});
}

export function useUpdateSavingsCircleTransactionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			circleId,
			transactionId,
			payload,
		}: {
			circleId: string;
			transactionId: string;
			payload: UpdateSavingsCircleTransactionRequest;
		}) => updateSavingsCircleTransaction(circleId, transactionId, payload),
		onSuccess: (_data, variables) => {
			invalidateCircles(queryClient);
			void queryClient.invalidateQueries({
				queryKey: savingsCircleKeys.transactions(variables.circleId),
			});
		},
	});
}

export function useDeleteSavingsCircleTransactionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			circleId,
			transactionId,
		}: {
			circleId: string;
			transactionId: string;
		}) => deleteSavingsCircleTransaction(circleId, transactionId),
		onSuccess: (_data, variables) => {
			invalidateCircles(queryClient);
			void queryClient.invalidateQueries({
				queryKey: savingsCircleKeys.transactions(variables.circleId),
			});
		},
	});
}
