import { useMemo } from 'react';
import {
	BarElement,
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
import { Bar, Line } from 'react-chartjs-2';

import { useDashboardChartColors } from '@/features/dashboard/hooks/use-dashboard-chart-colors';
import type { TrendsCategorySeries, TrendsMonthPoint } from '@/features/trends/types';
import { cn } from '@/lib/utils';

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Filler,
	Tooltip,
	Legend,
);

function ChartCard({
	title,
	hint,
	headerExtra,
	children,
	className,
}: {
	title: string;
	hint: string;
	headerExtra?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<article
			className={cn(
				'flex flex-col rounded-2xl border border-border/60 bg-card p-4 shadow-sm',
				className,
			)}
		>
			<div className="mb-3">
				<h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
				<p className="text-xs text-muted-foreground">{hint}</p>
				{headerExtra ? <div className="mt-3">{headerExtra}</div> : null}
			</div>
			<div className="min-h-56 w-full flex-1 sm:min-h-64">{children}</div>
		</article>
	);
}

function moneyTick(value: string | number) {
	const n = Number(value);
	if (n >= 1000) return `${Math.round(n / 1000)}k`;
	return String(n);
}

interface TrendsChartPreviewsProps {
	series: TrendsMonthPoint[];
	categorySeries: TrendsCategorySeries[];
	categoryOptions: { id: string; name: string }[];
	selectedCategoryIds: string[];
	onToggleCategory: (id: string) => void;
	currency: string;
	rangeLabel: string;
}

export function TrendsChartPreviews({
	series,
	categorySeries,
	categoryOptions,
	selectedCategoryIds,
	onToggleCategory,
	currency,
	rangeLabel,
}: TrendsChartPreviewsProps) {
	const colors = useDashboardChartColors();
	const labels = series.map((p) => p.label);
	const income = series.map((p) => p.income);
	const expense = series.map((p) => p.expense);
	const net = series.map((p) => p.net);

	const selectedCats = categorySeries.filter((c) => selectedCategoryIds.includes(c.categoryId));
	const catLabels = selectedCats[0]?.points.map((p) => p.label) ?? labels;
	const catColors = [colors.primary, colors.incomeLine, colors.expenseLine, colors.primarySoft];

	const sharedScale = useMemo(
		() => ({
			x: {
				grid: { display: false },
				ticks: { color: colors.text, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
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

	const legend = useMemo(
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

	const lineOptions = useMemo<ChartOptions<'line'>>(
		() => ({
			responsive: true,
			maintainAspectRatio: false,
			interaction: { mode: 'index', intersect: false },
			plugins: {
				legend,
				tooltip: {
					callbacks: {
						label(ctx) {
							return `${ctx.dataset.label}: ${currency} ${(ctx.parsed.y ?? 0).toLocaleString()}`;
						},
					},
				},
			},
			scales: sharedScale,
			elements: {
				line: { tension: 0.35, borderWidth: 2 },
				point: { radius: 2, hoverRadius: 4 },
			},
		}),
		[legend, sharedScale, currency],
	);

	const barOptions = useMemo<ChartOptions<'bar'>>(
		() => ({
			responsive: true,
			maintainAspectRatio: false,
			interaction: { mode: 'index', intersect: false },
			plugins: {
				legend,
				tooltip: {
					callbacks: {
						label(ctx) {
							return `${ctx.dataset.label}: ${currency} ${(ctx.parsed.y ?? 0).toLocaleString()}`;
						},
					},
				},
			},
			scales: sharedScale,
		}),
		[legend, sharedScale, currency],
	);

	const categoryPicker = (
		<div className="flex flex-wrap gap-2" data-testid="trends-category-picker">
			{categoryOptions.map((cat) => {
				const active = selectedCategoryIds.includes(cat.id);
				return (
					<button
						key={cat.id}
						type="button"
						onClick={() => onToggleCategory(cat.id)}
						className={cn(
							'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
							active
								? 'bg-primary/15 text-primary ring-1 ring-primary/30'
								: 'bg-muted text-muted-foreground hover:text-foreground',
						)}
						data-testid={`trends-category-${cat.id}`}
					>
						{cat.name}
					</button>
				);
			})}
		</div>
	);

	return (
		<div className="space-y-4" data-testid="trends-charts">
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<ChartCard title="Cash over time" hint={rangeLabel}>
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
						options={lineOptions}
					/>
				</ChartCard>

				<ChartCard
					title="Category over time"
					hint="Pick up to 2 categories"
					headerExtra={categoryPicker}
				>
					{selectedCats.length === 0 ? (
						<p className="flex h-full items-center justify-center text-sm text-muted-foreground">
							Pick at least one category.
						</p>
					) : (
						<Line
							data={{
								labels: catLabels,
								datasets: selectedCats.map((cat, i) => ({
									label: cat.name,
									data: cat.points.map((p) => p.amount),
									borderColor: catColors[i % catColors.length],
									backgroundColor: 'transparent',
									fill: false,
								})),
							}}
							options={lineOptions}
						/>
					)}
				</ChartCard>
			</div>

			<ChartCard title="Monthly bars" hint="Income vs Spent by month">
				<Bar
					data={{
						labels,
						datasets: [
							{
								label: 'Income',
								data: income,
								backgroundColor: colors.income,
								borderRadius: 6,
								borderSkipped: false,
								maxBarThickness: 28,
							},
							{
								label: 'Spent',
								data: expense,
								backgroundColor: colors.expense,
								borderRadius: 6,
								borderSkipped: false,
								maxBarThickness: 28,
							},
						],
					}}
					options={barOptions}
				/>
			</ChartCard>
		</div>
	);
}
