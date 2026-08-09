import { apiPrivate } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/lib/api/types';
import type {
	ContributionMutationData,
	ContributionsListData,
	CreateContributionRequest,
	CreateGoalRequest,
	GoalMutationData,
	GoalsListData,
	SavingsGoalStatus,
	UpdateGoalRequest,
} from '@/features/goals/types';

const GOALS_BASE = '/savings-goals';

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

export async function listGoals(status?: SavingsGoalStatus) {
	const { data } = await apiPrivate.get<ApiResponse<GoalsListData>>(GOALS_BASE, {
		params: status ? { status } : undefined,
	});
	return unwrapData(data, 'Failed to load savings goals.');
}

export async function getGoal(id: string) {
	const { data } = await apiPrivate.get<ApiResponse<GoalMutationData>>(`${GOALS_BASE}/${id}`);
	return unwrapData(data, 'Failed to load savings goal.');
}

export async function createGoal(payload: CreateGoalRequest) {
	const { data } = await apiPrivate.post<ApiResponse<GoalMutationData>>(GOALS_BASE, payload);
	return unwrapData(data, 'Failed to create savings goal.');
}

export async function updateGoal(id: string, payload: UpdateGoalRequest) {
	const { data } = await apiPrivate.patch<ApiResponse<GoalMutationData>>(
		`${GOALS_BASE}/${id}`,
		payload,
	);
	return unwrapData(data, 'Failed to update savings goal.');
}

export async function deleteGoal(id: string) {
	const { data } = await apiPrivate.delete<ApiResponse<null>>(`${GOALS_BASE}/${id}`);
	if (data.success === false) {
		throw new ApiError(
			data.message || 'Failed to delete savings goal.',
			data.statusCode ?? 0,
			data.details,
		);
	}
}

export async function listContributions(goalId: string) {
	const { data } = await apiPrivate.get<ApiResponse<ContributionsListData>>(
		`${GOALS_BASE}/${goalId}/contributions`,
	);
	return unwrapData(data, 'Failed to load contributions.');
}

export async function addContribution(goalId: string, payload: CreateContributionRequest) {
	const { data } = await apiPrivate.post<ApiResponse<ContributionMutationData>>(
		`${GOALS_BASE}/${goalId}/contributions`,
		payload,
	);
	return unwrapData(data, 'Failed to add contribution.');
}

export async function deleteContribution(goalId: string, contributionId: string) {
	const { data } = await apiPrivate.delete<
		ApiResponse<{ goal: ContributionMutationData['goal'] }>
	>(`${GOALS_BASE}/${goalId}/contributions/${contributionId}`);
	return unwrapData(data, 'Failed to delete contribution.');
}
