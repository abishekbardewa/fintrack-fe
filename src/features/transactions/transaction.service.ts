import { apiPrivate } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/lib/api/types';
import type {
	CreateTransactionRequest,
	SuggestDescriptionsData,
	TransactionListParams,
	TransactionMutationData,
	TransactionsListData,
	UpdateTransactionRequest,
} from '@/features/transactions/types';

const TRANSACTIONS_BASE = '/transactions';

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

function cleanParams(params: object) {
	const cleaned: Record<string, string | number> = {};
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null || value === '') continue;
		if (typeof value === 'string' || typeof value === 'number') {
			cleaned[key] = value;
		}
	}
	return cleaned;
}

export async function listTransactions(params: TransactionListParams = {}) {
	const { data } = await apiPrivate.get<ApiResponse<TransactionsListData>>(TRANSACTIONS_BASE, {
		params: cleanParams(params),
	});
	return unwrapData(data, 'Failed to load transactions.');
}

export async function createTransaction(payload: CreateTransactionRequest) {
	const { data } = await apiPrivate.post<ApiResponse<TransactionMutationData>>(
		TRANSACTIONS_BASE,
		payload,
	);
	return unwrapData(data, 'Failed to create transaction.');
}

export async function updateTransaction(id: string, payload: UpdateTransactionRequest) {
	const { data } = await apiPrivate.patch<ApiResponse<TransactionMutationData>>(
		`${TRANSACTIONS_BASE}/${id}`,
		payload,
	);
	return unwrapData(data, 'Failed to update transaction.');
}

export async function deleteTransaction(id: string) {
	const { data } = await apiPrivate.delete<ApiResponse<null>>(`${TRANSACTIONS_BASE}/${id}`);
	if (data.success === false) {
		throw new ApiError(
			data.message || 'Failed to delete transaction.',
			data.statusCode ?? 0,
			data.details,
		);
	}
}

export async function suggestDescriptions(params: {
	categoryId: string;
	subcategoryId?: string;
	type?: string;
}) {
	const { data } = await apiPrivate.get<ApiResponse<SuggestDescriptionsData>>(
		`${TRANSACTIONS_BASE}/suggest-descriptions`,
		{ params: cleanParams(params) },
	);
	return unwrapData(data, 'Failed to load suggestions.');
}
