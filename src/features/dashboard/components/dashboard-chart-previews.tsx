import { useMemo, useState } from 'react';
import {
	ArcElement,
	CategoryScale,
	Chart as ChartJS,
	Filler,
	Legend,
	LineElement,
	LinearScale,
	PointElement,
	Tooltip,
	type ChartOptions,
} from 'chart.js';
import { Info } from 'lucide-react';
import { Doughnut, Line } from 'react-chartjs-2';

import { DashboardCategoryBreakdownDialog } from '@/features/dashboard/components/dashboard-category-breakdown-dialog';
import { useDashboardChartColors } from '@/features/dashboard/hooks/use-dashboard-chart-colors';
import type {
	DashboardCashFlowPoint,
	DashboardCategoryBreakdownRow,
	DashboardCategoryCompare,
} from '@/features/dashboard/types';
import { formatMoney } from '@/features/transactions/utils';
import { cn } from '@/lib/utils';

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	ArcElement,
	Filler,
	Tooltip,
	Legend,
);

function ChartCard({
	title,
	hint,
	children,
	chartClassName,
}: {
	title: string;
	hint: string;
	children: React.ReactNode;
	chartClassName?: string;
}) {
	return (
		<article className="flex flex-col rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
			<div className="mb-3">
				<h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
				<p className="text-xs text-muted-foreground">{hint}</p>
			</div>
			<div className={cn('min-h-56 w-full flex-1 sm:min-h-64', chartClassName)}>{children}</div>
		</article>
	);
}

function moneyTick(value: string | number) {
	const n = Number(value);
	if (n >= 1000) return `${Math.round(n / 1000)}k`;
	return String(n);
}

interface DashboardChartPreviewsProps {
	cashFlow: DashboardCashFlowPoint[];
	categoryCompare: DashboardCategoryCompare;
	byCategoryBreakdown?: DashboardCategoryBreakdownRow[];
	byCategoryBreakdownPrevious?: DashboardCategoryBreakdownRow[];
	currency: string;
	periodLabel: string;
}

