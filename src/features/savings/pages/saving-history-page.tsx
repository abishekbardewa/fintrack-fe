import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowLeftRight, History, MoreHorizontal, Plus, Trash2, TrendingUp } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useAppSelector } from '@/app/hooks';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { NumberedPagination } from '@/components/common/numbered-pagination';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { selectUser } from '@/features/auth/authSlice';
import { GoalMoneyBadge } from '@/features/goals/components/goal-money-badge';
import { SavingDeleteDialog } from '@/features/savings/components/saving-delete-dialog';
import { SavingEditTransactionDialog } from '@/features/savings/components/saving-edit-transaction-dialog';
import { SavingEntryDeleteDialog } from '@/features/savings/components/saving-entry-delete-dialog';
import { SavingHistoryList } from '@/features/savings/components/saving-history-list';
import { SavingMovementDialog } from '@/features/savings/components/saving-movement-dialog';
import {
	useAddSavingReturnMutation,
	useContributeToSavingMutation,
	useDeleteSavingMutation,
	useDeleteSavingTransactionMutation,
	useSavingQuery,
	useSavingsQuery,
	useSavingTransactionsQuery,
	useUpdateSavingTransactionMutation,
	useWithdrawFromSavingMutation,
} from '@/features/savings/hooks/use-savings';
import type { SavingTransaction, UpdateSavingTransactionRequest } from '@/features/savings/types';
import {
	displaySavingBalance,
	formatMoney,
	hasSavingBalance,
} from '@/features/savings/utils';
import { getErrorMessage } from '@/lib/api/errors';
import { DEFAULT_CURRENCY } from '@/lib/currencies';

const PAGE_LIMIT = 20;

