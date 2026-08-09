import { useEffect, useMemo, useState } from 'react';
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip, type ChartOptions } from 'chart.js';
import { useTheme } from 'next-themes';
import { Bar } from 'react-chartjs-2';

import type { DashboardCategorySlice } from '@/features/dashboard/types';
import { formatMoney } from '@/features/transactions/utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface DashboardCategoryBreakdownProps {
	slices: DashboardCategorySlice[];
	currency: string;
}

function readCssVar(name: string, fallback: string) {
	if (typeof window === 'undefined') return fallback;
	const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	return value || fallback;
}

export function DashboardCategoryBreakdown({ slices, currency }: DashboardCategoryBreakdownProps) {
	const { resolvedTheme } = useTheme();
	const [colors, setColors] = useState({
		bar: '#0040a1',
		grid: '#c3c6d6',
		text: '#424654',
	});

	useEffect(() => {
		setColors({
			bar: readCssVar('--primary', '#0040a1'),
			grid: readCssVar('--border', '#c3c6d6'),
			text: readCssVar('--muted-foreground', '#424654'),
		});
	}, [resolvedTheme]);

	const ordered = useMemo(() => [...slices].reverse(), [slices]);

	const data = useMemo(
		() => ({
			labels: ordered.map((s) => s.name),
			datasets: [
				{
					data: ordered.map((s) => s.amount),
					backgroundColor: colors.bar,
					borderRadius: 8,
					borderSkipped: false as const,
					barThickness: 18,
				},
			],
		}),
		[ordered, colors.bar],
	);

	const options = useMemo<ChartOptions<'bar'>>(
		() => ({
			indexAxis: 'y',
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { display: false },
				tooltip: {
					callbacks: {
						label(ctx) {
							const slice = ordered[ctx.dataIndex];
							const amount = formatMoney(ctx.parsed.x ?? 0, currency);
							return slice ? `${amount} · ${slice.percent}%` : amount;
						},
					},
				},
			},
			scales: {
				x: {
					beginAtZero: true,
					grid: { color: `${colors.grid}55` },
					ticks: {
						color: colors.text,
						callback(value) {
							const n = Number(value);
							if (n >= 1000) return `${Math.round(n / 1000)}k`;
							return String(n);
						},
					},
					border: { display: false },
				},
				y: {
					grid: { display: false },
					ticks: { color: colors.text },
					border: { display: false },
				},
			},
		}),
		[colors, currency, ordered],
	);

	if (slices.length === 0) {
		return <p className="py-10 text-center text-sm text-muted-foreground">No spending this period.</p>;
	}

	return (
		<div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
			<div className="h-56 w-full sm:h-64" data-testid="dashboard-category-chart">
				<Bar data={data} options={options} />
			</div>
			<ul className="flex flex-col justify-center gap-2.5" data-testid="dashboard-category-list">
				{slices.map((slice) => (
					<li key={slice.categoryId ?? 'other'} className="flex items-center justify-between gap-3 text-sm">
						<span className="min-w-0 truncate text-foreground">{slice.name}</span>
						<span className="shrink-0 tabular-nums text-muted-foreground">
							{formatMoney(slice.amount, currency)}
							<span className="ml-2 text-xs">{slice.percent}%</span>
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}
