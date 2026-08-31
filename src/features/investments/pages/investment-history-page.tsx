import { useEffect, useMemo, useState } from 'react';
import {
	ArrowLeft,
	ArrowLeftRight,
	Ban,
	History,
	MoreHorizontal,
	Plus,
	Trash2,
	TrendingDown,
	TrendingUp,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useAppSelector } from '@/app/hooks';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { NumberedPagination } from '@/components/common/numbered-pagination';
import { Badge } from '@/components/ui/badge';
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
import { InvestmentCloseDialog } from '@/features/investments/components/investment-close-dialog';
import { InvestmentDeleteDialog } from '@/features/investments/components/investment-delete-dialog';
import { InvestmentEditTransactionDialog } from '@/features/investments/components/investment-edit-transaction-dialog';
import { InvestmentEntryDeleteDialog } from '@/features/investments/components/investment-entry-delete-dialog';
import { InvestmentHistoryList } from '@/features/investments/components/investment-history-list';
import { InvestmentMovementDialog } from '@/features/investments/components/investment-movement-dialog';
import {
	useAddInvestmentReturnMutation,
	useCloseInvestmentMutation,
	useContributeToInvestmentMutation,
	useDeleteInvestmentMutation,
	useDeleteInvestmentTransactionMutation,
	useInvestmentQuery,
	useInvestmentsQuery,
	useInvestmentTransactionsQuery,
	useRecordInvestmentLossMutation,
	useUpdateInvestmentTransactionMutation,
	useWithdrawFromInvestmentMutation,
} from '@/features/investments/hooks/use-investments';
import type {
	InvestmentTransaction,
	UpdateInvestmentTransactionRequest,
} from '@/features/investments/types';
import {
	displayInvestmentBalance,
	formatDisplayDate,
	formatMoney,
	hasInvestmentBalance,
	statusLabel,
} from '@/features/investments/utils';
import { getErrorMessage } from '@/lib/api/errors';
import { DEFAULT_CURRENCY } from '@/lib/currencies';
import { cn } from '@/lib/utils';

const PAGE_LIMIT = 20;

