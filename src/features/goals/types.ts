export type SavingsGoalStatus = 'active' | 'completed' | 'cancelled';

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
	source: 'manual' | 'income_transaction';
	transactionId: string | null;
	createdAt?: string;
	updatedAt?: string;
}

export interface GoalsListData {
	goals: SavingsGoal[];
}

export interface GoalMutationData {
	goal: SavingsGoal;
}

export interface ContributionsListData {
	contributions: GoalContribution[];
}

export interface ContributionMutationData {
	contribution: GoalContribution;
	goal: SavingsGoal;
}

export interface CreateGoalRequest {
	name: string;
	targetAmount: number;
	currency?: string;
	targetDate?: string | null;
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

export const MAX_ACTIVE_SAVINGS_GOALS = 10;