export function DashboardChartPreviews({
	cashFlow,
	categoryCompare,
	byCategoryBreakdown = [],
	byCategoryBreakdownPrevious = [],
	currency,
	periodLabel,
}: DashboardChartPreviewsProps) {
	const colors = useDashboardChartColors();
	const [breakdown, setBreakdown] = useState<{
		items: DashboardCategoryBreakdownRow[];
		label: string;
		totalSpent: number;
	} | null>(null);
	const labels = cashFlow.map((p) => p.label);
	const income = cashFlow.map((p) => p.income);
	const expense = cashFlow.map((p) => p.expense);
	const net = cashFlow.map((p) => p.income - p.expense);
	const compareSides = (() => {
		const { a, b } = categoryCompare;
		if (a.label === periodLabel) return [a, b];
		if (b.label === periodLabel) return [b, a];
		if (/^(current|this)(_|$)/i.test(a.key)) return [a, b];
		if (/^(current|this)(_|$)/i.test(b.key)) return [b, a];
		// Prefer newer period key (e.g. 2026-08 before 2026-07)
		return a.key >= b.key ? [a, b] : [b, a];
	})();
	const compareHint = `${compareSides[0].label} vs ${compareSides[1].label}`;

	const sharedScaleOptions = useMemo(
		() => ({
			x: {
				grid: { display: false },
				ticks: { color: colors.text, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
				border: { display: false },
			},
			y: {
				beginAtZero: true,
				grid: { color: colors.grid },
				ticks: { color: colors.text, callback: moneyTick },
				border: { display: false },
			},
		}),
		[colors],
	);

	const legendOptions = useMemo(
		() => ({
			position: 'top' as const,
			align: 'end' as const,
			labels: {
				boxWidth: 8,
				boxHeight: 8,
				usePointStyle: true,
				pointStyle: 'circle' as const,
				color: colors.text,
				font: { size: 11 },
			},
		}),
		[colors.text],
	);

	const lineLikeOptions = useMemo<ChartOptions<'line'>>(
		() => ({
			responsive: true,
			maintainAspectRatio: false,
			interaction: { mode: 'index', intersect: false },
			plugins: {
				legend: legendOptions,
				tooltip: {
					callbacks: {
						label(ctx) {
							return `${ctx.dataset.label}: ${currency} ${(ctx.parsed.y ?? 0).toLocaleString()}`;
						},
					},
				},
			},
			scales: sharedScaleOptions,
			elements: {
				line: { tension: 0.35, borderWidth: 2 },
				point: { radius: 2, hoverRadius: 4 },
			},
		}),
		[legendOptions, sharedScaleOptions, currency],
	);

	return (
		<div className="space-y-4" data-testid="dashboard-charts">
			<ChartCard title="Spending by category" hint={compareHint} chartClassName="min-h-auto">
				<div className="grid grid-cols-1 gap-8 xl:grid-cols-2 xl:gap-6">
					{compareSides.map((side, sideIndex) => {
						const isCurrent = sideIndex === 0;
						const sideBreakdown = isCurrent
							? byCategoryBreakdown
							: byCategoryBreakdownPrevious;
						const showSideBreakdown = sideBreakdown.length > 0;

						return (
							<div key={side.key} className="min-w-0 space-y-3">
								<p className="text-xs font-medium text-foreground">{side.label}</p>
								<div className="flex flex-col gap-4">
									<div className="mx-auto aspect-square w-full max-w-52">
										<Doughnut
											data={{
												labels: side.byCategory.map((c) => c.name),
												datasets: [
													{
														data: side.byCategory.map((c) => c.amount),
														backgroundColor: side.byCategory.map(
															(_, i) => colors.category[i % colors.category.length],
														),
														borderWidth: 0,
														hoverOffset: 4,
													},
												],
											}}
											options={{
												responsive: true,
												maintainAspectRatio: true,
												cutout: '62%',
												plugins: {
													legend: { display: false },
													tooltip: {
														callbacks: {
															label(ctx) {
																const row = side.byCategory[ctx.dataIndex];
																return row
																	? `${row.name}: ${formatMoney(row.amount, currency)} (${row.percent}%)`
																	: '';
															},
														},
													},
												},
											}}
										/>
									</div>

									<div className="min-w-0 space-y-2.5">
										<ul className="space-y-1 text-xs">
											<li className="flex items-center justify-between gap-3">
												<span className="text-muted-foreground">Income</span>
												<span className="tabular-nums font-medium text-income">
													{formatMoney(side.income, currency)}
												</span>
											</li>
											<li className="flex items-center justify-between gap-3">
												<span className="text-muted-foreground">Spent</span>
												<span className="tabular-nums font-medium text-foreground">
													{formatMoney(side.expense, currency)}
												</span>
											</li>
											<li className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
												<span className="text-muted-foreground">Net</span>
												<span
													className={cn(
														'tabular-nums font-medium',
														side.net >= 0 ? 'text-income' : 'text-expense',
													)}
												>
													{formatMoney(side.net, currency)}
												</span>
											</li>
										</ul>

										<ul className="space-y-1.5">
											{side.byCategory.map((slice, i) => (
												<li
													key={slice.categoryId ?? `${side.key}-other`}
													className="flex min-w-0 items-start justify-between gap-3 text-xs"
												>
													<span className="flex min-w-0 items-center gap-1.5">
														<span
															className="size-2.5 shrink-0 rounded-full"
															style={{
																backgroundColor:
																	colors.category[i % colors.category.length],
															}}
															aria-hidden="true"
														/>
														<span className="truncate text-foreground">{slice.name}</span>
													</span>
													<span className="shrink-0 text-right tabular-nums text-muted-foreground">
														{formatMoney(slice.amount, currency)}
														<span className="ml-1 opacity-70">{slice.percent}%</span>
													</span>
												</li>
											))}
										</ul>

										{showSideBreakdown ? (
											<button
												type="button"
												onClick={() =>
													setBreakdown({
														items: sideBreakdown,
														label: side.label,
														totalSpent: side.expense,
													})
												}
												className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
												data-testid={
													isCurrent
														? 'dashboard-see-breakdown'
														: 'dashboard-see-breakdown-previous'
												}
											>
												<Info className="size-3.5 shrink-0" aria-hidden="true" />
												See full breakdown
											</button>
										) : null}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</ChartCard>

			<DashboardCategoryBreakdownDialog
				open={breakdown != null}
				onOpenChange={(open) => {
					if (!open) setBreakdown(null);
				}}
				items={breakdown?.items ?? []}
				totalSpent={breakdown?.totalSpent ?? 0}
				currency={currency}
				periodLabel={breakdown?.label ?? periodLabel}
			/>

			<ChartCard title="Cash flow" hint={`${periodLabel} · Income + spent filled · net as line`}>
				{cashFlow.length === 0 ? (
					<p className="flex h-full items-center justify-center text-sm text-muted-foreground">
						No cash flow for this period.
					</p>
				) : (
					<Line
						data={{
							labels,
							datasets: [
								{
									label: 'Income',
									data: income,
									borderColor: colors.incomeLine,
									backgroundColor: colors.incomeSoft,
									fill: true,
									order: 2,
								},
								{
									label: 'Spent',
									data: expense,
									borderColor: colors.expenseLine,
									backgroundColor: colors.expenseSoft,
									fill: true,
									order: 3,
								},
								{
									label: 'Net',
									data: net,
									borderColor: colors.primary,
									backgroundColor: 'transparent',
									borderDash: [4, 4],
									fill: false,
									order: 1,
								},
							],
						}}
						options={lineLikeOptions}
					/>
				)}
			</ChartCard>
		</div>
	);
}
