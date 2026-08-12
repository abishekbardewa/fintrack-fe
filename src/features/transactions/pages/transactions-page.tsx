import { useMemo, useState } from 'react';
import { Plus, Receipt, Upload } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useAppSelector } from '@/app/hooks';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { NumberedPagination } from '@/components/common/numbered-pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { selectUser } from '@/features/auth/authSlice';
import { useCategoriesQuery } from '@/features/categories/hooks/use-categories';
import { TransactionDeleteDialog } from '@/features/transactions/components/transaction-delete-dialog';
import {
	TransactionExportDialog,
	type TransactionExportSelection,
} from '@/features/transactions/components/transaction-export-dialog';
import { TransactionExportMenu } from '@/features/transactions/components/transaction-export-menu';
import { TransactionFilters } from '@/features/transactions/components/transaction-filters';
import { TransactionFormDialog } from '@/features/transactions/components/transaction-form-dialog';
import { TransactionImportDialog } from '@/features/transactions/components/transaction-import-dialog';
import { TransactionList } from '@/features/transactions/components/transaction-list';
import {
	useDeleteTransactionMutation,
	useTransactionsQuery,
} from '@/features/transactions/hooks/use-transactions';
import type { Transaction } from '@/features/transactions/types';
import {
	draftToParams,
	filtersFromSearchParams,
	hasActiveFilters,
	writeFiltersToSearchParams,
	type TransactionFilterDraft,
} from '@/features/transactions/utils';
import { getErrorMessage } from '@/lib/api/errors';
import { DEFAULT_CURRENCY } from '@/lib/currencies';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

const PAGE_LIMIT = 10;

