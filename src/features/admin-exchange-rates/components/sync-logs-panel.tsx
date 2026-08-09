import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { NumberedPagination } from '@/components/common/numbered-pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useSyncLogsQuery } from '@/features/admin-exchange-rates/hooks/use-exchange-rates';
import { formatDateTime, syncLogTypeLabel } from '@/features/admin-exchange-rates/utils';
import { cn } from '@/lib/utils';

interface SyncLogsPanelProps {
	page: number;
	onPageChange: (page: number) => void;
	failedOnly: boolean;
	onFailedOnlyChange: (failedOnly: boolean) => void;
}

const PAGE_LIMIT = 20;

export function SyncLogsPanel({
	page,
	onPageChange,
	failedOnly,
	onFailedOnlyChange,
}: SyncLogsPanelProps) {
	const { data, isLoading, isError, refetch, isFetching } = useSyncLogsQuery({
		page,
		limit: PAGE_LIMIT,
		...(failedOnly ? { success: false } : {}),
	});

	const items = data?.items ?? [];
	const total = data?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

	return (
		<div className="flex flex-col gap-4" data-testid="sync-logs-panel">
			<div className="flex flex-wrap items-center gap-2">
				<button
					type="button"
					onClick={() => {
						onFailedOnlyChange(false);
						onPageChange(1);
					}}
					className={cn(
						'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
						!failedOnly
							? 'bg-primary text-primary-foreground shadow-sm'
							: 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
					)}
					data-testid="sync-logs-filter-all"
				>
					All
				</button>
				<button
					type="button"
					onClick={() => {
						onFailedOnlyChange(true);
						onPageChange(1);
					}}
					className={cn(
						'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
						failedOnly
							? 'bg-primary text-primary-foreground shadow-sm'
							: 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
					)}
					data-testid="sync-logs-filter-failed"
				>
					Failed
				</button>
			</div>

			{isLoading ? (
				<div className="space-y-2">
					<Skeleton className="h-16 w-full rounded-xl" />
					<Skeleton className="h-16 w-full rounded-xl" />
					<Skeleton className="h-16 w-full rounded-xl" />
				</div>
			) : null}

			{isError ? (
				<ErrorState
					title="Could not load logs"
					description="Check your connection and try again."
					onRetry={() => void refetch()}
				/>
			) : null}

			{!isLoading && !isError && items.length === 0 ? (
				<EmptyState
					title="No sync logs"
					description={failedOnly ? 'No failed syncs in this list.' : 'Sync activity will show up here.'}
				/>
			) : null}

			{!isLoading && !isError && items.length > 0 ? (
				<>
					<div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
						<ul className="divide-y divide-border">
							{items.map((log) => (
								<li key={log.id} className="px-4 py-3" data-testid={`sync-log-row-${log.id}`}>
									<div className="flex flex-wrap items-start justify-between gap-2">
										<div className="min-w-0">
											<p className="text-sm font-medium text-foreground">
												{log.date} · {syncLogTypeLabel(log.type)}
											</p>
											<p className="mt-0.5 text-xs text-muted-foreground">
												{formatDateTime(log.finishedAt || log.startedAt)}
											</p>
											{log.error ? (
												<p className="mt-1 text-xs text-destructive">{log.error}</p>
											) : null}
										</div>
										<Badge
											variant="outline"
											className={cn(
												'font-medium',
												log.success
													? 'border-income/30 bg-income/10 text-income'
													: 'border-destructive/30 bg-destructive/10 text-destructive',
											)}
										>
											{log.success ? 'OK' : 'Failed'}
										</Badge>
									</div>
								</li>
							))}
						</ul>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-3">
						<p className="text-xs text-muted-foreground">
							{total} log{total === 1 ? '' : 's'}
							{isFetching ? ' · Updating…' : ''}
						</p>
						<NumberedPagination
							page={page}
							totalPages={totalPages}
							onPageChange={onPageChange}
							disabled={isFetching}
						/>
					</div>
				</>
			) : null}

			{isError ? null : (
				<div className="flex justify-end">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => void refetch()}
						disabled={isFetching}
					>
						Refresh
					</Button>
				</div>
			)}
		</div>
	);
}
