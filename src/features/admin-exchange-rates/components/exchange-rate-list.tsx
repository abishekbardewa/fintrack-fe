import { Pencil, RefreshCw, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ExchangeRate } from '@/features/admin-exchange-rates/types';
import {
	formatDateTime,
	RATE_BADGE_CLASS,
	sortedRateEntries,
	sourceLabel,
	statusLabel,
} from '@/features/admin-exchange-rates/utils';
import { cn } from '@/lib/utils';

interface ExchangeRateListProps {
	items: ExchangeRate[];
	retryingDate?: string | null;
	onEdit: (item: ExchangeRate) => void;
	onRetry: (item: ExchangeRate) => void;
	onDelete: (item: ExchangeRate) => void;
}

const ROW_GRID =
	'w-full grid-cols-[7rem_4.5rem_minmax(0,1fr)_5.5rem_auto_5.5rem]';

export function ExchangeRateList({
	items,
	retryingDate,
	onEdit,
	onRetry,
	onDelete,
}: ExchangeRateListProps) {
	return (
		<div
			className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-xs"
			data-testid="exchange-rate-list"
		>
			<div
				className={cn(
					'hidden gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:grid',
					ROW_GRID,
				)}
			>
				<span>Date</span>
				<span>Status</span>
				<span>Rates</span>
				<span>Source</span>
				<span>Updated</span>
				<span className="text-right">Actions</span>
			</div>

			<ul className="divide-y divide-border">
				{items.map((item) => {
					const retrying = retryingDate === item.date;
					return (
						<li
							key={item.id}
							className={cn(
								'group px-3 py-3 transition-colors hover:bg-muted/30 sm:grid sm:items-start sm:gap-3 sm:px-4',
								ROW_GRID,
							)}
							data-testid={`exchange-rate-row-${item.date}`}
						>
							<div className="mb-2 flex items-start justify-between gap-2 sm:mb-0 sm:block">
								<p className="text-sm font-medium text-foreground">{item.date}</p>
								<div className="sm:hidden">
									<StatusBadge status={item.status} />
								</div>
							</div>

							<div className="mb-2 hidden sm:mb-0 sm:block">
								<StatusBadge status={item.status} />
							</div>

							<div className="mb-2 min-w-0 sm:mb-0">
								<div className="flex flex-wrap gap-1">
									{sortedRateEntries(item.rates, item.base).map(({ code, value }) => (
										<Badge
											key={code}
											variant="outline"
											className={cn(
												'h-5 px-1.5 py-0 text-[10px] font-medium leading-none tabular-nums',
												RATE_BADGE_CLASS,
											)}
										>
											{code} {value}
										</Badge>
									))}
								</div>
								{item.lastError?.message ? (
									<p className="mt-1 truncate text-xs text-destructive">
										{item.lastError.message}
									</p>
								) : null}
								{item.notes ? (
									<p className="mt-1 truncate text-xs text-muted-foreground">{item.notes}</p>
								) : null}
							</div>

							<div className="mb-2 sm:mb-0">
								<p className="text-sm text-muted-foreground">{sourceLabel(item.source)}</p>
							</div>

							<div className="mb-2 whitespace-nowrap sm:mb-0">
								<p className="text-sm text-muted-foreground">
									{formatDateTime(item.updatedAt)}
								</p>
							</div>

							<div className="flex items-center justify-end gap-0.5">
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									onClick={() => onEdit(item)}
									aria-label={`Edit ${item.date}`}
									data-testid={`exchange-rate-edit-${item.date}`}
								>
									<Pencil className="size-3.5" />
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									disabled={retrying}
									onClick={() => onRetry(item)}
									aria-label={`Retry ${item.date}`}
									data-testid={`exchange-rate-retry-${item.date}`}
								>
									<RefreshCw className={cn('size-3.5', retrying && 'animate-spin')} />
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="text-destructive hover:bg-destructive/10 hover:text-destructive"
									onClick={() => onDelete(item)}
									aria-label={`Delete ${item.date}`}
									data-testid={`exchange-rate-delete-${item.date}`}
								>
									<Trash2 className="size-3.5" />
								</Button>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

function StatusBadge({ status }: { status: ExchangeRate['status'] }) {
	return (
		<Badge
			variant="outline"
			className={cn(
				'font-medium',
				status === 'ok' && 'border-income/30 bg-income/10 text-income',
				status === 'error' && 'border-destructive/30 bg-destructive/10 text-destructive',
				status === 'manual' && 'border-primary/30 bg-primary/10 text-primary',
			)}
		>
			{statusLabel(status)}
		</Badge>
	);
}
