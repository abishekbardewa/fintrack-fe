export type ExchangeRateSource = 'frankfurter';
export type ExchangeRateStatus = 'ok' | 'error';
export type ExchangeRateProcess =
	| 'system_cron'
	| 'external_cron_org'
	| 'admin_sync'
	| 'admin_retry'
	| 'admin_manual';

export interface ExchangeRateLastError {
	message: string;
	at: string;
}

export interface ExchangeRate {
	id: string;
	date: string;
	base: string;
	rates: Record<string, number>;
	fetchedAt: string;
	source: ExchangeRateSource;
	status: ExchangeRateStatus;
	process: ExchangeRateProcess;
	triggeredBy: string;
	attemptCount: number;
	lastError: ExchangeRateLastError | null;
	notes: string | null;
	updatedBy: string | null;
	createdAt?: string;
	updatedAt?: string;
}

export interface ListExchangeRatesResponse {
	items: ExchangeRate[];
	page: number;
	limit: number;
	total: number;
	base: string;
	source: string;
}

export interface ListExchangeRatesParams {
	from?: string;
	to?: string;
	status?: ExchangeRateStatus;
	process?: ExchangeRateProcess;
	page?: number;
	limit?: number;
}

export interface CreateExchangeRateRequest {
	date: string;
	rates?: Record<string, number>;
	notes?: string;
}

export interface UpdateExchangeRateRequest {
	rates?: Record<string, number>;
	notes?: string | null;
}
