import { ArrowDownLeft, ArrowUpRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

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

function categoryParts(tx: Transaction, labels: Map<string, string>) {
	const main = labels.get(tx.categoryId) ?? 'Category';
	const sub = tx.subcategoryId ? labels.get(tx.subcategoryId) : undefined;
	return { main, sub };
}

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
			<div className="hidden grid-cols-[7rem_minmax(0,1.4fr)_minmax(0,1fr)_8rem_2.5rem] gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:grid">
				<span>Date</span>
				<span>Description</span>
				<span>Category</span>
				<span className="text-right">Amount</span>
				<span className="sr-only">Actions</span>
			</div>

			<ul className="divide-y divide-border">
				{items.map((tx) => {
					const isIncome = tx.type === 'income';
					const { main, sub } = categoryParts(tx, categoryLabels);
					const title = tx.description?.trim() || main;
					const showPreferred =
						tx.amountPreferred != null &&
						tx.currency !== preferredCurrency &&
						tx.amountPreferred !== tx.amount;

					return (
						<li
							key={tx.id}
							className="group px-3 py-3 transition-colors hover:bg-muted/30 sm:grid sm:grid-cols-[7rem_minmax(0,1.4fr)_minmax(0,1fr)_8rem_2.5rem] sm:items-center sm:gap-3 sm:px-4"
							data-testid={`transaction-row-${tx.id}`}
						>
							<div className="mb-2 flex items-start justify-between gap-2 sm:mb-0 sm:block">
								<div>
									<p className="text-sm font-medium text-foreground">
										{formatDisplayDate(tx.date)}
									</p>
									<p className="text-xs capitalize text-muted-foreground sm:hidden">
										{tx.type}
									</p>
								</div>
								<div className="text-right sm:hidden">
									<p
										className={cn(
											'font-semibold tabular-nums',
											isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground',
										)}
									>
										{isIncome ? '+' : '−'}
										{formatMoney(tx.amount, tx.currency)}
									</p>
								</div>
							</div>

							<div className="mb-2 flex min-w-0 items-center gap-3 sm:mb-0">
								<span
									className={cn(
										'flex size-9 shrink-0 items-center justify-center rounded-full',
										isIncome ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600',
									)}
									aria-hidden="true"
								>
									{isIncome ? (
										<ArrowDownLeft className="size-4" />
									) : (
										<ArrowUpRight className="size-4" />
									)}
								</span>
								<div className="min-w-0">
									<p className="truncate font-medium text-foreground">{title}</p>
									<p className="truncate text-xs capitalize text-muted-foreground">
										{tx.type}
									</p>
								</div>
							</div>

							<div className="mb-2 min-w-0 sm:mb-0">
								{sub ? (
									<span className="inline-flex max-w-full items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
										<span className="truncate">{sub}</span>
									</span>
								) : (
									<span className="inline-flex max-w-full items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
										<span className="truncate">{main}</span>
									</span>
								)}
								{sub ? (
									<p className="mt-1 truncate text-xs text-muted-foreground">{main}</p>
								) : null}
							</div>

							<div className="hidden text-right sm:block">
								<p
									className={cn(
										'font-semibold tabular-nums',
										isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground',
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