export function TransactionsPage() {
	const user = useAppSelector(selectUser);
	const preferredCurrency = user?.currency || DEFAULT_CURRENCY;
	const [searchParams, setSearchParams] = useSearchParams();
	const addRequested = searchParams.get('add') === '1';

	const [filters, setFilters] = useState<TransactionFilterDraft>(() =>
		filtersFromSearchParams(searchParams),
	);
	const [page, setPage] = useState(1);
	const [manualFormOpen, setManualFormOpen] = useState(false);
	const [editing, setEditing] = useState<Transaction | null>(null);
	const [deleting, setDeleting] = useState<Transaction | null>(null);
	const [exportSelection, setExportSelection] = useState<TransactionExportSelection | null>(
		null,
	);
	const [importOpen, setImportOpen] = useState(false);

	const formOpen = addRequested || manualFormOpen || editing != null;
	const exportOpen = exportSelection != null;

	const debouncedQ = useDebouncedValue(filters.q, 300);
	const queryFilters = useMemo(
		() => ({ ...filters, q: debouncedQ }),
		[filters, debouncedQ],
	);
	const listParams = useMemo(
		() => draftToParams(queryFilters, page, PAGE_LIMIT),
		[queryFilters, page],
	);

	const { data, isLoading, isError, refetch, isFetching } = useTransactionsQuery(listParams);
	const { data: categoriesData } = useCategoriesQuery();
	const deleteMutation = useDeleteTransactionMutation();

	const categoryLabels = useMemo(() => {
		const map = new Map<string, string>();
		for (const c of categoriesData?.categories ?? []) {
			map.set(c.id, c.name);
		}
		return map;
	}, [categoriesData?.categories]);

	const filtersActive = hasActiveFilters(filters);

	const clearAddParam = () => {
		if (!addRequested) return;
		const next = new URLSearchParams(searchParams);
		next.delete('add');
		setSearchParams(next, { replace: true });
	};

	const handleFormOpenChange = (open: boolean) => {
		if (open) {
			setManualFormOpen(true);
			return;
		}
		setManualFormOpen(false);
		setEditing(null);
		clearAddParam();
	};

	const handleFiltersChange = (next: TransactionFilterDraft) => {
		setFilters(next);
		setPage(1);
		setSearchParams(writeFiltersToSearchParams(searchParams, next), { replace: true });
	};

	const openCreate = () => {
		setEditing(null);
		setManualFormOpen(true);
	};

	const openEdit = (tx: Transaction) => {
		setEditing(tx);
		setManualFormOpen(true);
	};

	const handleDelete = async () => {
		if (!deleting) return;
		try {
			await deleteMutation.mutateAsync(deleting.id);
			toast.success('Transaction deleted');
			setDeleting(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not delete transaction.'));
		}
	};

	const items = data?.items ?? [];
	const totalPages = data?.totalPages ?? 1;
	const empty = !isLoading && !isError && items.length === 0;
	const filteredEmpty = empty && filtersActive;
	const pageNum = data?.page ?? page;
	const showChromeSkeleton = isLoading && !data;

	const deleteLabel =
		deleting?.description?.trim() ||
		(deleting ? categoryLabels.get(deleting.categoryId) ?? 'this transaction' : '');

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Transactions</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Review and manage your financial activity.
					</p>
				</div>
				{showChromeSkeleton ? (
					<div className="flex flex-wrap items-center gap-2">
						<Skeleton className="h-9 w-40 rounded-full" />
						<Skeleton className="h-9 w-24 rounded-full" />
						<Skeleton className="h-9 w-24 rounded-full" />
					</div>
				) : (
					<div className="flex flex-wrap items-center gap-2">
						<Button type="button" onClick={openCreate} data-testid="transaction-add">
							<Plus className="size-4" />
							New Transaction
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => setImportOpen(true)}
							data-testid="transaction-import"
						>
							<Upload className="size-4" />
							Import
						</Button>
						<TransactionExportMenu
							filtersActive={filtersActive}
							onSelect={setExportSelection}
						/>
					</div>
				)}
			</header>

			{showChromeSkeleton ? (
				<div className="flex flex-wrap gap-2" aria-hidden="true">
					<Skeleton className="h-9 w-28 rounded-full" />
					<Skeleton className="h-9 w-36 rounded-full" />
					<Skeleton className="h-9 w-32 rounded-full" />
					<Skeleton className="h-9 w-24 rounded-full" />
				</div>
			) : (
				<TransactionFilters value={filters} onChange={handleFiltersChange} />
			)}

			<div className="min-w-0 space-y-3">
				{isLoading ? (
					<div className="space-y-0 overflow-hidden rounded-xl border border-border">
						<Skeleton className="h-10 w-full rounded-none" />
						<Skeleton className="h-16 w-full rounded-none" />
						<Skeleton className="h-16 w-full rounded-none" />
						<Skeleton className="h-16 w-full rounded-none" />
					</div>
				) : null}

				{isError ? (
					<ErrorState
						title="Could not load transactions"
						description="Check your connection and try again."
						onRetry={() => void refetch()}
					/>
				) : null}

				{empty ? (
					<EmptyState
						title={filteredEmpty ? 'No matching transactions' : 'No transactions yet'}
						description={
							filteredEmpty
								? 'Try adjusting or clearing your filters.'
								: 'Add your first income or expense to start tracking.'
						}
						icon={Receipt}
						action={
							filteredEmpty ? undefined : (
								<Button type="button" onClick={openCreate}>
									<Plus className="size-4" />
									New Transaction
								</Button>
							)
						}
					/>
				) : null}

				{!isLoading && !isError && items.length > 0 ? (
					<>
						<TransactionList
							items={items}
							categoryLabels={categoryLabels}
							preferredCurrency={preferredCurrency}
							onEdit={openEdit}
							onDelete={setDeleting}
						/>

						<NumberedPagination
							page={pageNum}
							totalPages={totalPages}
							disabled={isFetching}
							onPageChange={setPage}
						/>
					</>
				) : null}
			</div>

			<TransactionFormDialog
				open={formOpen}
				onOpenChange={handleFormOpenChange}
				transaction={editing}
			/>

			<TransactionDeleteDialog
				open={deleting != null}
				onOpenChange={(open) => {
					if (!open) setDeleting(null);
				}}
				label={deleteLabel}
				pending={deleteMutation.isPending}
				onConfirm={() => void handleDelete()}
			/>

			<TransactionExportDialog
				open={exportOpen}
				onOpenChange={(open) => {
					if (!open) setExportSelection(null);
				}}
				selection={exportSelection}
				filters={filters}
				categoryLabels={categoryLabels}
			/>

			<TransactionImportDialog
				open={importOpen}
				onOpenChange={setImportOpen}
				categories={categoriesData?.categories ?? []}
				preferredCurrency={preferredCurrency}
			/>
		</div>
	);
}
