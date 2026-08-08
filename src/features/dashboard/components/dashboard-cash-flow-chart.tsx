import { useEffect, useMemo, useState } from 'react';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip, type ChartOptions } from 'chart.js';
import { useTheme } from 'next-themes';
import { Bar } from 'react-chartjs-2';

import type { DashboardCashFlowPoint } from '@/features/dashboard/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface DashboardCashFlowChartProps {
	points: DashboardCashFlowPoint[];
	currency: string;
}

function readCssVar(name: string, fallback: string) {
	if (typeof window === 'undefined') return fallback;
	const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	return value || fallback;
}

export function DashboardCashFlowChart({ points, currency }: DashboardCashFlowChartProps) {
	const { resolvedTheme } = useTheme();
	const [colors, setColors] = useState({
		income: '#15803d',
		expense: '#dc2626',
		grid: '#c3c6d6',
		text: '#424654',
	});

	useEffect(() => {
		setColors({
			income: readCssVar('--income', '#15803d'),
			expense: readCssVar('--expense', '#dc2626'),
			grid: readCssVar('--border', '#c3c6d6'),
			text: readCssVar('--muted-foreground', '#424654'),
		});
	}, [resolvedTheme]);

	const data = useMemo(
		() => ({
			labels: points.map((p) => p.label),
			datasets: [
				{
					label: 'Income',
					data: points.map((p) => p.income),
					backgroundColor: colors.income,
					borderRadius: 6,
					borderSkipped: false as const,
					maxBarThickness: 28,
				},
				{
					label: 'Spent',
					data: points.map((p) => p.expense),
					backgroundColor: colors.expense,
					borderRadius: 6,
					borderSkipped: false as const,
					maxBarThickness: 28,
				},
			],
		}),
		[points, colors],
	);

	const options = useMemo<ChartOptions<'bar'>>(
		() => ({
			responsive: true,
			maintainAspectRatio: false,
			interaction: { mode: 'index', intersect: false },
			plugins: {
				legend: {
					position: 'top',
					align: 'end',
					labels: {
						boxWidth: 10,
						boxHeight: 10,
						usePointStyle: true,
						pointStyle: 'rectRounded',
						color: colors.text,
						font: { size: 12 },
					},
				},
				tooltip: {
					callbacks: {
						label(ctx) {
							const value = ctx.parsed.y ?? 0;
							return `${ctx.dataset.label}: ${currency} ${value.toLocaleString()}`;
						},
					},
				},
			},
			scales: {
				x: {
					grid: { display: false },
					ticks: { color: colors.text, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
					border: { display: false },
				},
				y: {
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
			},
		}),
		[colors, currency],
	);

	if (points.length === 0) {
		return <p className="py-10 text-center text-sm text-muted-foreground">No cash flow for this period.</p>;
	}

	return (
		<div className="h-64 w-full sm:h-72" data-testid="dashboard-cash-flow-chart">
			<Bar data={data} options={options} />
		</div>
	);
}
