export type DashboardPeriodType = 'month' | 'year';

export type DashboardBudgetStatus = 'ok' | 'warning' | 'over';

export interface DashboardSummary {
	income: number;
	expense: number;
	net: number;
	periodNet?: number;
	savingsRate: number | null;
	vsPrevious: {
		incomePct: number | null;
		expensePct: number | null;
		netPct: number | null;
	};
	startingBalance?: number;
	openingBalance?: number;
	spendable?: number;
	available?: number;
	inGoals?: number;
	inSavings?: number;
	inInvestments?: number;
	financialPosition?: number;
	balance?: number;
}

export interface DashboardCashFlowPoint {
	date: string;
	label: string;
	income: number;
	expense: number;
}

export interface DashboardCategorySlice {
	categoryId: string | null;
	name: string;
	amount: number;
	percent: number;
}

export interface DashboardCategoryBreakdownSub {
	subcategoryId: string | null;
	name: string | null;
	amount: number;
	percent: number;
}

export interface DashboardCategoryBreakdownRow {
	categoryId: string | null;
	name: string;
	amount: number;
	percent: number;
	subcategories: DashboardCategoryBreakdownSub[];
}

export interface DashboardCategoryCompareSide {
	key: string;
	label: string;
	income: number;
	expense: number;
	net: number;
	byCategory: DashboardCategorySlice[];
}

export interface DashboardCategoryCompare {
	a: DashboardCategoryCompareSide;
	b: DashboardCategoryCompareSide;
}

export interface DashboardBudgetRow {
	id: string;
	categoryId: string | null;
	name: string;
	limit: number;
	spent: number;
	remaining: number;
	percent: number;
	status: DashboardBudgetStatus;
}

export interface DashboardGoalRow {
	id: string;
	name: string;
	current: number;
	target: number;
	remaining: number;
	percent: number;
	targetDate: string | null;
	daysLeft: number | null;
}

export interface DashboardRecentTransaction {
	id: string;
	type: 'income' | 'expense';
	description: string;
	categoryName: string;
	subcategoryName?: string | null;
	amount: number;
	date: string;
	fundedFromGoalId?: string | null;
}

export interface DashboardData {
	period: {
		type: DashboardPeriodType;
		from: string;
		to: string;
		label: string;
	};
	currency: string;
	summary: DashboardSummary;
	cashFlow: DashboardCashFlowPoint[];
	byCategory: DashboardCategorySlice[];
	byCategoryBreakdown?: DashboardCategoryBreakdownRow[];
	byCategoryBreakdownPrevious?: DashboardCategoryBreakdownRow[];
	categoryCompare: DashboardCategoryCompare;
	budgets: DashboardBudgetRow[];
	goals: DashboardGoalRow[];
	recentTransactions: DashboardRecentTransaction[];
}
