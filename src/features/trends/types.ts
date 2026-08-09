export type TrendsRangeType =
	| 'last6'
	| 'last12'
	| 'year'
	| 'lastYear'
	| 'last2y'
	| 'last5y';

export interface TrendsSummary {
	income: number;
	expense: number;
	net: number;
	savingsRate: number | null;
	vsPrevious: {
		incomePct: number | null;
		expensePct: number | null;
		netPct: number | null;
	};
}

export interface TrendsMonthPoint {
	month: string;
	label: string;
	income: number;
	expense: number;
	net: number;
}

export interface TrendsCategorySeries {
	categoryId: string;
	name: string;
	points: { month: string; label: string; amount: number }[];
}

export interface TrendsData {
	range: {
		type: TrendsRangeType;
		from: string;
		to: string;
		label: string;
	};
	currency: string;
	summary: TrendsSummary;
	series: TrendsMonthPoint[];
	categoryOptions: { id: string; name: string }[];
	categorySeries: TrendsCategorySeries[];
}
