export type SavingsGoalStatus = 'active' | 'completed' | 'cancelled';

export type GoalContributionSource =
	| 'set_aside'
	| 'starting_balance'
	| 'goal_spend'
	| 'return_to_available'
	| 'manual';

export interface SavingsGoal {
	id: string;
	name: string;
	targetAmount: number;
	currency: string;
	currentAmount: number;
	targetAmountPreferred?: number;
	currentAmountPreferred?: number;
	percent: number;
	remaining: number;
	targetDate: string | null;
	status: SavingsGoalStatus;
	createdAt?: string;
	updatedAt?: string;
}

export interface GoalContribution {
	id: string;
	goalId: string;
	amount: number;
	currency: string;
	amountPreferred?: number;
	date: string;
	note: string | null;
	source: GoalContributionSource;
	transactionId: string | null;
	categoryId?: string | null;
	subcategoryId?: string | null;
	description?: string | null;
	createdAt?: string;
	updatedAt?: string;
}

export interface GoalsMoney {
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

export interface GoalsListData {
	goals: SavingsGoal[];
	money?: GoalsMoney;
}

export interface GoalMutationData {
	goal: SavingsGoal;
}

export interface ContributionListParams {
	page?: number;
	limit?: number;
}

export interface ContributionsListData {
	items: GoalContribution[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface ContributionMutationData {
	contribution: GoalContribution;
	goal: SavingsGoal;
}

export interface CreateGoalRequest {
	name: string;
	targetAmount: number;
	currency?: string;
	targetDate?: string;
	startingAmount?: number;
}

export interface UpdateGoalRequest {
	name?: string;
	targetAmount?: number;
	targetDate?: string | null;
	status?: SavingsGoalStatus;
}

export interface CreateContributionRequest {
	amount: number;
	currency?: string;
	date?: string;
	note?: string;
}

export interface StartingBalanceRequest {
	amount: number;
	date?: string;
}

export interface UpdateContributionRequest {
	amount?: number;
	currency?: string;
	date?: string;
	note?: string | null;
	categoryId?: string;
	subcategoryId?: string | null;
	description?: string | null;
}

export interface SpendFromGoalRequest {
	amount: number;
	currency?: string;
	categoryId: string;
	subcategoryId?: string;
	description?: string;
	date?: string;
}

export interface ReturnToAvailableRequest {
	amount?: number;
	currency?: string;
	date?: string;
	note?: string;
	cancel?: boolean;
}

export interface SpendFromGoalData {
	contribution: GoalContribution;
	goal: SavingsGoal;
}

export interface ReturnToAvailableData {
	contribution: GoalContribution | null;
	goal: SavingsGoal;
}

