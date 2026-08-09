import axios from 'axios';

import { apiPrivate } from '@/lib/api/client';
import { ApiError, toApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/lib/api/types';
import type {
	CreateTransactionRequest,
	ImportTransactionsData,
	ImportTransactionsRequest,
	SuggestDescriptionsData,
	TransactionExportFile,
	TransactionExportFormat,
	TransactionExportParams,
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

function filenameFromDisposition(header: string | undefined, format: TransactionExportFormat) {
	const fallback = `fintrack-transactions.${format === 'xlsx' ? 'xlsx' : 'csv'}`;
	if (!header) return fallback;
	const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);
	if (utfMatch?.[1]) {
		try {
			return decodeURIComponent(utfMatch[1].trim());
		} catch {
			return utfMatch[1].trim();
		}
	}
	const plainMatch = /filename="?([^";]+)"?/i.exec(header);
	return plainMatch?.[1]?.trim() || fallback;
}

async function throwExportError(error: unknown): Promise<never> {
	if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
		try {
			const text = await error.response.data.text();
			const body = JSON.parse(text) as ApiResponse<null>;
			throw new ApiError(
				body.message || 'Export failed.',
				body.statusCode ?? error.response.status,
				body.success === false ? body.details : undefined,
			);
		} catch (parsed) {
			if (parsed instanceof ApiError) throw parsed;
		}
	}
	throw toApiError(error, 'Export failed.');
}

export async function exportTransactions(
	params: TransactionExportParams,
): Promise<TransactionExportFile> {
	try {
		const response = await apiPrivate.get<Blob>(`${TRANSACTIONS_BASE}/export`, {
			params: cleanParams(params),
			responseType: 'blob',
		});
		return {
			blob: response.data,
			filename: filenameFromDisposition(
				response.headers['content-disposition'] as string | undefined,
				params.format,
			),
		};
	} catch (error) {
		return throwExportError(error);
	}
}

export async function importTransactions(
	payload: ImportTransactionsRequest,
): Promise<ImportTransactionsData> {
	const { data } = await apiPrivate.post<ApiResponse<ImportTransactionsData>>(
		`${TRANSACTIONS_BASE}/import`,
		payload,
	);
	return unwrapData(data, 'Failed to import transactions.');
}
