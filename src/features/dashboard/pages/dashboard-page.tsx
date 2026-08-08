import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { useAppSelector } from '@/app/hooks';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { selectUser } from '@/features/auth/authSlice';
import { DashboardBudgetHealth } from '@/features/dashboard/components/dashboard-budget-health';
import { DashboardChartPreviews } from '@/features/dashboard/components/dashboard-chart-previews';
import { DashboardGoalsStrip } from '@/features/dashboard/components/dashboard-goals-strip';
import { DashboardRecentTransactions } from '@/features/dashboard/components/dashboard-recent-transactions';
import { DashboardSnapshotCards } from '@/features/dashboard/components/dashboard-snapshot-cards';
import { useDashboardQuery } from '@/features/dashboard/hooks/use-dashboard';
import type { DashboardPeriodType } from '@/features/dashboard/types';
import { cn } from '@/lib/utils';

const PERIODS: { value: DashboardPeriodType; label: string }[] = [
	{ value: 'month', label: 'This month' },
	{ value: 'year', label: 'This year' },
];

export function DashboardPage() {
	const user = useAppSelector(selectUser);
	const [period, setPeriod] = useState<DashboardPeriodType>('month');
	const { data, isLoading, isError, refetch } = useDashboardQuery(period);

	return (
		<div className="flex flex-col gap-8" data-testid="dashboard-page">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{user?.name
							? `Hi ${user.name}${data ? ` · ${data.period.label}` : ''}`
							: (data?.period.label ?? 'Loading…')}
					</p>
				</div>
				<Button asChild data-testid="dashboard-add-transaction">
					<Link to="/transactions?add=1">
						<Plus className="size-4" />
						Add transaction
					</Link>
				</Button>
			</header>

			<div className="flex flex-wrap gap-2" role="tablist" aria-label="Period" data-testid="dashboard-period-tabs">
				{PERIODS.map((item) => {
					const active = period === item.value;
					return (
						<button
							key={item.value}
							type="button"
							role="tab"
							aria-selected={active}
							onClick={() => setPeriod(item.value)}
							className={cn(
								'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
								active
									? 'bg-primary text-primary-foreground shadow-sm'
									: 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
							)}
							data-testid={`dashboard-period-${item.value}`}
						>
							{item.label}
						</button>
					);
				})}
			</div>

			{isLoading && !data ? (
				<div className="flex flex-col gap-8" data-testid="dashboard-loading">
					<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
						<Skeleton className="h-24 rounded-2xl" />
						<Skeleton className="h-24 rounded-2xl" />
						<Skeleton className="h-24 rounded-2xl" />
						<Skeleton className="h-24 rounded-2xl" />
					</div>
					<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
						<div className="space-y-4">
							<Skeleton className="h-72 rounded-2xl" />
							<Skeleton className="h-72 rounded-2xl" />
						</div>
						<div className="space-y-4">
							<Skeleton className="h-28 rounded-2xl" />
							<Skeleton className="h-28 rounded-2xl" />
							<Skeleton className="h-56 rounded-2xl" />
						</div>
					</div>
				</div>
			) : null}

			{isError && !data ? (
				<ErrorState title="Could not load dashboard" onRetry={() => void refetch()} />
			) : null}

			{data ? (
				<>
					<DashboardSnapshotCards
						summary={data.summary}
						currency={data.currency}
						period={period}
					/>

					<div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
						<DashboardChartPreviews
							cashFlow={data.cashFlow}
							categoryCompare={data.categoryCompare}
							currency={data.currency}
							periodLabel={data.period.label}
						/>

						<aside className="flex flex-col gap-6">
							<section>
								<div className="mb-3">
									<div className="flex items-center justify-between gap-3">
										<h2 className="text-base font-semibold tracking-tight">Budgets</h2>
										{data.budgets.length > 0 ? (
											<Link
												to="/budgets"
												className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
											>
												View budgets
											</Link>
										) : null}
									</div>
									<p className="text-xs text-muted-foreground">This month</p>
								</div>
								<DashboardBudgetHealth budgets={data.budgets} currency={data.currency} />
							</section>

							<section>
								<div className="mb-3 flex items-center justify-between gap-3">
									<h2 className="text-base font-semibold tracking-tight">Goals</h2>
									{data.goals.length > 0 ? (
										<Link
											to="/goals"
											className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
										>
											View goals
										</Link>
									) : null}
								</div>
								<DashboardGoalsStrip goals={data.goals} currency={data.currency} />
							</section>

							<section>
								<DashboardRecentTransactions
									items={data.recentTransactions}
									currency={data.currency}
								/>
							</section>
						</aside>
					</div>
				</>
			) : null}
		</div>
	);
}
