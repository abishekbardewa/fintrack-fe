import { useQuery } from '@tanstack/react-query';

import { listCurrencies } from '@/features/currencies/currency.service';

export const currencyKeys = {
	all: ['currencies'] as const,
	list: (enabled: boolean) => [...currencyKeys.all, 'list', { enabled }] as const,
};

export function useCurrenciesQuery(enabled = true) {
	return useQuery({
		queryKey: currencyKeys.list(enabled),
		queryFn: () => listCurrencies(enabled),
		staleTime: 5 * 60 * 1000,
	});
}
