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
import { getErrorMessage, toApiError } from '@/lib/api/errors';
import { DEFAULT_CURRENCY } from '@/lib/currencies';
import { cn } from '@/lib/utils';

const PAGE_LIMIT = 20;

export function ExchangeRatesPage() {
	const [filters, setFilters] = useState<ExchangeRateFilterDraft>({
		from: '',
		to: '',
		status: 'all',
		process: 'all',
	});
	const [page, setPage] = useState(1);

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
			...(filters.process !== 'all' ? { process: filters.process } : {}),
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
	const listBase = data?.base ?? DEFAULT_CURRENCY;
	const listSource = data?.source ?? 'frankfurter';
	const filtersActive =
		Boolean(filters.from || filters.to) ||
		filters.status !== 'all' ||
		filters.process !== 'all';

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
			toast.success(
				payload.rates ? 'Exchange rate created' : 'Exchange rate fetched',
			);
			handleFormOpenChange(false);
		} catch (error) {
			const apiError = toApiError(error);
			if (apiError.statusCode === 409) {
				toast.error(apiError.message || 'A rate already exists for this date.');
				return;
			}
			if (apiError.statusCode === 502) {
				toast.error(apiError.message || 'Frankfurter fetch failed.');
				return;
			}
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

	const showChromeSkeleton = isLoading && !data;

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Exchange rates</h1>
					<p className="mt-1 text-sm text-muted-foreground">Keep conversions honest and up to date.</p>
				</div>
				{showChromeSkeleton ? (
					<div className="flex flex-wrap gap-2">
						<Skeleton className="h-9 w-28 rounded-full" />
						<Skeleton className="h-9 w-28 rounded-full" />
					</div>
				) : (
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
				)}
			</header>

			{showChromeSkeleton ? (
				<div className="flex flex-wrap items-center justify-between gap-3" aria-hidden="true">
					<div className="flex flex-wrap gap-2">
						<Skeleton className="h-10 w-40 rounded-lg" />
						<Skeleton className="h-10 w-32 rounded-lg" />
						<Skeleton className="h-10 w-40 rounded-lg" />
					</div>
					<Skeleton className="h-4 w-48" />
				</div>
			) : (
				<div className="flex flex-wrap items-center justify-between gap-3">
					<ExchangeRateFilters value={filters} onChange={handleFiltersChange} />
					<p className="text-sm text-muted-foreground">
						Base: <span className="font-medium text-foreground">{listBase}</span>
						<span className="mx-2" aria-hidden="true">
							·
						</span>
						Source: <span className="font-medium text-foreground">{listSource}</span>
					</p>
				</div>
			)}

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
					description={
						filtersActive
							? 'Try adjusting or clearing your filters.'
							: 'Sync today or add a rate.'
					}
					action={
						filtersActive ? undefined : (
							<Button type="button" onClick={openCreate}>
								<Plus className="size-4" />
								Add rate
							</Button>
						)
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
