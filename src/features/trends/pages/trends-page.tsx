import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';

import { useAppSelector } from '@/app/hooks';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { selectUser } from '@/features/auth/authSlice';
import { TrendsChartPreviews } from '@/features/trends/components/trends-chart-previews';
import { TrendsSummaryCards } from '@/features/trends/components/trends-summary';
import { useTrendsQuery } from '@/features/trends/hooks/use-trends';
import type { TrendsRangeType } from '@/features/trends/types';
import { buildTransactionsHref, toDateInputValue } from '@/features/transactions/utils';
import { toApiError } from '@/lib/api/errors';
import { cn } from '@/lib/utils';

const PRIMARY_RANGES: { value: TrendsRangeType; label: string }[] = [
	{ value: 'last6', label: 'Last 6 months' },
	{ value: 'year', label: 'This year' },
	{ value: 'lastYear', label: 'Last year' },
];

const MORE_RANGES: { value: TrendsRangeType; label: string }[] = [
	{ value: 'last12', label: 'Last 12 months' },
	{ value: 'last2y', label: 'Last 2 years' },
	{ value: 'last5y', label: 'Last 5 years' },
];

const MORE_RANGE_VALUES = new Set(MORE_RANGES.map((r) => r.value));

function sameIds(a: string[], b: string[]) {
	return a.length === b.length && a.every((id, i) => id === b[i]);
}

export function TrendsPage() {
	const userId = useAppSelector(selectUser)?.id;
	const [range, setRange] = useState<TrendsRangeType>('last6');
	const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
	const { data, error, isLoading, isError, isPlaceholderData, refetch } = useTrendsQuery(
		range,
		selectedCategoryIds,
	);
	const moreActive = MORE_RANGE_VALUES.has(range);

	useEffect(() => {
		setSelectedCategoryIds([]);
	}, [userId]);

	useEffect(() => {
		if (!data?.categoryOptions || isPlaceholderData) return;
		const optionIds = new Set(data.categoryOptions.map((category) => category.id));
		setSelectedCategoryIds((prev) => {
			const valid = prev.filter((id) => optionIds.has(id));
			return sameIds(valid, prev) ? prev : valid;
		});
	}, [data, isPlaceholderData]);

	useEffect(() => {
		if (!isError || selectedCategoryIds.length === 0) return;
		if (toApiError(error).statusCode !== 422) return;
		setSelectedCategoryIds([]);
	}, [isError, error, selectedCategoryIds.length]);

	const toggleCategory = (id: string) => {
		setSelectedCategoryIds((prev) => {
			if (prev.includes(id)) {
				return prev.filter((x) => x !== id);
			}
			if (prev.length >= 2) return [prev[1], id];
			return [...prev, id];
		});
	};

	const transactionsHref = data
		? buildTransactionsHref({
				from: toDateInputValue(data.range.from),
				to: toDateInputValue(data.range.to),
			})
		: '/transactions';

	const showError = isError && !data && toApiError(error).statusCode !== 422;

	return (
		<div className="flex flex-col gap-8" data-testid="trends-page">
			<header>
				<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Trends</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					{data?.range.label ?? 'Loading…'}
				</p>
			</header>

			<div className="flex flex-wrap items-center gap-2" data-testid="trends-range-row">
				<div
					className="flex flex-wrap items-center gap-2"
					role="tablist"
					aria-label="Range"
					data-testid="trends-range-tabs"
				>
					{PRIMARY_RANGES.map((item) => {
						const active = range === item.value;
						return (
							<button
								key={item.value}
								type="button"
								role="tab"
								aria-selected={active}
								onClick={() => setRange(item.value)}
								className={cn(
									'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
									active
										? 'bg-primary text-primary-foreground shadow-sm'
										: 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
								)}
								data-testid={`trends-range-${item.value}`}
							>
								{item.label}
							</button>
						);
					})}

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="outline"
								size="icon-sm"
								aria-label="More ranges"
								className={cn(moreActive && 'border-primary text-primary')}
								data-testid="trends-range-more"
							>
								<MoreHorizontal className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							{MORE_RANGES.map((item) => (
								<DropdownMenuItem
									key={item.value}
									onClick={() => setRange(item.value)}
									data-testid={`trends-range-${item.value}`}
									className={cn(range === item.value && 'bg-accent')}
								>
									{item.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<Button
					asChild
					variant="outline"
					size="sm"
					className="ml-auto"
					data-testid="trends-view-transactions"
				>
					<Link to={transactionsHref}>View transactions</Link>
				</Button>
			</div>

			{isLoading && !data ? (
				<div className="flex flex-col gap-4" data-testid="trends-loading">
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
						<Skeleton className="h-24 rounded-2xl" />
						<Skeleton className="h-24 rounded-2xl" />
						<Skeleton className="h-24 rounded-2xl" />
					</div>
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<Skeleton className="h-72 rounded-2xl" />
						<Skeleton className="h-72 rounded-2xl" />
					</div>
					<Skeleton className="h-72 rounded-2xl" />
				</div>
			) : null}

			{showError ? (
				<ErrorState title="Could not load trends" onRetry={() => void refetch()} />
			) : null}

			{data ? (
				<>
					<TrendsSummaryCards
						summary={data.summary}
						currency={data.currency}
						range={range}
					/>

					<TrendsChartPreviews
						series={data.series}
						categorySeries={data.categorySeries}
						categoryOptions={data.categoryOptions}
						selectedCategoryIds={selectedCategoryIds}
						onToggleCategory={toggleCategory}
						currency={data.currency}
						rangeLabel={data.range.label}
					/>
				</>
			) : null}
		</div>
	);
}
