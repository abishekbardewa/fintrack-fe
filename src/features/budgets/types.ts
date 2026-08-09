export type BudgetPeriodType = 'month' | 'week';
export type BudgetStatus = 'ok' | 'warning' | 'over';

export interface Budget {
	id: string;
	periodType: BudgetPeriodType;
	categoryId: string | null;
	year: number | null;
	month: number | null;
	weekStart: string | null;
	effectiveFrom: string;
	effectiveTo: string;
	limitAmount: number;
	currency: string;
	limitAmountPreferred?: number;
	spent: number;
	spentPreferred?: number;
	remaining: number;
	percent: number;
	status: BudgetStatus;
	createdAt?: string;
	updatedAt?: string;
}

export interface BudgetsListData {
	budgets: Budget[];
}

export interface BudgetMutationData {
	budget: Budget;
}

export interface UpsertBudgetRequest {
	periodType: BudgetPeriodType;
	categoryId?: string | null;
	year?: number;
	month?: number;
	weekStart?: string;
	limitAmount: number;
	currency?: string;
}

export interface ListBudgetsParams {
	periodType: BudgetPeriodType;
	year?: number;
	month?: number;
	weekStart?: string;
}
