import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	addContribution,
	createGoal,
	deleteContribution,
	deleteGoal,
	listContributions,
	listGoals,
	updateGoal,
} from '@/features/goals/goal.service';
import type {
	CreateContributionRequest,
	CreateGoalRequest,
	SavingsGoalStatus,
	UpdateGoalRequest,
} from '@/features/goals/types';

export const goalKeys = {
	all: ['savings-goals'] as const,
	list: (status?: SavingsGoalStatus | 'all') =>
		[...goalKeys.all, 'list', status ?? 'all'] as const,
	contributions: (goalId: string) => [...goalKeys.all, 'contributions', goalId] as const,
};

export function useGoalsQuery(status?: SavingsGoalStatus) {
	return useQuery({
		queryKey: goalKeys.list(status ?? 'all'),
		queryFn: () => listGoals(status),
	});
}

export function useContributionsQuery(goalId: string | null) {
	return useQuery({
		queryKey: goalKeys.contributions(goalId ?? ''),
		queryFn: () => listContributions(goalId!),
		enabled: Boolean(goalId),
	});
}

function invalidateGoals(queryClient: ReturnType<typeof useQueryClient>) {
	void queryClient.invalidateQueries({ queryKey: goalKeys.all });
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
