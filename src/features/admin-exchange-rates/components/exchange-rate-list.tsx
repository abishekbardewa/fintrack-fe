import { Lock, Pencil, RefreshCw, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ExchangeRate } from '@/features/admin-exchange-rates/types';
import { formatDate, formatDateTime, processLabel, RATE_BADGE_CLASS, sortedRateEntries, statusLabel } from '@/features/admin-exchange-rates/utils';
import { cn } from '@/lib/utils';

interface ExchangeRateListProps {
	items: ExchangeRate[];
	retryingDate?: string | null;
	onEdit: (item: ExchangeRate) => void;
	onRetry: (item: ExchangeRate) => void;
	onDelete: (item: ExchangeRate) => void;
}

const META_BADGE_CLASS = 'border-border bg-muted/60 text-muted-foreground dark:bg-muted/40';

const TH = 'px-4 py-2.5 text-left text-xs font-medium tracking-wide whitespace-nowrap text-muted-foreground uppercase first:pl-4 last:pr-4';
const TD = 'px-4 py-3 align-top first:pl-4 last:pr-4';

export function ExchangeRateList({ items, retryingDate, onEdit, onRetry, onDelete }: ExchangeRateListProps) {
	return (
		<div className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-xs" data-testid="exchange-rate-list">
			<table className="w-full min-w-[52rem] border-collapse text-sm">
				<thead>
					<tr className="border-b border-border bg-muted/40">
						<th className={TH}>Date</th>
						<th className={cn(TH, 'w-[18rem]')}>Rates</th>
						<th className={cn(TH, 'w-[18rem]')}>Details</th>
						<th className={TH}>Fetched</th>
						<th className={cn(TH, 'w-[12rem]')}>Notes</th>
						<th className={TH}>Actions</th>
					</tr>
				</thead>
				<tbody>
					{items.map((item) => {
						const retrying = retryingDate === item.date;
						const isManual = item.process === 'admin_manual';
						const showRetry = item.status === 'error' && !isManual;
						const rates = sortedRateEntries(item.rates, item.base);
						const showError = item.status === 'error' && Boolean(item.lastError?.message);

						return (
							<tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-muted/30" data-testid={`exchange-rate-row-${item.date}`}>
								<td className={TD}>
									<p className="font-medium text-foreground whitespace-nowrap">{formatDate(item.date)}</p>
								</td>

								<td className={TD}>
									{rates.length > 0 ? (
										<div className="grid w-fit grid-cols-[auto_auto] gap-x-2 gap-y-1.5">
											{rates.map(({ code, value }) => (
												<RateBadge key={code} code={code} value={value} />
											))}
										</div>
									) : (
										<span className="text-muted-foreground">—</span>
									)}
								</td>

								<td className={TD}>
									<div className="flex flex-wrap gap-1.5">
										<Badge variant="outline" className={cn('h-6 gap-1 rounded-full px-2.5 text-[11px] font-medium', META_BADGE_CLASS)}>
											{processLabel(item.process)}
											{isManual ? <Lock className="size-3 shrink-0" /> : null}
										</Badge>

										{item.triggeredBy ? (
											<Badge
												variant="outline"
												className={cn('h-6 max-w-[9rem] truncate rounded-full px-2.5 text-[11px] font-normal', META_BADGE_CLASS)}
												title={item.triggeredBy}
											>
												{item.triggeredBy}
											</Badge>
										) : null}

										<Badge variant="outline" className={cn('h-6 rounded-full px-2.5 text-[11px] font-normal tabular-nums', META_BADGE_CLASS)}>
											{item.attemptCount} attempt{item.attemptCount === 1 ? '' : 's'}
										</Badge>

										<StatusBadge status={item.status} />

										{showError ? (
											<Badge
												variant="outline"
												className="h-6 max-w-[14rem] truncate rounded-full border-destructive/30 bg-destructive/10 px-2.5 text-[11px] font-normal text-destructive"
												title={`${item.lastError!.message}${item.lastError!.at ? ` · ${formatDateTime(item.lastError!.at)}` : ''}`}
											>
												{item.lastError!.message}
											</Badge>
										) : null}
									</div>
								</td>

								<td className={TD}>
									<p className="text-muted-foreground whitespace-nowrap">{formatDateTime(item.fetchedAt)}</p>
								</td>

								<td className={TD}>
									<p className="truncate text-muted-foreground" title={item.notes ?? undefined}>
										{item.notes || '—'}
									</p>
								</td>

								<td className={TD}>
									<div className="inline-flex items-center justify-end gap-0.5">
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											onClick={() => onEdit(item)}
											aria-label={`Edit ${formatDate(item.date)}`}
											data-testid={`exchange-rate-edit-${item.date}`}
										>
											<Pencil className="size-3.5" />
										</Button>
										{showRetry ? (
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												disabled={retrying}
												onClick={() => onRetry(item)}
												aria-label={`Retry ${formatDate(item.date)}`}
												data-testid={`exchange-rate-retry-${item.date}`}
											>
												<RefreshCw className={cn('size-3.5', retrying && 'animate-spin')} />
											</Button>
										) : null}
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											className="text-destructive hover:bg-destructive/10 hover:text-destructive"
											onClick={() => onDelete(item)}
											aria-label={`Delete ${formatDate(item.date)}`}
											data-testid={`exchange-rate-delete-${item.date}`}
										>
											<Trash2 className="size-3.5" />
										</Button>
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

function RateBadge({ code, value }: { code: string; value: number }) {
	return (
		<Badge
			variant="outline"
			className={cn('h-6 justify-start gap-0 rounded-full px-2.5 py-0 text-[11px] leading-none tabular-nums', RATE_BADGE_CLASS)}
		>
			<span className="font-semibold">{code}:</span>
			<span className="ml-1 font-normal">{value}</span>
		</Badge>
	);
}

function StatusBadge({ status }: { status: ExchangeRate['status'] }) {
	return (
		<Badge
			variant="outline"
			className={cn(
				'h-6 rounded-full px-2.5 text-[11px] font-medium',
				status === 'ok' && 'border-income/30 bg-income/10 text-income',
				status === 'error' && 'border-destructive/30 bg-destructive/10 text-destructive',
			)}
		>
			{statusLabel(status)}
		</Badge>
	);
}
