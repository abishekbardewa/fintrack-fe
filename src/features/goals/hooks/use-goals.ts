import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/hooks/use-dashboard';
import { investmentKeys } from '@/features/investments/hooks/use-investments';
import { savingKeys } from '@/features/savings/hooks/use-savings';
import { transactionKeys } from '@/features/transactions/hooks/use-transactions';
import {
	addContribution,
	addStartingBalance,
	createGoal,
	deleteContribution,
	deleteGoal,
	getGoal,
	listContributions,
	listGoals,
	returnToAvailable,
	spendFromGoal,
	updateContribution,
	updateGoal,
} from '@/features/goals/goal.service';
import type {
	ContributionListParams,
	CreateContributionRequest,
	CreateGoalRequest,
	ReturnToAvailableRequest,
	SavingsGoalStatus,
	SpendFromGoalRequest,
	StartingBalanceRequest,
	UpdateContributionRequest,
	UpdateGoalRequest,
} from '@/features/goals/types';

export const goalKeys = {
	all: ['savings-goals'] as const,
	list: (status?: SavingsGoalStatus | 'all') =>
		[...goalKeys.all, 'list', status ?? 'all'] as const,
	one: (id: string) => [...goalKeys.all, 'one', id] as const,
	contributions: (goalId: string, params?: ContributionListParams) =>
		params
			? ([...goalKeys.all, 'contributions', goalId, params] as const)
			: ([...goalKeys.all, 'contributions', goalId] as const),
};

export function useGoalsQuery(status?: SavingsGoalStatus) {
	return useQuery({
		queryKey: goalKeys.list(status ?? 'all'),
		queryFn: () => listGoals(status),
	});
}

export function useGoalQuery(goalId: string | null) {
	return useQuery({
		queryKey: goalKeys.one(goalId ?? ''),
		queryFn: () => getGoal(goalId!),
		enabled: Boolean(goalId),
	});
}

export function useContributionsQuery(
	goalId: string | null,
	params: ContributionListParams = {},
) {
	return useQuery({
		queryKey: goalKeys.contributions(goalId ?? '', params),
		queryFn: () => listContributions(goalId!, params),
		enabled: Boolean(goalId),
		placeholderData: (previous) => previous,
	});
}

function invalidateGoals(queryClient: ReturnType<typeof useQueryClient>) {
	void queryClient.invalidateQueries({ queryKey: goalKeys.all });
	void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
	void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
	void queryClient.invalidateQueries({ queryKey: savingKeys.all });
	void queryClient.invalidateQueries({ queryKey: ['savings-circles'] });
	void queryClient.invalidateQueries({ queryKey: investmentKeys.all });
}

export function useCreateGoalMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateGoalRequest) => createGoal(payload),
		onSuccess: () => invalidateGoals(queryClient),
	});
}

export function useUpdateGoalMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdateGoalRequest }) =>
			updateGoal(id, payload),
		onSuccess: () => invalidateGoals(queryClient),
	});
}

export function useDeleteGoalMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteGoal(id),
		onSuccess: () => invalidateGoals(queryClient),
	});
}

export function useAddStartingBalanceMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			goalId,
			payload,
		}: {
			goalId: string;
			payload: StartingBalanceRequest;
		}) => addStartingBalance(goalId, payload),
		onSuccess: (_data, variables) => {
			invalidateGoals(queryClient);
			void queryClient.invalidateQueries({
				queryKey: goalKeys.contributions(variables.goalId),
			});
		},
	});
}

export function useAddContributionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			goalId,
			payload,
		}: {
			goalId: string;
			payload: CreateContributionRequest;
		}) => addContribution(goalId, payload),
		onSuccess: (_data, variables) => {
			invalidateGoals(queryClient);
			void queryClient.invalidateQueries({
				queryKey: goalKeys.contributions(variables.goalId),
			});
		},
	});
}

export function useDeleteContributionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			goalId,
			contributionId,
		}: {
			goalId: string;
			contributionId: string;
		}) => deleteContribution(goalId, contributionId),
		onSuccess: (_data, variables) => {
			invalidateGoals(queryClient);
			void queryClient.invalidateQueries({
				queryKey: goalKeys.contributions(variables.goalId),
			});
		},
	});
}

export function useUpdateContributionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			goalId,
			contributionId,
			payload,
		}: {
			goalId: string;
			contributionId: string;
			payload: UpdateContributionRequest;
		}) => updateContribution(goalId, contributionId, payload),
		onSuccess: (_data, variables) => {
			invalidateGoals(queryClient);
			void queryClient.invalidateQueries({
				queryKey: goalKeys.contributions(variables.goalId),
			});
		},
	});
}

export function useSpendFromGoalMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			goalId,
			payload,
		}: {
			goalId: string;
			payload: SpendFromGoalRequest;
		}) => spendFromGoal(goalId, payload),
		onSuccess: (_data, variables) => {
			invalidateGoals(queryClient);
			void queryClient.invalidateQueries({
				queryKey: goalKeys.contributions(variables.goalId),
			});
		},
	});
}

export function useReturnToAvailableMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			goalId,
			payload,
		}: {
			goalId: string;
			payload?: ReturnToAvailableRequest;
		}) => returnToAvailable(goalId, payload),
		onSuccess: (_data, variables) => {
			invalidateGoals(queryClient);
			void queryClient.invalidateQueries({
				queryKey: goalKeys.contributions(variables.goalId),
			});
		},
	});
}
