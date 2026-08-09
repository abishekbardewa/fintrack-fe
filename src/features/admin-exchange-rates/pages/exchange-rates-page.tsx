import { useMemo, useState } from 'react';
import { ArrowLeftRight, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { NumberedPagination } from '@/components/common/numbered-pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExchangeRateDeleteDialog } from '@/features/admin-exchange-rates/components/exchange-rate-delete-dialog';
import {
	ExchangeRateFilters,
	type ExchangeRateFilterDraft,
} from '@/features/admin-exchange-rates/components/exchange-rate-filters';
import { ExchangeRateFormDialog } from '@/features/admin-exchange-rates/components/exchange-rate-form-dialog';
import { ExchangeRateList } from '@/features/admin-exchange-rates/components/exchange-rate-list';
import { ExchangeRateRetryDialog } from '@/features/admin-exchange-rates/components/exchange-rate-retry-dialog';
import { SyncLogsPanel } from '@/features/admin-exchange-rates/components/sync-logs-panel';
import {
	useCreateExchangeRateMutation,
	useDeleteExchangeRateMutation,
	useExchangeRatesQuery,
	useRetryExchangeRateMutation,
	useSyncTodayExchangeRateMutation,
	useUpdateExchangeRateMutation,
} from '@/features/admin-exchange-rates/hooks/use-exchange-rates';
import type {
	CreateExchangeRateRequest,
	ExchangeRate,
	UpdateExchangeRateRequest,
} from '@/features/admin-exchange-rates/types';
import { useCurrenciesQuery } from '@/features/currencies/hooks/use-currencies';
import { getErrorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/utils';

const PAGE_LIMIT = 20;

type PanelTab = 'rates' | 'logs';

export function ExchangeRatesPage() {
	const [tab, setTab] = useState<PanelTab>('rates');
	const [filters, setFilters] = useState<ExchangeRateFilterDraft>({
		from: '',
		to: '',
		status: 'all',
	});
	const [page, setPage] = useState(1);
	const [logsPage, setLogsPage] = useState(1);
	const [logsFailedOnly, setLogsFailedOnly] = useState(false);

	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<ExchangeRate | null>(null);
	const [deleting, setDeleting] = useState<ExchangeRate | null>(null);
	const [retrying, setRetrying] = useState<ExchangeRate | null>(null);

	const listParams = useMemo(
		() => ({
			page,
			limit: PAGE_LIMIT,
			...(filters.from ? { from: filters.from } : {}),
			...(filters.to ? { to: filters.to } : {}),
			...(filters.status !== 'all' ? { status: filters.status } : {}),
		}),
		[filters, page],
	);

	const { data, isLoading, isError, refetch, isFetching } = useExchangeRatesQuery(listParams);
	const { data: currenciesData } = useCurrenciesQuery(true);
	const createMutation = useCreateExchangeRateMutation();
	const updateMutation = useUpdateExchangeRateMutation();
	const deleteMutation = useDeleteExchangeRateMutation();
	const retryMutation = useRetryExchangeRateMutation();
	const syncTodayMutation = useSyncTodayExchangeRateMutation();

	const items = data?.items ?? [];
	const total = data?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
	const currencies = currenciesData?.currencies ?? [];

	const formPending = createMutation.isPending || updateMutation.isPending;

	const handleFiltersChange = (next: ExchangeRateFilterDraft) => {
		setFilters(next);
		setPage(1);
	};

	const openCreate = () => {
		setEditing(null);
		setFormOpen(true);
	};

	const openEdit = (item: ExchangeRate) => {
		setEditing(item);
		setFormOpen(true);
	};

	const handleFormOpenChange = (open: boolean) => {
		setFormOpen(open);
		if (!open) setEditing(null);
	};

	const handleCreate = async (payload: CreateExchangeRateRequest) => {
		try {
			await createMutation.mutateAsync(payload);
			toast.success('Exchange rate created');
			handleFormOpenChange(false);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not create exchange rate.'));
		}
	};

	const handleUpdate = async (date: string, payload: UpdateExchangeRateRequest) => {
		try {
			await updateMutation.mutateAsync({ date, payload });
			toast.success('Exchange rate updated');
			handleFormOpenChange(false);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not update exchange rate.'));
		}
	};

	const handleDelete = async () => {
		if (!deleting) return;
		try {
			await deleteMutation.mutateAsync(deleting.date);
			toast.success('Exchange rate deleted');
			setDeleting(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not delete exchange rate.'));
		}
	};

	const handleRetry = async () => {
		if (!retrying) return;
		try {
			await retryMutation.mutateAsync(retrying.date);
			toast.success('Exchange rate sync succeeded');
			setRetrying(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Exchange rate sync failed'));
		}
	};

	const handleSyncToday = async () => {
		try {
			await syncTodayMutation.mutateAsync();
			toast.success('Today’s rate synced');
		} catch (error) {
			toast.error(getErrorMessage(error, 'Exchange rate sync failed'));
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Exchange rates</h1>
					<p className="mt-1 text-sm text-muted-foreground">Daily FX rates for conversions.</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => void handleSyncToday()}
						disabled={syncTodayMutation.isPending}
						data-testid="exchange-rate-sync-today"
					>
						<RefreshCw
							className={cn('size-4', syncTodayMutation.isPending && 'animate-spin')}
						/>
						Sync today
					</Button>
					<Button type="button" onClick={openCreate} data-testid="exchange-rate-add">
						<Plus className="size-4" />
						Add rate
					</Button>
				</div>
			</header>

			<div className="flex flex-wrap gap-2" role="tablist" aria-label="Admin panels">
				{(
					[
						{ value: 'rates', label: 'Rates' },
						{ value: 'logs', label: 'Sync logs' },
					] as const
				).map((item) => {
					const active = tab === item.value;
					return (
						<button
							key={item.value}
							type="button"
							role="tab"
							aria-selected={active}
							onClick={() => setTab(item.value)}
							className={cn(
								'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
								active
									? 'bg-primary text-primary-foreground shadow-sm'
									: 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
							)}
							data-testid={`exchange-rate-tab-${item.value}`}
						>
							{item.label}
						</button>
					);
				})}
			</div>

			{tab === 'rates' ? (
				<>
					<ExchangeRateFilters value={filters} onChange={handleFiltersChange} />

					{isLoading ? (
						<div className="space-y-2">
							<Skeleton className="h-14 w-full rounded-xl" />
							<Skeleton className="h-14 w-full rounded-xl" />
							<Skeleton className="h-14 w-full rounded-xl" />
						</div>
					) : null}

					{isError ? (
						<ErrorState
							title="Could not load rates"
							description="Check your connection and try again."
							onRetry={() => void refetch()}
						/>
					) : null}

					{!isLoading && !isError && items.length === 0 ? (
						<EmptyState
							icon={ArrowLeftRight}
							title="No rates yet"
							description="Sync today or add a manual rate."
							action={
								<Button type="button" onClick={openCreate}>
									<Plus className="size-4" />
									Add rate
								</Button>
							}
						/>
					) : null}

					{!isLoading && !isError && items.length > 0 ? (
						<>
							<ExchangeRateList
								items={items}
								retryingDate={retryMutation.isPending ? retrying?.date : null}
								onEdit={openEdit}
								onRetry={setRetrying}
								onDelete={setDeleting}
							/>
							<div className="flex flex-wrap items-center justify-between gap-3">
								<p className="text-xs text-muted-foreground">
									{total} rate{total === 1 ? '' : 's'}
									{isFetching ? ' · Updating…' : ''}
								</p>
								<NumberedPagination
									page={page}
									totalPages={totalPages}
									onPageChange={setPage}
									disabled={isFetching}
								/>
							</div>
						</>
					) : null}
				</>
			) : (
				<SyncLogsPanel
					page={logsPage}
					onPageChange={setLogsPage}
					failedOnly={logsFailedOnly}
					onFailedOnlyChange={setLogsFailedOnly}
				/>
			)}

			<ExchangeRateFormDialog
				open={formOpen}
				onOpenChange={handleFormOpenChange}
				item={editing}
				currencies={currencies}
				pending={formPending}
				onCreate={handleCreate}
				onUpdate={handleUpdate}
			/>

			<ExchangeRateRetryDialog
				open={retrying != null}
				onOpenChange={(open) => {
					if (!open && !retryMutation.isPending) setRetrying(null);
				}}
				date={retrying?.date ?? ''}
				pending={retryMutation.isPending}
				onConfirm={() => void handleRetry()}
			/>

			<ExchangeRateDeleteDialog
				open={deleting != null}
				onOpenChange={(open) => {
					if (!open && !deleteMutation.isPending) setDeleting(null);
				}}
				date={deleting?.date ?? ''}
				pending={deleteMutation.isPending}
				onConfirm={() => void handleDelete()}
			/>
		</div>
	);
}