export function InvestmentHistoryPage() {
	const user = useAppSelector(selectUser);
	const preferredCurrency = user?.currency || DEFAULT_CURRENCY;
	const navigate = useNavigate();
	const { investmentId } = useParams<{ investmentId: string }>();

	const [page, setPage] = useState(1);
	const [contributing, setContributing] = useState(false);
	const [withdrawing, setWithdrawing] = useState(false);
	const [addingReturn, setAddingReturn] = useState(false);
	const [recordingLoss, setRecordingLoss] = useState(false);
	const [closing, setClosing] = useState(false);
	const [editing, setEditing] = useState<InvestmentTransaction | null>(null);
	const [deleting, setDeleting] = useState<InvestmentTransaction | null>(null);
	const [deletingInvestment, setDeletingInvestment] = useState(false);

	const listParams = useMemo(() => ({ page, limit: PAGE_LIMIT }), [page]);
	const {
		data: investmentData,
		isLoading: investmentLoading,
		isError: investmentError,
		refetch: refetchInvestment,
	} = useInvestmentQuery(investmentId ?? null);
	const { data: investmentsData } = useInvestmentsQuery();
	const { data, isLoading, isError, refetch, isFetching } = useInvestmentTransactionsQuery(
		investmentId ?? null,
		listParams,
	);

	const contributeMutation = useContributeToInvestmentMutation();
	const withdrawMutation = useWithdrawFromInvestmentMutation();
	const returnMutation = useAddInvestmentReturnMutation();
	const lossMutation = useRecordInvestmentLossMutation();
	const closeMutation = useCloseInvestmentMutation();
	const updateMutation = useUpdateInvestmentTransactionMutation();
	const deleteMutation = useDeleteInvestmentTransactionMutation();
	const deleteInvestmentMutation = useDeleteInvestmentMutation();

	const investment = investmentData?.investment ?? null;
	const available = investmentsData?.money?.spendable ?? investmentsData?.money?.available;
	const items = data?.items ?? [];
	const totalPages = data?.totalPages ?? 1;
	const pageNum = data?.page ?? page;
	const showChromeSkeleton = (investmentLoading && !investmentData) || (isLoading && !data);
	const isActive = investment?.status === 'active';

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
		if (!investment) return;
		try {
			await contributeMutation.mutateAsync({ investmentId: investment.id, payload });
			toast.success('Money added');
			setContributing(false);
			setPage(1);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not add money.'));
		}
	};

	const openWithdraw = () => {
		if (!investment) return;
		if (!hasInvestmentBalance(investment)) {
			toast.error('Nothing to move. This investment has no balance.');
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
		if (!investment) return;
		try {
			await withdrawMutation.mutateAsync({ investmentId: investment.id, payload });
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
		if (!investment) return;
		try {
			await returnMutation.mutateAsync({ investmentId: investment.id, payload });
			toast.success('Return added');
			setAddingReturn(false);
			setPage(1);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not add return.'));
		}
	};

	const openLoss = () => {
		if (!investment) return;
		if (!hasInvestmentBalance(investment)) {
			toast.error('Nothing to record. This investment has no balance.');
			return;
		}
		setRecordingLoss(true);
	};

	const handleLoss = async (payload: {
		amount: number;
		currency?: string;
		date?: string;
		note?: string;
	}) => {
		if (!investment) return;
		try {
			await lossMutation.mutateAsync({ investmentId: investment.id, payload });
			toast.success('Loss recorded');
			setRecordingLoss(false);
			setPage(1);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not record loss.'));
		}
	};

	const handleClose = async () => {
		if (!investment) return;
		try {
			await closeMutation.mutateAsync({ investmentId: investment.id, payload: {} });
			toast.success('Investment closed');
			setClosing(false);
			setPage(1);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not close investment.'));
		}
	};

	const handleEdit = async (payload: UpdateInvestmentTransactionRequest) => {
		if (!investment || !editing) return;
		try {
			await updateMutation.mutateAsync({
				investmentId: investment.id,
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
		if (!investment || !deleting) return;
		try {
			await deleteMutation.mutateAsync({
				investmentId: investment.id,
				transactionId: deleting.id,
			});
			toast.success('Entry deleted');
			setDeleting(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not delete.'));
		}
	};

	const handleDeleteInvestment = async () => {
		if (!investment) return;
		try {
			await deleteInvestmentMutation.mutateAsync(investment.id);
			toast.success('Investment deleted');
			setDeletingInvestment(false);
			void navigate('/investments');
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not delete investment.'));
		}
	};

	if (investmentError) {
		return (
			<div className="flex flex-col gap-6">
				<Link
					to="/investments"
					className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
				>
					<ArrowLeft className="size-4" />
					Investments
				</Link>
				<ErrorState
					title="Could not load investment"
					description="Check your connection and try again."
					onRetry={() => void refetchInvestment()}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<Link
				to="/investments"
				className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Investments
			</Link>

			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					{showChromeSkeleton || !investment ? (
						<>
							<Skeleton className="h-8 w-48" />
							<Skeleton className="mt-2 h-4 w-36" />
						</>
					) : (
						<>
							<div className="flex flex-wrap items-center gap-2">
								<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
									{investment.name}
								</h1>
								<Badge
									variant="outline"
									className={cn(
										'font-medium',
										investment.status === 'active'
											? 'border-primary/30 bg-primary/10 text-primary'
											: 'border-border bg-background text-muted-foreground',
									)}
								>
									{statusLabel(investment.status)}
								</Badge>
							</div>
							<p className="mt-1 text-sm text-muted-foreground">
								{investment.startDate
									? `Started ${formatDisplayDate(investment.startDate)}`
									: null}
								{investment.startDate && investment.notes ? ' · ' : null}
								{investment.notes}
							</p>
						</>
					)}
				</div>
				{showChromeSkeleton ? (
					<div className="flex flex-wrap items-center gap-2">
						<Skeleton className="h-9 w-28 rounded-full" />
						<Skeleton className="h-9 w-36 rounded-full" />
					</div>
				) : isActive ? (
					<div className="flex flex-wrap items-center gap-2">
						<Button
							type="button"
							onClick={() => setContributing(true)}
							data-testid="investment-history-add"
						>
							<Plus className="size-4" />
							Add Money
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={openWithdraw}
							data-testid="investment-history-withdraw"
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
									aria-label="Investment actions"
									data-testid="investment-history-more"
								>
									<MoreHorizontal className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() => setAddingReturn(true)}
									data-testid="investment-history-return"
								>
									<TrendingUp />
									Add Return
								</DropdownMenuItem>
								<DropdownMenuItem onClick={openLoss} data-testid="investment-history-loss">
									<TrendingDown />
									Record Loss
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => setClosing(true)}
									data-testid="investment-history-close"
								>
									<Ban />
									Close Investment
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									variant="destructive"
									onClick={() => setDeletingInvestment(true)}
									data-testid="investment-history-delete"
								>
									<Trash2 />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				) : investment ? (
					<Button
						type="button"
						variant="outline"
						onClick={() => setDeletingInvestment(true)}
						data-testid="investment-history-delete"
					>
						<Trash2 className="size-4" />
						Delete
					</Button>
				) : null}
			</header>

			{showChromeSkeleton ? (
				<div className="flex flex-wrap gap-2" aria-hidden="true">
					<Skeleton className="h-8 w-40 rounded-full" />
					<Skeleton className="h-8 w-44 rounded-full" />
				</div>
			) : investment ? (
				<div className="flex flex-wrap gap-2" data-testid="investment-history-money">
					{isActive ? (
						<GoalMoneyBadge
							label="Investment Balance"
							value={displayInvestmentBalance(investment, preferredCurrency)}
							tone="goal"
							amount={investment.currentBalancePreferred ?? investment.currentBalance}
						/>
					) : (
						<GoalMoneyBadge
							label="Moved to Spendable"
							value={formatMoney(investment.closedAmount ?? 0, investment.currency)}
							tone="available"
							amount={investment.closedAmount ?? 0}
						/>
					)}
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
					description={isActive ? 'Add money to get started.' : undefined}
					action={
						isActive ? (
							<Button type="button" onClick={() => setContributing(true)}>
								<Plus className="size-4" />
								Add Money
							</Button>
						) : undefined
					}
				/>
			) : null}

			{!isError && items.length > 0 ? (
				<>
					<InvestmentHistoryList
						items={items}
						preferredCurrency={preferredCurrency}
						canEdit={Boolean(isActive)}
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

			<InvestmentMovementDialog
				open={contributing}
				onOpenChange={setContributing}
				mode="contribute"
				investment={investment}
				preferredCurrency={preferredCurrency}
				maxAmount={available}
				pending={contributeMutation.isPending}
				onSubmit={handleContribute}
			/>

			<InvestmentMovementDialog
				open={withdrawing}
				onOpenChange={setWithdrawing}
				mode="withdraw"
				investment={investment}
				preferredCurrency={preferredCurrency}
				maxAmount={
					investment ? (investment.currentBalancePreferred ?? investment.currentBalance) : undefined
				}
				pending={withdrawMutation.isPending}
				onSubmit={handleWithdraw}
			/>

			<InvestmentMovementDialog
				open={addingReturn}
				onOpenChange={setAddingReturn}
				mode="return"
				investment={investment}
				preferredCurrency={preferredCurrency}
				pending={returnMutation.isPending}
				onSubmit={handleAddReturn}
			/>

			<InvestmentMovementDialog
				open={recordingLoss}
				onOpenChange={setRecordingLoss}
				mode="loss"
				investment={investment}
				preferredCurrency={preferredCurrency}
				maxAmount={
					investment ? (investment.currentBalancePreferred ?? investment.currentBalance) : undefined
				}
				pending={lossMutation.isPending}
				onSubmit={handleLoss}
			/>

			<InvestmentCloseDialog
				open={closing}
				onOpenChange={setClosing}
				investment={investment}
				preferredCurrency={preferredCurrency}
				pending={closeMutation.isPending}
				onConfirm={() => void handleClose()}
			/>

			<InvestmentDeleteDialog
				open={deletingInvestment}
				onOpenChange={setDeletingInvestment}
				investment={investment}
				preferredCurrency={preferredCurrency}
				pending={deleteInvestmentMutation.isPending}
				onConfirm={() => void handleDeleteInvestment()}
			/>

			<InvestmentEditTransactionDialog
				open={editing != null}
				onOpenChange={(next) => {
					if (!next) setEditing(null);
				}}
				transaction={editing}
				investmentName={investment?.name ?? ''}
				preferredCurrency={preferredCurrency}
				maxSpendable={available}
				maxInvestmentBalance={
					investment ? (investment.currentBalancePreferred ?? investment.currentBalance) : undefined
				}
				pending={updateMutation.isPending}
				onSubmit={handleEdit}
			/>

			<InvestmentEntryDeleteDialog
				open={deleting != null}
				onOpenChange={(open) => {
					if (!open) setDeleting(null);
				}}
				item={deleting}
				investmentName={investment?.name ?? ''}
				preferredCurrency={preferredCurrency}
				pending={deleteMutation.isPending}
				onConfirm={() => void handleDelete()}
			/>
		</div>
	);
}
