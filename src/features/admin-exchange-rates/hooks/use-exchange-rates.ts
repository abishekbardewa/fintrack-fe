import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	createExchangeRate,
	deleteExchangeRate,
	getExchangeRate,
	listExchangeRates,
	retryExchangeRate,
	syncTodayExchangeRate,
	updateExchangeRate,
} from '@/features/admin-exchange-rates/exchange-rate.service';
import type {
	CreateExchangeRateRequest,
	ListExchangeRatesParams,
	UpdateExchangeRateRequest,
} from '@/features/admin-exchange-rates/types';

export const exchangeRateKeys = {
	all: ['admin-exchange-rates'] as const,
	lists: () => [...exchangeRateKeys.all, 'list'] as const,
	list: (params: ListExchangeRatesParams) => [...exchangeRateKeys.lists(), params] as const,
	detail: (date: string) => [...exchangeRateKeys.all, 'detail', date] as const,
};

function invalidateExchangeRates(queryClient: ReturnType<typeof useQueryClient>) {
	void queryClient.invalidateQueries({ queryKey: exchangeRateKeys.all });
}

export function useExchangeRatesQuery(params: ListExchangeRatesParams, enabled = true) {
	return useQuery({
		queryKey: exchangeRateKeys.list(params),
		queryFn: () => listExchangeRates(params),
		enabled,
	});
}

export function useExchangeRateQuery(date: string | null, enabled = true) {
	return useQuery({
		queryKey: exchangeRateKeys.detail(date ?? ''),
		queryFn: () => getExchangeRate(date!),
		enabled: Boolean(date) && enabled,
	});
}

export function useCreateExchangeRateMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateExchangeRateRequest) => createExchangeRate(payload),
		onSuccess: () => invalidateExchangeRates(queryClient),
	});
}

export function useUpdateExchangeRateMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ date, payload }: { date: string; payload: UpdateExchangeRateRequest }) =>
			updateExchangeRate(date, payload),
		onSuccess: () => invalidateExchangeRates(queryClient),
	});
}

export function useDeleteExchangeRateMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (date: string) => deleteExchangeRate(date),
		onSuccess: () => invalidateExchangeRates(queryClient),
	});
}

export function useRetryExchangeRateMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (date: string) => retryExchangeRate(date),
		onSuccess: () => invalidateExchangeRates(queryClient),
	});
}

export function useSyncTodayExchangeRateMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => syncTodayExchangeRate(),
		onSuccess: () => invalidateExchangeRates(queryClient),
	});
}
