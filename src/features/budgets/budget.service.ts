import { apiPrivate } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/lib/api/types';
import type {
	BudgetMutationData,
	BudgetsListData,
	ListBudgetsParams,
	UpsertBudgetRequest,
} from '@/features/budgets/types';

const BUDGETS_BASE = '/budgets';

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

export async function listBudgets(params: ListBudgetsParams) {
	const { data } = await apiPrivate.get<ApiResponse<BudgetsListData>>(BUDGETS_BASE, {
		params:
			params.periodType === 'month'
				? {
						periodType: 'month',
						year: params.year,
						month: params.month,
					}
				: {
						periodType: 'week',
						weekStart: params.weekStart,
					},
	});
	return unwrapData(data, 'Failed to load budgets.');
}

export async function upsertBudget(payload: UpsertBudgetRequest) {
	const { data } = await apiPrivate.put<ApiResponse<BudgetMutationData>>(BUDGETS_BASE, payload);
	return unwrapData(data, 'Failed to save budget.');
}

export async function deleteBudget(id: string) {
	const { data } = await apiPrivate.delete<ApiResponse<null>>(`${BUDGETS_BASE}/${id}`);
	if (data.success === false) {
		throw new ApiError(
			data.message || 'Failed to delete budget.',
			data.statusCode ?? 0,
			data.details,
		);
	}
}
