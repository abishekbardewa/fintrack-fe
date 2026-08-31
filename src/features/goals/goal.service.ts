import { apiPrivate } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/lib/api/types';
import type {
	ContributionListParams,
	ContributionMutationData,
	ContributionsListData,
	CreateContributionRequest,
	CreateGoalRequest,
	GoalMutationData,
	GoalsListData,
	ReturnToAvailableData,
	ReturnToAvailableRequest,
	SavingsGoalStatus,
	SpendFromGoalData,
	SpendFromGoalRequest,
	StartingBalanceRequest,
	UpdateContributionRequest,
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

export async function listContributions(
	goalId: string,
	params: ContributionListParams = {},
) {
	const { data } = await apiPrivate.get<ApiResponse<ContributionsListData>>(
		`${GOALS_BASE}/${goalId}/contributions`,
		{ params },
	);
	return unwrapData(data, 'Failed to load contributions.');
}

export async function addStartingBalance(goalId: string, payload: StartingBalanceRequest) {
	const { data } = await apiPrivate.post<ApiResponse<ContributionMutationData>>(
		`${GOALS_BASE}/${goalId}/starting-balance`,
		payload,
	);
	return unwrapData(data, 'Failed to add starting goal balance.');
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

export async function updateContribution(
	goalId: string,
	contributionId: string,
	payload: UpdateContributionRequest,
) {
	const { data } = await apiPrivate.patch<ApiResponse<ContributionMutationData>>(
		`${GOALS_BASE}/${goalId}/contributions/${contributionId}`,
		payload,
	);
	return unwrapData(data, 'Failed to update contribution.');
}

export async function spendFromGoal(goalId: string, payload: SpendFromGoalRequest) {
	const { data } = await apiPrivate.post<ApiResponse<SpendFromGoalData>>(
		`${GOALS_BASE}/${goalId}/spend`,
		payload,
	);
	return unwrapData(data, 'Failed to spend from goal.');
}

export async function returnToAvailable(goalId: string, payload: ReturnToAvailableRequest = {}) {
	const { data } = await apiPrivate.post<ApiResponse<ReturnToAvailableData>>(
		`${GOALS_BASE}/${goalId}/return`,
		payload,
	);
	return unwrapData(data, 'Failed to return goal funds.');
}
