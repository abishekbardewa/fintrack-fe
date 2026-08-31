import { MoreHorizontal, Pencil, Trash2, TrendingDown, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SavingTransaction } from '@/features/savings/types';
import {
	formatDisplayDate,
	isSavingOutflow,
	savingTransactionKindLabel,
	transactionDisplayAmount,
} from '@/features/savings/utils';
import { cn } from '@/lib/utils';

interface SavingHistoryListProps {
	items: SavingTransaction[];
	preferredCurrency: string;
	onEdit: (item: SavingTransaction) => void;
	onDelete: (item: SavingTransaction) => void;
}

const ROW_GRID = 'sm:grid-cols-[8.5rem_minmax(0,1fr)_minmax(0,1.2fr)_7rem_9rem_2.5rem]';

export function SavingHistoryList({
	items,
	preferredCurrency,
	onEdit,
	onDelete,
}: SavingHistoryListProps) {
	return (
		<div
			className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
			data-testid="saving-history-list"
		>
			<div
				className={cn(
					'hidden gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:grid',
					ROW_GRID,
				)}
			>
				<span>Date</span>
				<span>Type</span>
				<span>Note</span>
				<span>Updated</span>
				<span className="text-right">Amount</span>
				<span className="sr-only">Actions</span>
			</div>

			<ul className="divide-y divide-border">
				{items.map((item) => {
					const isOutflow = isSavingOutflow(item);
					const KindIcon = isOutflow ? TrendingDown : TrendingUp;
					const kind = savingTransactionKindLabel(item);
					const description = item.note?.trim() || '';
					const updated = item.updatedAt ? formatDisplayDate(item.updatedAt) : '—';

					return (
						<li
							key={item.id}
							className={cn(
								'group px-3 py-3 transition-colors hover:bg-muted/30 sm:grid sm:items-center sm:gap-3 sm:px-4',
								ROW_GRID,
							)}
							data-testid={`saving-row-${item.id}`}
						>
							<div className="mb-2 flex items-start justify-between gap-2 sm:mb-0 sm:block">
								<p className="text-sm font-medium text-foreground">
									{formatDisplayDate(item.date)}
								</p>
								<div className="text-right sm:hidden">
									<p
										className={cn(
											'inline-flex items-center gap-1 font-semibold tabular-nums',
											isOutflow ? 'text-foreground' : 'text-income',
										)}
									>
										<KindIcon
											className={cn(
												'size-3.5 shrink-0',
												isOutflow ? 'text-expense' : 'text-income',
											)}
											aria-hidden="true"
										/>
										{isOutflow ? '−' : '+'}
										{transactionDisplayAmount(item, preferredCurrency)}
									</p>
								</div>
							</div>

							<div className="mb-2 min-w-0 sm:mb-0">
								<Badge variant="secondary" className="max-w-full truncate px-2.5 py-0.5">
									{kind}
								</Badge>
							</div>

							<div className="mb-2 min-w-0 sm:mb-0">
								<p className="truncate text-sm text-foreground">{description}</p>
								<p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
									Updated {updated}
								</p>
							</div>

							<div className="mb-2 hidden min-w-0 sm:mb-0 sm:block">
								<p className="truncate text-sm text-muted-foreground tabular-nums">{updated}</p>
							</div>

							<div className="hidden text-right sm:block">
								<p
									className={cn(
										'inline-flex items-center justify-end gap-1 font-semibold tabular-nums',
										isOutflow ? 'text-foreground' : 'text-income',
									)}
								>
									<KindIcon
										className={cn(
											'size-3.5 shrink-0',
											isOutflow ? 'text-expense' : 'text-income',
										)}
										aria-hidden="true"
									/>
									{isOutflow ? '−' : '+'}
									{transactionDisplayAmount(item, preferredCurrency)}
								</p>
							</div>

							<div className="flex justify-end">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											aria-label="Entry actions"
											data-testid={`saving-entry-actions-${item.id}`}
										>
											<MoreHorizontal className="size-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => onEdit(item)}>
											<Pencil className="size-4" />
											Edit
										</DropdownMenuItem>
										<DropdownMenuItem variant="destructive" onClick={() => onDelete(item)}>
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
