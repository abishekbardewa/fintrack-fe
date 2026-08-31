import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/hooks/use-dashboard';
import { goalKeys } from '@/features/goals/hooks/use-goals';
import { savingKeys } from '@/features/savings/hooks/use-savings';
import {
	addInvestmentReturn,
	addInvestmentStartingBalance,
	closeInvestment,
	contributeToInvestment,
	createInvestment,
	deleteInvestment,
	deleteInvestmentTransaction,
	getInvestment,
	listInvestments,
	listInvestmentTransactions,
	recordInvestmentLoss,
	updateInvestment,
	updateInvestmentTransaction,
	withdrawFromInvestment,
} from '@/features/investments/investment.service';
import type {
	CloseInvestmentRequest,
	CreateInvestmentRequest,
	InvestmentMovementRequest,
	InvestmentStatus,
	InvestmentTransactionListParams,
	StartingBalanceRequest,
	UpdateInvestmentRequest,
	UpdateInvestmentTransactionRequest,
} from '@/features/investments/types';

export const investmentKeys = {
	all: ['investments'] as const,
	list: (status?: InvestmentStatus | 'all') =>
		[...investmentKeys.all, 'list', status ?? 'all'] as const,
	one: (id: string) => [...investmentKeys.all, 'one', id] as const,
	transactions: (investmentId: string, params?: InvestmentTransactionListParams) =>
		params
			? ([...investmentKeys.all, 'transactions', investmentId, params] as const)
			: ([...investmentKeys.all, 'transactions', investmentId] as const),
};

export function useInvestmentsQuery(status?: InvestmentStatus) {
	return useQuery({
		queryKey: investmentKeys.list(status ?? 'all'),
		queryFn: () => listInvestments(status),
	});
}

export function useInvestmentQuery(investmentId: string | null) {
	return useQuery({
		queryKey: investmentKeys.one(investmentId ?? ''),
		queryFn: () => getInvestment(investmentId!),
		enabled: Boolean(investmentId),
	});
}

export function useInvestmentTransactionsQuery(
	investmentId: string | null,
	params: InvestmentTransactionListParams = {},
) {
	return useQuery({
		queryKey: investmentKeys.transactions(investmentId ?? '', params),
		queryFn: () => listInvestmentTransactions(investmentId!, params),
		enabled: Boolean(investmentId),
		placeholderData: (previous) => previous,
	});
}

function invalidateInvestments(queryClient: ReturnType<typeof useQueryClient>) {
	void queryClient.invalidateQueries({ queryKey: investmentKeys.all });
	void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
	void queryClient.invalidateQueries({ queryKey: goalKeys.all });
	void queryClient.invalidateQueries({ queryKey: savingKeys.all });
	void queryClient.invalidateQueries({ queryKey: ['savings-circles'] });
}

export function useCreateInvestmentMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateInvestmentRequest) => createInvestment(payload),
		onSuccess: () => invalidateInvestments(queryClient),
	});
}

export function useUpdateInvestmentMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdateInvestmentRequest }) =>
			updateInvestment(id, payload),
		onSuccess: () => invalidateInvestments(queryClient),
	});
}

export function useDeleteInvestmentMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteInvestment(id),
		onSuccess: () => invalidateInvestments(queryClient),
	});
}

function invalidateLedger(
	queryClient: ReturnType<typeof useQueryClient>,
	investmentId: string,
) {
	invalidateInvestments(queryClient);
	void queryClient.invalidateQueries({
		queryKey: investmentKeys.transactions(investmentId),
	});
}

export function useAddInvestmentStartingBalanceMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			investmentId,
			payload,
		}: {
			investmentId: string;
			payload: StartingBalanceRequest;
		}) => addInvestmentStartingBalance(investmentId, payload),
		onSuccess: (_data, variables) => invalidateLedger(queryClient, variables.investmentId),
	});
}

export function useContributeToInvestmentMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			investmentId,
			payload,
		}: {
			investmentId: string;
			payload: InvestmentMovementRequest;
		}) => contributeToInvestment(investmentId, payload),
		onSuccess: (_data, variables) => invalidateLedger(queryClient, variables.investmentId),
	});
}

export function useAddInvestmentReturnMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			investmentId,
			payload,
		}: {
			investmentId: string;
			payload: InvestmentMovementRequest;
		}) => addInvestmentReturn(investmentId, payload),
		onSuccess: (_data, variables) => invalidateLedger(queryClient, variables.investmentId),
	});
}

export function useWithdrawFromInvestmentMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			investmentId,
			payload,
		}: {
			investmentId: string;
			payload: InvestmentMovementRequest;
		}) => withdrawFromInvestment(investmentId, payload),
		onSuccess: (_data, variables) => invalidateLedger(queryClient, variables.investmentId),
	});
}

export function useCloseInvestmentMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			investmentId,
			payload,
		}: {
			investmentId: string;
			payload?: CloseInvestmentRequest;
		}) => closeInvestment(investmentId, payload),
		onSuccess: (_data, variables) => invalidateLedger(queryClient, variables.investmentId),
	});
}

export function useRecordInvestmentLossMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			investmentId,
			payload,
		}: {
			investmentId: string;
			payload: InvestmentMovementRequest;
		}) => recordInvestmentLoss(investmentId, payload),
		onSuccess: (_data, variables) => invalidateLedger(queryClient, variables.investmentId),
	});
}

export function useUpdateInvestmentTransactionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			investmentId,
			transactionId,
			payload,
		}: {
			investmentId: string;
			transactionId: string;
			payload: UpdateInvestmentTransactionRequest;
		}) => updateInvestmentTransaction(investmentId, transactionId, payload),
		onSuccess: (_data, variables) => invalidateLedger(queryClient, variables.investmentId),
	});
}

export function useDeleteInvestmentTransactionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			investmentId,
			transactionId,
		}: {
			investmentId: string;
			transactionId: string;
		}) => deleteInvestmentTransaction(investmentId, transactionId),
		onSuccess: (_data, variables) => invalidateLedger(queryClient, variables.investmentId),
	});
}
