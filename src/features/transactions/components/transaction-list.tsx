import { ArrowDownLeft, ArrowUpRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Transaction } from '@/features/transactions/types';
import { formatDisplayDate, formatMoney } from '@/features/transactions/utils';
import { cn } from '@/lib/utils';

interface TransactionListProps {
	items: Transaction[];
	categoryLabels: Map<string, string>;
	preferredCurrency: string;
	onEdit: (tx: Transaction) => void;
	onDelete: (tx: Transaction) => void;
}

function categoryLabel(tx: Transaction, labels: Map<string, string>) {
	if (tx.subcategoryId) {
		return labels.get(tx.subcategoryId) ?? labels.get(tx.categoryId) ?? 'Category';
	}
	return labels.get(tx.categoryId) ?? 'Category';
}

const ROW_GRID =
	'sm:grid-cols-[8.5rem_7.5rem_minmax(0,1fr)_minmax(0,1.2fr)_7rem_8rem_2.5rem]';

export function TransactionList({
	items,
	categoryLabels,
	preferredCurrency,
	onEdit,
	onDelete,
}: TransactionListProps) {
	return (
		<div
			className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
			data-testid="transaction-list"
		>
			<div
				className={cn(
					'hidden gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:grid',
					ROW_GRID,
				)}
			>
				<span>Spent Date</span>
				<span>Type</span>
				<span>Category</span>
				<span>Description</span>
				<span>Updated</span>
				<span className="text-right">Amount</span>
				<span className="sr-only">Actions</span>
			</div>

			<ul className="divide-y divide-border">
				{items.map((tx) => {
					const isIncome = tx.type === 'income';
					const category = categoryLabel(tx, categoryLabels);
					const description = tx.description?.trim() || '';
					const updated = tx.updatedAt ? formatDisplayDate(tx.updatedAt) : '—';
					const showPreferred =
						tx.amountPreferred != null &&
						tx.currency !== preferredCurrency &&
						tx.amountPreferred !== tx.amount;

					return (
						<li
							key={tx.id}
							className={cn(
								'group px-3 py-3 transition-colors hover:bg-muted/30 sm:grid sm:items-center sm:gap-3 sm:px-4',
								ROW_GRID,
							)}
							data-testid={`transaction-row-${tx.id}`}
						>
							<div className="mb-2 flex items-start justify-between gap-2 sm:mb-0 sm:block">
								<p className="text-sm font-medium text-foreground">
									{formatDisplayDate(tx.date)}
								</p>
								<div className="text-right sm:hidden">
									<p
										className={cn(
											'font-semibold tabular-nums',
											isIncome ? 'text-income' : 'text-foreground',
										)}
									>
										{isIncome ? '+' : '−'}
										{formatMoney(tx.amount, tx.currency)}
									</p>
								</div>
							</div>

							<div className="mb-2 sm:mb-0">
								<Badge
									variant="secondary"
									className={cn(
										'gap-1 px-2 py-1 font-medium capitalize',
										isIncome
											? 'bg-income/15 text-income'
											: 'bg-expense/15 text-expense',
									)}
								>
									{isIncome ? (
										<ArrowDownLeft className="size-3.5" />
									) : (
										<ArrowUpRight className="size-3.5" />
									)}
									{tx.type}
								</Badge>
							</div>

							<div className="mb-2 min-w-0 sm:mb-0">
								<Badge variant="secondary" className="max-w-full truncate px-2.5 py-0.5">
									{category}
								</Badge>
							</div>

							<div className="mb-2 min-w-0 sm:mb-0">
								<p className="truncate text-sm text-foreground">{description}</p>
								<p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
									Updated {updated}
								</p>
							</div>

							<div className="mb-2 hidden min-w-0 sm:mb-0 sm:block">
								<p className="truncate text-sm text-muted-foreground tabular-nums">
									{updated}
								</p>
							</div>

							<div className="hidden text-right sm:block">
								<p
									className={cn(
										'font-semibold tabular-nums',
										isIncome ? 'text-income' : 'text-foreground',
									)}
								>
									{isIncome ? '+' : '−'}
									{formatMoney(tx.amount, tx.currency)}
								</p>
								{showPreferred ? (
									<p className="text-xs text-muted-foreground tabular-nums">
										≈ {formatMoney(tx.amountPreferred!, preferredCurrency)}
									</p>
								) : null}
							</div>

							<div className="flex justify-end">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											aria-label="Transaction actions"
											data-testid={`transaction-actions-${tx.id}`}
										>
											<MoreHorizontal className="size-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => onEdit(tx)}>
											<Pencil className="size-4" />
											Edit
										</DropdownMenuItem>
										<DropdownMenuItem variant="destructive" onClick={() => onDelete(tx)}>
											<Trash2 className="size-4" />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
