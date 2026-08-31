export type InvestmentStatus = 'active' | 'closed';

export type InvestmentTransactionSource =
	| 'starting_balance'
	| 'contribution'
	| 'return'
	| 'withdrawal'
	| 'loss';

export interface Investment {
	id: string;
	name: string;
	currency: string;
	initialAmount: number;
	currentBalance: number;
	currentBalancePreferred?: number;
	startDate: string | null;
	closedAmount?: number;
	notes: string | null;
	status: InvestmentStatus;
	createdAt?: string;
	updatedAt?: string;
}

export interface InvestmentTransaction {
	id: string;
	investmentId: string;
	amount: number;
	currency: string;
	amountPreferred?: number;
	date: string;
	note: string | null;
	source: InvestmentTransactionSource;
	createdAt?: string;
	updatedAt?: string;
}

export interface InvestmentsMoney {
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

export interface InvestmentsListData {
	investments: Investment[];
	money?: InvestmentsMoney;
}

export interface InvestmentMutationData {
	investment: Investment;
}

export interface InvestmentTransactionListParams {
	page?: number;
	limit?: number;
}

export interface InvestmentTransactionsListData {
	items: InvestmentTransaction[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface InvestmentTransactionMutationData {
	transaction: InvestmentTransaction | null;
	investment: Investment;
}

export interface CreateInvestmentRequest {
	name: string;
	currency?: string;
	notes?: string;
	startDate?: string;
	startingAmount?: number;
}

export interface UpdateInvestmentRequest {
	name?: string;
	notes?: string | null;
	startDate?: string | null;
}

export interface InvestmentMovementRequest {
	amount: number;
	currency?: string;
	date?: string;
	note?: string;
}

export interface StartingBalanceRequest {
	amount: number;
	date?: string;
}

export interface CloseInvestmentRequest {
	date?: string;
	note?: string;
}

export interface UpdateInvestmentTransactionRequest {
	amount?: number;
	currency?: string;
	date?: string;
	note?: string | null;
}
