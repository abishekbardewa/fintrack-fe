import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { DashboardRecentTransaction } from '@/features/dashboard/types';
import { formatDisplayDate, formatMoney } from '@/features/transactions/utils';
import { cn } from '@/lib/utils';

interface DashboardRecentTransactionsProps {
	items: DashboardRecentTransaction[];
	currency: string;
}

export function DashboardRecentTransactions({ items, currency }: DashboardRecentTransactionsProps) {
	const rows = items.slice(0, 5);

	return (
		<div className="space-y-3" data-testid="dashboard-recent-transactions">
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-base font-semibold tracking-tight">Recent transactions</h2>
				{items.length > 0 ? (
					<Link
						to="/transactions"
						className="text-sm font-medium text-primary underline-offset-4 hover:underline"
					>
						View all
					</Link>
				) : null}
			</div>

			{rows.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-border/70 bg-card/50 px-4 py-8 text-center">
					<p className="text-sm text-muted-foreground">No recent activity.</p>
					<Link
						to="/transactions?add=1"
						className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
					>
						Add transaction
					</Link>
				</div>
			) : (
				<ul className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm divide-y divide-border">
					{rows.map((tx) => {
						const isIncome = tx.type === 'income';
						const category = tx.subcategoryName?.trim() || tx.categoryName;

						return (
							<li
								key={tx.id}
								className="flex items-center gap-3 px-4 py-3"
								data-testid={`dashboard-recent-${tx.id}`}
							>
								<div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
									<Badge
										variant="secondary"
										className={cn(
											'px-1.5 py-0.5',
											isIncome
												? 'bg-income/15 text-income'
												: 'bg-expense/15 text-expense',
										)}
										aria-label={tx.type}
									>
										{isIncome ? <ArrowDownLeft /> : <ArrowUpRight />}
									</Badge>
									<Badge variant="secondary" className="max-w-full truncate px-2.5 py-0.5">
										{category}
									</Badge>
									<Badge variant="outline" className="shrink-0 px-2.5 py-0.5 text-muted-foreground">
										{formatDisplayDate(tx.date)}
									</Badge>
								</div>
								<p
									className={cn(
										'shrink-0 text-sm font-semibold tabular-nums',
										isIncome ? 'text-income' : 'text-foreground',
									)}
								>
									{isIncome ? '+' : '−'}
									{formatMoney(tx.amount, currency)}
								</p>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
