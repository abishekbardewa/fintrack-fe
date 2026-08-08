import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

function readCssVar(name: string, fallback: string) {
	if (typeof window === 'undefined') return fallback;
	const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	return value || fallback;
}

function withAlpha(hex: string, alpha: number) {
	const raw = hex.replace('#', '').trim();
	if (raw.length !== 6) return hex;
	const r = Number.parseInt(raw.slice(0, 2), 16);
	const g = Number.parseInt(raw.slice(2, 4), 16);
	const b = Number.parseInt(raw.slice(4, 6), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useDashboardChartColors() {
	const { resolvedTheme } = useTheme();
	const [colors, setColors] = useState({
		income: '#3d7a55',
		expense: '#b85c5c',
		incomeSoft: 'rgba(61, 122, 85, 0.18)',
		expenseSoft: 'rgba(184, 92, 92, 0.18)',
		incomeLine: '#3d7a55',
		expenseLine: '#b85c5c',
		primary: '#4a5d8e',
		primarySoft: 'rgba(74, 93, 142, 0.55)',
		category: [
			'rgba(74, 93, 142, 0.75)',
			'rgba(115, 119, 133, 0.7)',
			'rgba(0, 64, 161, 0.55)',
			'rgba(163, 170, 196, 0.8)',
			'rgba(61, 122, 85, 0.55)',
			'rgba(109, 117, 140, 0.65)',
		],
		grid: 'rgba(195, 198, 214, 0.35)',
		text: '#737785',
	});

	useEffect(() => {
		const income = readCssVar('--income', '#15803d');
		const expense = readCssVar('--expense', '#dc2626');
		const primary = readCssVar('--chart-2', readCssVar('--primary', '#4a5d8e'));
		const chart1 = readCssVar('--chart-1', '#0040a1');
		const chart2 = readCssVar('--chart-2', '#4a5d8e');
		const chart3 = readCssVar('--chart-3', '#737785');
		const chart4 = readCssVar('--chart-4', '#15803d');
		const chart5 = readCssVar('--chart-5', '#0056d2');
		const muted = readCssVar('--muted-foreground', '#737785');
		const border = readCssVar('--border', '#c3c6d6');

		setColors({
			income: withAlpha(income, 0.55),
			expense: withAlpha(expense, 0.5),
			incomeSoft: withAlpha(income, 0.16),
			expenseSoft: withAlpha(expense, 0.14),
			incomeLine: withAlpha(income, 0.75),
			expenseLine: withAlpha(expense, 0.7),
			primary: withAlpha(primary, 0.65),
			primarySoft: withAlpha(primary, 0.45),
			category: [
				withAlpha(chart2, 0.72),
				withAlpha(chart3, 0.68),
				withAlpha(chart1, 0.55),
				withAlpha(chart5, 0.5),
				withAlpha(chart4, 0.45),
				withAlpha(border, 0.85),
			],
			grid: withAlpha(border, 0.28),
			text: muted,
		});
	}, [resolvedTheme]);

	return colors;
}
