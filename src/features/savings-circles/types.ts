export type SavingsCircleStatus = 'active' | 'completed';
export type SavingsCircleFrequency = 'weekly' | 'monthly' | 'yearly';

export type SavingsCircleTransactionSource = 'contribution' | 'payout' | 'payout_to_spendable';

export interface SavingsCircle {
	id: string;
	name: string;
	currency: string;
	notes: string | null;
	status: SavingsCircleStatus;
	contributionAmount: number;
	frequency: SavingsCircleFrequency;
	memberCount: number;
	startDate: string;
	expectedPayout: number;
	pendingPayout: number;
	pendingPayoutPreferred?: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface SavingsCircleTransaction {
	id: string;
	circleId: string;
	amount: number;
	currency: string;
	amountPreferred?: number;
	date: string;
	note: string | null;
	source: SavingsCircleTransactionSource;
	createdAt?: string;
	updatedAt?: string;
}

export interface SavingsCirclesMoney {
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

export interface SavingsCirclesListData {
	circles: SavingsCircle[];
	money?: SavingsCirclesMoney;
}

export interface SavingsCircleMutationData {
	circle: SavingsCircle;
}

export interface SavingsCircleTransactionListParams {
	page?: number;
	limit?: number;
}

export interface SavingsCircleTransactionsListData {
	items: SavingsCircleTransaction[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface SavingsCircleTransactionMutationData {
	transaction: SavingsCircleTransaction;
	circle: SavingsCircle;
}

export interface CreateSavingsCircleRequest {
	name: string;
	currency?: string;
	notes?: string;
	contributionAmount: number;
	frequency: SavingsCircleFrequency;
	memberCount: number;
	startDate: string;
	expectedPayout?: number;
}

export interface UpdateSavingsCircleRequest {
	name?: string;
	notes?: string | null;
	contributionAmount?: number;
	frequency?: SavingsCircleFrequency;
	memberCount?: number;
	startDate?: string;
	expectedPayout?: number;
}

export interface SavingsCircleMovementRequest {
	amount: number;
	currency?: string;
	date?: string;
	note?: string;
}

export interface UpdateSavingsCircleTransactionRequest {
	amount?: number;
	currency?: string;
	date?: string;
	note?: string | null;
}