export function SavingHistoryPage() {
	const user = useAppSelector(selectUser);
	const preferredCurrency = user?.currency || DEFAULT_CURRENCY;
	const navigate = useNavigate();
	const { savingId } = useParams<{ savingId: string }>();

	const [page, setPage] = useState(1);
	const [contributing, setContributing] = useState(false);
	const [withdrawing, setWithdrawing] = useState(false);
	const [addingReturn, setAddingReturn] = useState(false);
	const [editing, setEditing] = useState<SavingTransaction | null>(null);
	const [deleting, setDeleting] = useState<SavingTransaction | null>(null);
	const [deletingSaving, setDeletingSaving] = useState(false);

	const listParams = useMemo(() => ({ page, limit: PAGE_LIMIT }), [page]);
	const { data: savingData, isLoading: savingLoading, isError: savingError, refetch: refetchSaving } =
		useSavingQuery(savingId ?? null);
	const { data: savingsData } = useSavingsQuery();
	const { data, isLoading, isError, refetch, isFetching } = useSavingTransactionsQuery(
		savingId ?? null,
		listParams,
	);

	const contributeMutation = useContributeToSavingMutation();
	const withdrawMutation = useWithdrawFromSavingMutation();
	const returnMutation = useAddSavingReturnMutation();
	const updateMutation = useUpdateSavingTransactionMutation();
	const deleteMutation = useDeleteSavingTransactionMutation();
	const deleteSavingMutation = useDeleteSavingMutation();

	const saving = savingData?.saving ?? null;
	const available = savingsData?.money?.spendable ?? savingsData?.money?.available;
	const items = data?.items ?? [];
	const totalPages = data?.totalPages ?? 1;
	const pageNum = data?.page ?? page;
	const showChromeSkeleton = (savingLoading && !savingData) || (isLoading && !data);

	useEffect(() => {
		if (!data) return;
		if (data.totalPages >= 1 && page > data.totalPages) {
			setPage(data.totalPages);
		}
	}, [data, page]);

	const handleContribute = async (payload: {
		amount: number;
		currency?: string;
		date?: string;
		note?: string;
	}) => {
		if (!saving) return;
		try {
			await contributeMutation.mutateAsync({ savingId: saving.id, payload });
			toast.success('Money added');
			setContributing(false);
			setPage(1);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not add money.'));
		}
	};

	const openWithdraw = () => {
		if (!saving) return;
		if (!hasSavingBalance(saving)) {
			toast.error('Nothing to move. This savings has no balance.');
			return;
		}
		setWithdrawing(true);
	};

	const handleWithdraw = async (payload: {
		amount: number;
		currency?: string;
		date?: string;
		note?: string;
	}) => {
		if (!saving) return;
		try {
			await withdrawMutation.mutateAsync({ savingId: saving.id, payload });
			toast.success('Money moved');
			setWithdrawing(false);
			setPage(1);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not move money.'));
		}
	};

	const handleAddReturn = async (payload: {
		amount: number;
		currency?: string;
		date?: string;
		note?: string;
	}) => {
		if (!saving) return;
		try {
			await returnMutation.mutateAsync({ savingId: saving.id, payload });
			toast.success('Return added');
			setAddingReturn(false);
			setPage(1);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not add return.'));
		}
	};

	const handleEdit = async (payload: UpdateSavingTransactionRequest) => {
		if (!saving || !editing) return;
		try {
			await updateMutation.mutateAsync({
				savingId: saving.id,
				transactionId: editing.id,
				payload,
			});
			toast.success('Entry updated');
			setEditing(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not update.'));
		}
	};

	const handleDelete = async () => {
		if (!saving || !deleting) return;
		try {
			await deleteMutation.mutateAsync({
				savingId: saving.id,
				transactionId: deleting.id,
			});
			toast.success('Entry deleted');
			setDeleting(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not delete.'));
		}
	};

	const handleDeleteSaving = async () => {
		if (!saving) return;
		try {
			await deleteSavingMutation.mutateAsync(saving.id);
			toast.success('Savings deleted');
			setDeletingSaving(false);
			void navigate('/savings');
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not delete savings.'));
		}
	};

	if (savingError) {
		return (
			<div className="flex flex-col gap-6">
				<Link
					to="/savings"
					className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
				>
					<ArrowLeft className="size-4" />
					Savings
				</Link>
				<ErrorState
					title="Could not load savings"
					description="Check your connection and try again."
					onRetry={() => void refetchSaving()}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<Link
				to="/savings"
				className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Savings
			</Link>

			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					{showChromeSkeleton || !saving ? (
						<>
							<Skeleton className="h-8 w-48" />
							<Skeleton className="mt-2 h-4 w-36" />
						</>
					) : (
						<>
							<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{saving.name}</h1>
							{saving.notes ? (
								<p className="mt-1 text-sm text-muted-foreground">{saving.notes}</p>
							) : null}
						</>
					)}
				</div>
				{showChromeSkeleton ? (
					<div className="flex flex-wrap items-center gap-2">
						<Skeleton className="h-9 w-28 rounded-full" />
						<Skeleton className="h-9 w-36 rounded-full" />
					</div>
				) : (
					<div className="flex flex-wrap items-center gap-2">
						<Button
							type="button"
							onClick={() => setContributing(true)}
							data-testid="saving-history-add"
						>
							<Plus className="size-4" />
							Add Money
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={openWithdraw}
							data-testid="saving-history-withdraw"
						>
							<ArrowLeftRight className="size-4" />
							Move to Spendable
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									type="button"
									variant="outline"
									size="icon"
									aria-label="Savings actions"
									data-testid="saving-history-more"
								>
									<MoreHorizontal className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() => setAddingReturn(true)}
									data-testid="saving-history-return"
								>
									<TrendingUp />
									Add Return
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									variant="destructive"
									onClick={() => setDeletingSaving(true)}
									data-testid="saving-history-delete"
								>
									<Trash2 />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				)}
			</header>

			{showChromeSkeleton ? (
				<div className="flex flex-wrap gap-2" aria-hidden="true">
					<Skeleton className="h-8 w-40 rounded-full" />
					<Skeleton className="h-8 w-44 rounded-full" />
				</div>
			) : saving ? (
				<div className="flex flex-wrap gap-2" data-testid="saving-history-money">
					<GoalMoneyBadge
						label="Savings Balance"
						value={displaySavingBalance(saving, preferredCurrency)}
						tone="goal"
						amount={saving.currentAmountPreferred ?? saving.currentAmount}
					/>
					{typeof available === 'number' ? (
						<GoalMoneyBadge
							label="Spendable Money"
							value={formatMoney(available, preferredCurrency)}
							tone="available"
							amount={available}
						/>
					) : null}
				</div>
			) : null}

			{isLoading && !data ? (
				<div className="space-y-0 overflow-hidden rounded-xl border border-border">
					<Skeleton className="h-10 w-full rounded-none" />
					<Skeleton className="h-16 w-full rounded-none" />
					<Skeleton className="h-16 w-full rounded-none" />
					<Skeleton className="h-16 w-full rounded-none" />
				</div>
			) : null}

			{isError ? (
				<ErrorState
					title="Could not load history"
					description="Check your connection and try again."
					onRetry={() => void refetch()}
				/>
			) : null}

			{!isLoading && !isError && items.length === 0 ? (
				<EmptyState
					icon={History}
					title="No entries yet"
					description="Add money to get started."
					action={
						<Button type="button" onClick={() => setContributing(true)}>
							<Plus className="size-4" />
							Add Money
						</Button>
					}
				/>
			) : null}

			{!isError && items.length > 0 ? (
				<>
					<SavingHistoryList
						items={items}
						preferredCurrency={preferredCurrency}
						onEdit={setEditing}
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

			<SavingMovementDialog
				open={contributing}
				onOpenChange={setContributing}
				mode="contribute"
				saving={saving}
				preferredCurrency={preferredCurrency}
				maxAmount={available}
				pending={contributeMutation.isPending}
				onSubmit={handleContribute}
			/>

			<SavingMovementDialog
				open={withdrawing}
				onOpenChange={setWithdrawing}
				mode="withdraw"
				saving={saving}
				preferredCurrency={preferredCurrency}
				maxAmount={saving ? (saving.currentAmountPreferred ?? saving.currentAmount) : undefined}
				pending={withdrawMutation.isPending}
				onSubmit={handleWithdraw}
			/>

			<SavingMovementDialog
				open={addingReturn}
				onOpenChange={setAddingReturn}
				mode="return"
				saving={saving}
				preferredCurrency={preferredCurrency}
				pending={returnMutation.isPending}
				onSubmit={handleAddReturn}
			/>

			<SavingDeleteDialog
				open={deletingSaving}
				onOpenChange={setDeletingSaving}
				saving={saving}
				preferredCurrency={preferredCurrency}
				pending={deleteSavingMutation.isPending}
				onConfirm={() => void handleDeleteSaving()}
			/>

			<SavingEditTransactionDialog
				open={editing != null}
				onOpenChange={(next) => {
					if (!next) setEditing(null);
				}}
				transaction={editing}
				savingName={saving?.name ?? ''}
				preferredCurrency={preferredCurrency}
				maxSpendable={available}
				maxSavingBalance={
					saving ? (saving.currentAmountPreferred ?? saving.currentAmount) : undefined
				}
				pending={updateMutation.isPending}
				onSubmit={handleEdit}
			/>

			<SavingEntryDeleteDialog
				open={deleting != null}
				onOpenChange={(open) => {
					if (!open) setDeleting(null);
				}}
				item={deleting}
				savingName={saving?.name ?? ''}
				preferredCurrency={preferredCurrency}
				pending={deleteMutation.isPending}
				onConfirm={() => void handleDelete()}
			/>
		</div>
	);
}
