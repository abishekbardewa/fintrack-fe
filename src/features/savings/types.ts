export type SavingTransactionSource =
	| 'starting_balance'
	| 'contribution'
	| 'withdrawal'
	| 'return';

export interface Saving {
	id: string;
	name: string;
	currency: string;
	currentAmount: number;
	currentAmountPreferred?: number;
	notes: string | null;
	createdAt?: string;
	updatedAt?: string;
}

export interface SavingTransaction {
	id: string;
	savingId: string;
	amount: number;
	currency: string;
	amountPreferred?: number;
	date: string;
	note: string | null;
	source: SavingTransactionSource;
	createdAt?: string;
	updatedAt?: string;
}

export interface SavingsMoney {
	startingBalance: number;
	openingBalance: number;
	spendable: number;
	available: number;
	inGoals: number;
	inSavings?: number;
	inInvestments?: number;
	financialPosition?: number;
	balance: number;
}

export interface SavingsListData {
	savings: Saving[];
	money?: SavingsMoney;
}

export interface SavingMutationData {
	saving: Saving;
}

export interface SavingTransactionListParams {
	page?: number;
	limit?: number;
}

export interface SavingTransactionsListData {
	items: SavingTransaction[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface SavingTransactionMutationData {
	transaction: SavingTransaction;
	saving: Saving;
}

export interface CreateSavingRequest {
	name: string;
	currency?: string;
	notes?: string;
	startingAmount?: number;
}

export interface UpdateSavingRequest {
	name?: string;
	notes?: string | null;
}

export interface SavingMovementRequest {
	amount: number;
	currency?: string;
	date?: string;
	note?: string;
}

export interface StartingBalanceRequest {
	amount: number;
	date?: string;
}

export interface UpdateSavingTransactionRequest {
	amount?: number;
	currency?: string;
	date?: string;
	note?: string | null;
}
