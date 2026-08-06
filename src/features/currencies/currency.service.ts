import { apiPrivate } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/lib/api/types';
import type { CurrenciesListData } from '@/features/currencies/types';

const CURRENCIES_BASE = '/currencies';

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

export async function listCurrencies(enabled = true) {
	const { data } = await apiPrivate.get<ApiResponse<CurrenciesListData>>(CURRENCIES_BASE, {
		params: { enabled },
	});
	return unwrapData(data, 'Failed to load currencies.');
}
