export interface CurrencyOption {
	code: string;
	name: string;
	symbol: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
	{ code: 'USD', name: 'US Dollar', symbol: '$' },
	{ code: 'EUR', name: 'Euro', symbol: '€' },
	{ code: 'GBP', name: 'British Pound', symbol: '£' },
	{ code: 'INR', name: 'Indian Rupee', symbol: '₹' },
	{ code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
	{ code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
	{ code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
	{ code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
];

export const DEFAULT_CURRENCY = 'USD';

export function getBrowserTimezone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
	} catch {
		return 'UTC';
	}
}
