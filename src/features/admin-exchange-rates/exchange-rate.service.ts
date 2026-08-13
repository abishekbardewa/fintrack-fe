import { apiPrivate } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/lib/api/types';
import type {
	CreateExchangeRateRequest,
	ExchangeRate,
	ListExchangeRatesParams,
	ListExchangeRatesResponse,
	UpdateExchangeRateRequest,
} from '@/features/admin-exchange-rates/types';

const BASE = '/admin/exchange-rates';

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

export async function listExchangeRates(params: ListExchangeRatesParams = {}) {
	const { data } = await apiPrivate.get<ApiResponse<ListExchangeRatesResponse>>(BASE, {
		params: {
			...(params.from ? { from: params.from } : {}),
			...(params.to ? { to: params.to } : {}),
			...(params.status ? { status: params.status } : {}),
			...(params.process ? { process: params.process } : {}),
			...(params.page != null ? { page: params.page } : {}),
			...(params.limit != null ? { limit: params.limit } : {}),
		},
	});
	return unwrapData(data, 'Failed to load exchange rates.');
}

export async function getExchangeRate(date: string) {
	const { data } = await apiPrivate.get<ApiResponse<ExchangeRate>>(`${BASE}/${date}`);
	return unwrapData(data, 'Failed to load exchange rate.');
}

export async function createExchangeRate(payload: CreateExchangeRateRequest) {
	const { data } = await apiPrivate.post<ApiResponse<ExchangeRate>>(BASE, payload);
	return unwrapData(data, 'Failed to create exchange rate.');
}

export async function updateExchangeRate(date: string, payload: UpdateExchangeRateRequest) {
	const { data } = await apiPrivate.patch<ApiResponse<ExchangeRate>>(`${BASE}/${date}`, payload);
	return unwrapData(data, 'Failed to update exchange rate.');
}

export async function deleteExchangeRate(date: string) {
	const { data } = await apiPrivate.delete<ApiResponse<null>>(`${BASE}/${date}`);
	if (data.success === false) {
		throw new ApiError(
			data.message || 'Failed to delete exchange rate.',
			data.statusCode ?? 0,
			data.details,
		);
	}
}

export async function retryExchangeRate(date: string) {
	const { data } = await apiPrivate.post<ApiResponse<ExchangeRate>>(`${BASE}/${date}/retry`);
	return unwrapData(data, 'Failed to sync exchange rate.');
}

export async function syncTodayExchangeRate() {
	const { data } = await apiPrivate.post<ApiResponse<ExchangeRate>>(`${BASE}/sync-today`);
	return unwrapData(data, 'Failed to sync today’s rate.');
}
