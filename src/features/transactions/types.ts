export type TransactionType = 'expense' | 'income';

export interface Transaction {
	id: string;
	type: TransactionType;
	amount: number;
	currency: string;
	amountPreferred?: number;
	categoryId: string;
	subcategoryId?: string | null;
	description?: string | null;
	date: string;
	fundedFromGoalId?: string | null;
	createdAt?: string;
	updatedAt?: string;
}

export interface TransactionsListData {
	items: Transaction[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface TransactionMutationData {
	transaction: Transaction;
}

export interface CreateTransactionRequest {
	type: TransactionType;
	amount: number;
	currency?: string;
	categoryId: string;
	subcategoryId?: string | null;
	description?: string;
	date: string;
}

export type UpdateTransactionRequest = Partial<CreateTransactionRequest>;

export interface TransactionListParams {
	q?: string;
	type?: TransactionType | '';
	categoryId?: string;
	subcategoryId?: string;
	from?: string;
	to?: string;
	minAmount?: number;
	maxAmount?: number;
	currency?: string;
	page?: number;
	limit?: number;
}

export interface SuggestDescriptionsData {
	descriptions: string[];
}

export type TransactionExportFormat = 'csv' | 'xlsx';

export type TransactionExportPreset = 'this_month' | 'last_month' | 'last_3_months';

export interface TransactionExportParams {
	format: TransactionExportFormat;
	preset?: TransactionExportPreset;
	from?: string;
	to?: string;
	q?: string;
	type?: TransactionType | '';
	categoryId?: string;
	subcategoryId?: string;
	currency?: string;
	minAmount?: number;
	maxAmount?: number;
}

export interface TransactionExportFile {
	blob: Blob;
	filename: string;
}

export interface ImportTransactionRowRequest {
	date: string;
	type: TransactionType;
	categoryId: string;
	subcategoryId?: string | null;
	amount: number;
	currency?: string;
	description?: string;
}

export interface ImportTransactionsRequest {
	transactions: ImportTransactionRowRequest[];
}

export interface ImportTransactionsData {
	imported: number;
	items: Transaction[];
}

export interface TransactionMonthSummaryTotals {
	spent: number;
	income: number;
	count: number;
}

export interface TransactionMonthSummaryDay {
	date: string;
	spent: number;
	income: number;
	count: number;
}

export type TransactionMonthBudgetStatus = 'ok' | 'warning' | 'over';

export interface TransactionMonthSummaryBudget {
	id: string;
	limit: number;
	spent: number;
	remaining: number;
	percent: number;
	status: TransactionMonthBudgetStatus;
}

export interface TransactionMonthSummaryData {
	year: number;
	month: number;
	currency: string;
	monthTotals: TransactionMonthSummaryTotals;
	days: TransactionMonthSummaryDay[];
	budget: TransactionMonthSummaryBudget | null;
}

export interface TransactionMonthSummaryParams {
	year: number;
	month: number;
}
