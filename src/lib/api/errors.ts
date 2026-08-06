import axios from 'axios';

import type { ApiErrorResponse, ApiValidationDetail } from '@/lib/api/types';

export class ApiError extends Error {
	readonly statusCode: number;
	readonly details?: ApiValidationDetail[];

	constructor(message: string, statusCode: number, details?: ApiValidationDetail[]) {
		super(message);
		this.name = 'ApiError';
		this.statusCode = statusCode;
		this.details = details;
	}
}

function readErrorBody(error: unknown): ApiErrorResponse | undefined {
	if (!axios.isAxiosError(error)) return undefined;
	const data = error.response?.data;
	if (!data || typeof data !== 'object') return undefined;
	return data as ApiErrorResponse;
}

export function toApiError(error: unknown, fallback = 'Something went wrong. Please try again.'): ApiError {
	if (error instanceof ApiError) return error;

	if (axios.isAxiosError(error)) {
		const body = readErrorBody(error);
		const statusCode = body?.statusCode ?? error.response?.status ?? 0;
		const message = body?.message || error.message || fallback;
		return new ApiError(message, statusCode, body?.details);
	}

	if (error instanceof Error && error.message) {
		return new ApiError(error.message, 0);
	}

	return new ApiError(fallback, 0);
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
	return toApiError(error, fallback).message;
}

export function getFieldErrors<T extends string>(
	error: unknown,
	allowedFields: readonly T[],
): Partial<Record<T, string>> {
	const apiError = toApiError(error);
	if (!apiError.details?.length) return {};

	const allowed = new Set<string>(allowedFields);
	const fieldErrors: Partial<Record<T, string>> = {};

	for (const detail of apiError.details) {
		const field = detail.field as T;
		if (allowed.has(field) && fieldErrors[field] === undefined) {
			fieldErrors[field] = detail.message;
		}
	}

	return fieldErrors;
}
