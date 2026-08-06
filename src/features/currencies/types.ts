export interface Currency {
	code: string;
	name: string;
	symbol: string;
	decimals?: number;
	enabled?: boolean;
	sortOrder?: number;
}

export interface CurrenciesListData {
	currencies: Currency[];
}
