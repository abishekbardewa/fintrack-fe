import { apiPrivate } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/lib/api/types';
import type {
	CloseInvestmentRequest,
	CreateInvestmentRequest,
	InvestmentMovementRequest,
	InvestmentMutationData,
	InvestmentsListData,
	InvestmentStatus,
	InvestmentTransactionListParams,
	InvestmentTransactionMutationData,
	InvestmentTransactionsListData,
	StartingBalanceRequest,
	UpdateInvestmentRequest,
	UpdateInvestmentTransactionRequest,
} from '@/features/investments/types';

const INVESTMENTS_BASE = '/investments';

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

export async function listInvestments(status?: InvestmentStatus) {
	const { data } = await apiPrivate.get<ApiResponse<InvestmentsListData>>(INVESTMENTS_BASE, {
		params: status ? { status } : undefined,
	});
	return unwrapData(data, 'Failed to load investments.');
}

export async function getInvestment(id: string) {
	const { data } = await apiPrivate.get<ApiResponse<InvestmentMutationData>>(
		`${INVESTMENTS_BASE}/${id}`,
	);
	return unwrapData(data, 'Failed to load investment.');
}

export async function createInvestment(payload: CreateInvestmentRequest) {
	const { data } = await apiPrivate.post<ApiResponse<InvestmentMutationData>>(
		INVESTMENTS_BASE,
		payload,
	);
	return unwrapData(data, 'Failed to create investment.');
}

export async function updateInvestment(id: string, payload: UpdateInvestmentRequest) {
	const { data } = await apiPrivate.patch<ApiResponse<InvestmentMutationData>>(
		`${INVESTMENTS_BASE}/${id}`,
		payload,
	);
	return unwrapData(data, 'Failed to update investment.');
}

export async function deleteInvestment(id: string) {
	const { data } = await apiPrivate.delete<ApiResponse<null>>(`${INVESTMENTS_BASE}/${id}`);
	if (data.success === false) {
		throw new ApiError(
			data.message || 'Failed to delete investment.',
			data.statusCode ?? 0,
			data.details,
		);
	}
}

export async function listInvestmentTransactions(
	investmentId: string,
	params: InvestmentTransactionListParams = {},
) {
	const { data } = await apiPrivate.get<ApiResponse<InvestmentTransactionsListData>>(
		`${INVESTMENTS_BASE}/${investmentId}/transactions`,
		{ params },
	);
	return unwrapData(data, 'Failed to load investment history.');
}

export async function addInvestmentStartingBalance(
	investmentId: string,
	payload: StartingBalanceRequest,
) {
	const { data } = await apiPrivate.post<ApiResponse<InvestmentTransactionMutationData>>(
		`${INVESTMENTS_BASE}/${investmentId}/starting-balance`,
		payload,
	);
	return unwrapData(data, 'Failed to add starting investment balance.');
}

export async function contributeToInvestment(
	investmentId: string,
	payload: InvestmentMovementRequest,
) {
	const { data } = await apiPrivate.post<ApiResponse<InvestmentTransactionMutationData>>(
		`${INVESTMENTS_BASE}/${investmentId}/contribute`,
		payload,
	);
	return unwrapData(data, 'Failed to add to investment.');
}

export async function addInvestmentReturn(
	investmentId: string,
	payload: InvestmentMovementRequest,
) {
	const { data } = await apiPrivate.post<ApiResponse<InvestmentTransactionMutationData>>(
		`${INVESTMENTS_BASE}/${investmentId}/return`,
		payload,
	);
	return unwrapData(data, 'Failed to add return.');
}

export async function withdrawFromInvestment(
	investmentId: string,
	payload: InvestmentMovementRequest,
) {
	const { data } = await apiPrivate.post<ApiResponse<InvestmentTransactionMutationData>>(
		`${INVESTMENTS_BASE}/${investmentId}/withdraw`,
		payload,
	);
	return unwrapData(data, 'Failed to withdraw from investment.');
}

export async function closeInvestment(investmentId: string, payload: CloseInvestmentRequest = {}) {
	const { data } = await apiPrivate.post<ApiResponse<InvestmentTransactionMutationData>>(
		`${INVESTMENTS_BASE}/${investmentId}/close`,
		payload,
	);
	return unwrapData(data, 'Failed to close investment.');
}

export async function recordInvestmentLoss(
	investmentId: string,
	payload: InvestmentMovementRequest,
) {
	const { data } = await apiPrivate.post<ApiResponse<InvestmentTransactionMutationData>>(
		`${INVESTMENTS_BASE}/${investmentId}/loss`,
		payload,
	);
	return unwrapData(data, 'Failed to record loss.');
}

export async function updateInvestmentTransaction(
	investmentId: string,
	transactionId: string,
	payload: UpdateInvestmentTransactionRequest,
) {
	const { data } = await apiPrivate.patch<ApiResponse<InvestmentTransactionMutationData>>(
		`${INVESTMENTS_BASE}/${investmentId}/transactions/${transactionId}`,
		payload,
	);
	return unwrapData(data, 'Failed to update entry.');
}

export async function deleteInvestmentTransaction(investmentId: string, transactionId: string) {
	const { data } = await apiPrivate.delete<ApiResponse<InvestmentMutationData>>(
		`${INVESTMENTS_BASE}/${investmentId}/transactions/${transactionId}`,
	);
	return unwrapData(data, 'Failed to delete entry.');
}
