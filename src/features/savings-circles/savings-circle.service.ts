import { apiPrivate } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/lib/api/types';
import type {
	CreateSavingsCircleRequest,
	SavingsCircleMovementRequest,
	SavingsCircleMutationData,
	SavingsCirclesListData,
	SavingsCircleStatus,
	SavingsCircleTransactionListParams,
	SavingsCircleTransactionMutationData,
	SavingsCircleTransactionsListData,
	UpdateSavingsCircleRequest,
	UpdateSavingsCircleTransactionRequest,
} from '@/features/savings-circles/types';

const CIRCLES_BASE = '/savings-circles';

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

export async function listSavingsCircles(status?: SavingsCircleStatus) {
	const { data } = await apiPrivate.get<ApiResponse<SavingsCirclesListData>>(CIRCLES_BASE, {
		params: status ? { status } : undefined,
	});
	return unwrapData(data, 'Failed to load circles.');
}

export async function getSavingsCircle(id: string) {
	const { data } = await apiPrivate.get<ApiResponse<SavingsCircleMutationData>>(
		`${CIRCLES_BASE}/${id}`,
	);
	return unwrapData(data, 'Failed to load circle.');
}

export async function createSavingsCircle(payload: CreateSavingsCircleRequest) {
	const { data } = await apiPrivate.post<ApiResponse<SavingsCircleMutationData>>(
		CIRCLES_BASE,
		payload,
	);
	return unwrapData(data, 'Failed to create circle.');
}

export async function updateSavingsCircle(id: string, payload: UpdateSavingsCircleRequest) {
	const { data } = await apiPrivate.patch<ApiResponse<SavingsCircleMutationData>>(
		`${CIRCLES_BASE}/${id}`,
		payload,
	);
	return unwrapData(data, 'Failed to update circle.');
}

export async function deleteSavingsCircle(id: string) {
	const { data } = await apiPrivate.delete<ApiResponse<null>>(`${CIRCLES_BASE}/${id}`);
	if (data.success === false) {
		throw new ApiError(
			data.message || 'Failed to delete circle.',
			data.statusCode ?? 0,
			data.details,
		);
	}
}

export async function listSavingsCircleTransactions(
	circleId: string,
	params: SavingsCircleTransactionListParams = {},
) {
	const { data } = await apiPrivate.get<ApiResponse<SavingsCircleTransactionsListData>>(
		`${CIRCLES_BASE}/${circleId}/transactions`,
		{ params },
	);
	return unwrapData(data, 'Failed to load circle history.');
}

export async function contributeToSavingsCircle(
	circleId: string,
	payload: SavingsCircleMovementRequest,
) {
	const { data } = await apiPrivate.post<ApiResponse<SavingsCircleTransactionMutationData>>(
		`${CIRCLES_BASE}/${circleId}/contribute`,
		payload,
	);
	return unwrapData(data, 'Failed to add contribution.');
}

export async function recordSavingsCirclePayout(
	circleId: string,
	payload: SavingsCircleMovementRequest,
) {
	const { data } = await apiPrivate.post<ApiResponse<SavingsCircleTransactionMutationData>>(
		`${CIRCLES_BASE}/${circleId}/payout`,
		payload,
	);
	return unwrapData(data, 'Failed to record payout.');
}

export async function moveSavingsCirclePayoutToSpendable(
	circleId: string,
	payload: SavingsCircleMovementRequest,
) {
	const { data } = await apiPrivate.post<ApiResponse<SavingsCircleTransactionMutationData>>(
		`${CIRCLES_BASE}/${circleId}/payout-to-spendable`,
		payload,
	);
	return unwrapData(data, 'Failed to move payout.');
}

export async function completeSavingsCircle(circleId: string) {
	const { data } = await apiPrivate.post<ApiResponse<SavingsCircleMutationData>>(
		`${CIRCLES_BASE}/${circleId}/complete`,
	);
	return unwrapData(data, 'Failed to complete circle.');
}

export async function updateSavingsCircleTransaction(
	circleId: string,
	transactionId: string,
	payload: UpdateSavingsCircleTransactionRequest,
) {
	const { data } = await apiPrivate.patch<ApiResponse<SavingsCircleTransactionMutationData>>(
		`${CIRCLES_BASE}/${circleId}/transactions/${transactionId}`,
		payload,
	);
	return unwrapData(data, 'Failed to update entry.');
}

export async function deleteSavingsCircleTransaction(circleId: string, transactionId: string) {
	const { data } = await apiPrivate.delete<ApiResponse<SavingsCircleMutationData>>(
		`${CIRCLES_BASE}/${circleId}/transactions/${transactionId}`,
	);
	return unwrapData(data, 'Failed to delete entry.');
}
