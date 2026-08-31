import { apiPrivate } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/lib/api/types';
import type {
	CreateSavingRequest,
	SavingMovementRequest,
	SavingMutationData,
	SavingsListData,
	SavingTransactionListParams,
	SavingTransactionMutationData,
	SavingTransactionsListData,
	StartingBalanceRequest,
	UpdateSavingRequest,
	UpdateSavingTransactionRequest,
} from '@/features/savings/types';

const SAVINGS_BASE = '/savings';

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

export async function listSavings() {
	const { data } = await apiPrivate.get<ApiResponse<SavingsListData>>(SAVINGS_BASE);
	return unwrapData(data, 'Failed to load savings.');
}

export async function getSaving(id: string) {
	const { data } = await apiPrivate.get<ApiResponse<SavingMutationData>>(
		`${SAVINGS_BASE}/${id}`,
	);
	return unwrapData(data, 'Failed to load savings.');
}

export async function createSaving(payload: CreateSavingRequest) {
	const { data } = await apiPrivate.post<ApiResponse<SavingMutationData>>(
		SAVINGS_BASE,
		payload,
	);
	return unwrapData(data, 'Failed to create savings.');
}

export async function updateSaving(id: string, payload: UpdateSavingRequest) {
	const { data } = await apiPrivate.patch<ApiResponse<SavingMutationData>>(
		`${SAVINGS_BASE}/${id}`,
		payload,
	);
	return unwrapData(data, 'Failed to update savings.');
}

export async function deleteSaving(id: string) {
	const { data } = await apiPrivate.delete<ApiResponse<null>>(`${SAVINGS_BASE}/${id}`);
	if (data.success === false) {
		throw new ApiError(
			data.message || 'Failed to delete savings.',
			data.statusCode ?? 0,
			data.details,
		);
	}
}

export async function listSavingTransactions(
	savingId: string,
	params: SavingTransactionListParams = {},
) {
	const { data } = await apiPrivate.get<ApiResponse<SavingTransactionsListData>>(
		`${SAVINGS_BASE}/${savingId}/transactions`,
		{ params },
	);
	return unwrapData(data, 'Failed to load savings history.');
}

export async function addSavingStartingBalance(savingId: string, payload: StartingBalanceRequest) {
	const { data } = await apiPrivate.post<ApiResponse<SavingTransactionMutationData>>(
		`${SAVINGS_BASE}/${savingId}/starting-balance`,
		payload,
	);
	return unwrapData(data, 'Failed to add starting savings balance.');
}

export async function contributeToSaving(savingId: string, payload: SavingMovementRequest) {
	const { data } = await apiPrivate.post<ApiResponse<SavingTransactionMutationData>>(
		`${SAVINGS_BASE}/${savingId}/contribute`,
		payload,
	);
	return unwrapData(data, 'Failed to add to savings.');
}

export async function withdrawFromSaving(savingId: string, payload: SavingMovementRequest) {
	const { data } = await apiPrivate.post<ApiResponse<SavingTransactionMutationData>>(
		`${SAVINGS_BASE}/${savingId}/withdraw`,
		payload,
	);
	return unwrapData(data, 'Failed to withdraw from savings.');
}

export async function addSavingReturn(savingId: string, payload: SavingMovementRequest) {
	const { data } = await apiPrivate.post<ApiResponse<SavingTransactionMutationData>>(
		`${SAVINGS_BASE}/${savingId}/return`,
		payload,
	);
	return unwrapData(data, 'Failed to add return.');
}

export async function updateSavingTransaction(
	savingId: string,
	transactionId: string,
	payload: UpdateSavingTransactionRequest,
) {
	const { data } = await apiPrivate.patch<ApiResponse<SavingTransactionMutationData>>(
		`${SAVINGS_BASE}/${savingId}/transactions/${transactionId}`,
		payload,
	);
	return unwrapData(data, 'Failed to update entry.');
}

export async function deleteSavingTransaction(savingId: string, transactionId: string) {
	const { data } = await apiPrivate.delete<ApiResponse<SavingMutationData>>(
		`${SAVINGS_BASE}/${savingId}/transactions/${transactionId}`,
	);
	return unwrapData(data, 'Failed to delete entry.');
}
