export type ExchangeRateSource = 'frankfurter' | 'manual' | 'admin_retry';
export type ExchangeRateStatus = 'ok' | 'error' | 'manual';
export type SyncLogType = 'daily_cron' | 'retry_date' | 'manual';

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
	attemptCount: number;
	lastError: ExchangeRateLastError | null;
	notes: string | null;
	updatedBy: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface SyncLog {
	id: string;
	type: SyncLogType;
	date: string;
	success: boolean;
	error: string | null;
	triggeredBy: string;
	startedAt: string;
	finishedAt: string;
	createdAt: string;
}

export interface AdminListEnvelope<T> {
	items: T[];
	page: number;
	limit: number;
	total: number;
}

export interface ListExchangeRatesParams {
	from?: string;
	to?: string;
	status?: ExchangeRateStatus;
	page?: number;
	limit?: number;
}

export interface ListSyncLogsParams {
	page?: number;
	limit?: number;
	success?: boolean;
}

export interface CreateExchangeRateRequest {
	date: string;
	base?: string;
	rates: Record<string, number>;
	notes?: string;
}

export interface UpdateExchangeRateRequest {
	rates?: Record<string, number>;
	notes?: string | null;
	status?: ExchangeRateStatus;
}
