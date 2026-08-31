import { useEffect, useMemo, useState } from 'react';
import {
	ArrowLeft,
	ArrowLeftRight,
	CheckCircle2,
	History,
	MoreHorizontal,
	Pencil,
	Plus,
	Trash2,
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
import { SavingsCircleCompleteDialog } from '@/features/savings-circles/components/savings-circle-complete-dialog';
import { SavingsCircleDeleteDialog } from '@/features/savings-circles/components/savings-circle-delete-dialog';
import { SavingsCircleEditTransactionDialog } from '@/features/savings-circles/components/savings-circle-edit-transaction-dialog';
import { SavingsCircleEntryDeleteDialog } from '@/features/savings-circles/components/savings-circle-entry-delete-dialog';
import { SavingsCircleFormDialog } from '@/features/savings-circles/components/savings-circle-form-dialog';
import { SavingsCircleHistoryList } from '@/features/savings-circles/components/savings-circle-history-list';
import { SavingsCircleMovementDialog } from '@/features/savings-circles/components/savings-circle-movement-dialog';
import {
	useCompleteSavingsCircleMutation,
	useContributeToSavingsCircleMutation,
	useDeleteSavingsCircleMutation,
	useDeleteSavingsCircleTransactionMutation,
	useMoveSavingsCirclePayoutMutation,
	useRecordSavingsCirclePayoutMutation,
	useSavingsCircleQuery,
	useSavingsCirclesQuery,
	useSavingsCircleTransactionsQuery,
	useUpdateSavingsCircleMutation,
	useUpdateSavingsCircleTransactionMutation,
} from '@/features/savings-circles/hooks/use-savings-circles';
import type {
	CreateSavingsCircleRequest,
	SavingsCircleTransaction,
	UpdateSavingsCircleRequest,
	UpdateSavingsCircleTransactionRequest,
} from '@/features/savings-circles/types';
import {
	displayPendingPayout,
	formatMoney,
	hasPendingPayout,
	pendingPayoutAmount,
	statusLabel,
} from '@/features/savings-circles/utils';
import { getErrorMessage } from '@/lib/api/errors';
import { DEFAULT_CURRENCY } from '@/lib/currencies';
import { cn } from '@/lib/utils';

const PAGE_LIMIT = 20;

export function SavingsCircleHistoryPage() {
	const user = useAppSelector(selectUser);
	const preferredCurrency = user?.currency || DEFAULT_CURRENCY;
	const navigate = useNavigate();
	const { circleId } = useParams<{ circleId: string }>();

	const [page, setPage] = useState(1);
	const [contributing, setContributing] = useState(false);
	const [recordingPayout, setRecordingPayout] = useState(false);
	const [movingPayout, setMovingPayout] = useState(false);
	const [completing, setCompleting] = useState(false);
	const [editingCircle, setEditingCircle] = useState(false);
	const [editing, setEditing] = useState<SavingsCircleTransaction | null>(null);
	const [deleting, setDeleting] = useState<SavingsCircleTransaction | null>(null);
	const [deletingCircle, setDeletingCircle] = useState(false);

	const listParams = useMemo(() => ({ page, limit: PAGE_LIMIT }), [page]);
	const {
		data: circleData,
		isLoading: circleLoading,
		isError: circleError,
		refetch: refetchCircle,
	} = useSavingsCircleQuery(circleId ?? null);
	const { data: circlesData } = useSavingsCirclesQuery();
	const { data, isLoading, isError, refetch, isFetching } = useSavingsCircleTransactionsQuery(
		circleId ?? null,
		listParams,
	);

	const contributeMutation = useContributeToSavingsCircleMutation();
	const payoutMutation = useRecordSavingsCirclePayoutMutation();
	const movePayoutMutation = useMoveSavingsCirclePayoutMutation();
	const completeMutation = useCompleteSavingsCircleMutation();
	const updateCircleMutation = useUpdateSavingsCircleMutation();
	const updateMutation = useUpdateSavingsCircleTransactionMutation();
	const deleteMutation = useDeleteSavingsCircleTransactionMutation();
	const deleteCircleMutation = useDeleteSavingsCircleMutation();

	const circle = circleData?.circle ?? null;
	const completed = circle?.status === 'completed';
	const available = circlesData?.money?.spendable ?? circlesData?.money?.available;
	const items = data?.items ?? [];
	const totalPages = data?.totalPages ?? 1;
	const pageNum = data?.page ?? page;
	const showChromeSkeleton = (circleLoading && !circleData) || (isLoading && !data);

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
		if (!circle) return;
		try {
			await contributeMutation.mutateAsync({ circleId: circle.id, payload });
			toast.success('Contribution recorded');
			setContributing(false);
			setPage(1);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not add contribution.'));
		}
	};

	const handleRecordPayout = async (payload: {
		amount: number;
		currency?: string;
		date?: string;
		note?: string;
	}) => {
		if (!circle) return;
		try {
			await payoutMutation.mutateAsync({ circleId: circle.id, payload });
			toast.success('Payout recorded');
			setRecordingPayout(false);
			setPage(1);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not record payout.'));
		}
	};

	const handleMovePayout = async (payload: {
		amount: number;
		currency?: string;
		date?: string;
		note?: string;
	}) => {
		if (!circle) return;
		try {
			await movePayoutMutation.mutateAsync({ circleId: circle.id, payload });
			toast.success('Payout moved to Spendable');
			setMovingPayout(false);
			setPage(1);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not move payout.'));
		}
	};

	const handleComplete = async () => {
		if (!circle) return;
		try {
			await completeMutation.mutateAsync(circle.id);
			toast.success('Circle completed');
			setCompleting(false);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not complete circle.'));
		}
	};

	const handleEditCircle = async (
		payload: CreateSavingsCircleRequest | UpdateSavingsCircleRequest,
	) => {
		if (!circle) return;
		try {
			await updateCircleMutation.mutateAsync({ id: circle.id, payload });
			toast.success('Circle updated');
			setEditingCircle(false);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not save.'));
		}
	};

	const handleEdit = async (payload: UpdateSavingsCircleTransactionRequest) => {
		if (!circle || !editing) return;
		try {
			await updateMutation.mutateAsync({
				circleId: circle.id,
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
		if (!circle || !deleting) return;
		try {
			await deleteMutation.mutateAsync({
				circleId: circle.id,
				transactionId: deleting.id,
			});
			toast.success('Entry deleted');
			setDeleting(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not delete.'));
		}
	};

	const handleDeleteCircle = async () => {
		if (!circle) return;
		try {
			await deleteCircleMutation.mutateAsync(circle.id);
			toast.success('Circle deleted');
			setDeletingCircle(false);
			void navigate('/circles');
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not delete circle.'));
		}
	};

	if (circleError) {
		return (
			<div className="flex flex-col gap-6">
				<Link
					to="/circles"
					className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
				>
					<ArrowLeft className="size-4" />
					Circles
				</Link>
				<ErrorState
					title="Could not load circle"
					description="Check your connection and try again."
					onRetry={() => void refetchCircle()}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<Link
				to="/circles"
				className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Circles
			</Link>

			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					{showChromeSkeleton || !circle ? (
						<>
							<Skeleton className="h-8 w-48" />
							<Skeleton className="mt-2 h-4 w-36" />
						</>
					) : (
						<>
							<div className="flex flex-wrap items-center gap-2">
								<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{circle.name}</h1>
								<Badge
									variant="outline"
									className={cn(
										'font-medium',
										circle.status === 'active'
											? 'border-primary/30 bg-primary/10 text-primary'
											: 'border-border bg-background text-muted-foreground',
									)}
								>
									{statusLabel(circle.status)}
								</Badge>
							</div>
							{circle.notes ? (
								<p className="mt-1 text-sm text-muted-foreground">{circle.notes}</p>
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
						{completed ? null : (
							<>
								<Button
									type="button"
									onClick={() => setContributing(true)}
									data-testid="circle-history-add"
								>
									<Plus className="size-4" />
									Add Contribution
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => setRecordingPayout(true)}
									data-testid="circle-history-payout"
								>
									<TrendingUp className="size-4" />
									Record Payout
								</Button>
							</>
						)}
						{circle && hasPendingPayout(circle) ? (
							<Button
								type="button"
								variant="outline"
								onClick={() => setMovingPayout(true)}
								data-testid="circle-history-move-payout"
							>
								<ArrowLeftRight className="size-4" />
								Move to Spendable
							</Button>
						) : null}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									type="button"
									variant="outline"
									size="icon"
									aria-label="Circle actions"
									data-testid="circle-history-more"
								>
									<MoreHorizontal className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{completed ? null : (
									<>
										<DropdownMenuItem onClick={() => setEditingCircle(true)}>
											<Pencil />
											Edit
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => setCompleting(true)}>
											<CheckCircle2 />
											Complete Circle
										</DropdownMenuItem>
										<DropdownMenuSeparator />
									</>
								)}
								<DropdownMenuItem
									variant="destructive"
									onClick={() => setDeletingCircle(true)}
									data-testid="circle-history-delete"
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
			) : circle ? (
				<div className="flex flex-col gap-3">
					{completed && hasPendingPayout(circle) ? (
						<div className="rounded-2xl bg-primary/10 px-4 py-3 ring-1 ring-primary/20">
							<p className="text-xs font-semibold tracking-wide text-primary uppercase">
								Payout pending
							</p>
							<p className="mt-1 text-sm text-foreground">
								<span className="font-semibold tabular-nums">
									{displayPendingPayout(circle, preferredCurrency)}
								</span>{' '}
								is ready to be moved to Spendable.
							</p>
							<Button
								type="button"
								size="sm"
								className="mt-3"
								onClick={() => setMovingPayout(true)}
							>
								<ArrowLeftRight className="size-3.5" />
								Move to Spendable
							</Button>
						</div>
					) : null}
					<div className="flex flex-wrap gap-2" data-testid="circle-history-money">
						<GoalMoneyBadge
							label="Pending Payout"
							value={displayPendingPayout(circle, preferredCurrency)}
							tone="goal"
							amount={pendingPayoutAmount(circle)}
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
					description="Add a contribution to get started."
					action={
						completed ? undefined : (
							<Button type="button" onClick={() => setContributing(true)}>
								<Plus className="size-4" />
								Add Contribution
							</Button>
						)
					}
				/>
			) : null}

			{!isError && items.length > 0 ? (
				<>
					<SavingsCircleHistoryList
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

			<SavingsCircleMovementDialog
				open={contributing}
				onOpenChange={setContributing}
				mode="contribute"
				circle={circle}
				preferredCurrency={preferredCurrency}
				maxAmount={available}
				pending={contributeMutation.isPending}
				onSubmit={handleContribute}
			/>

			<SavingsCircleMovementDialog
				open={recordingPayout}
				onOpenChange={setRecordingPayout}
				mode="recordPayout"
				circle={circle}
				preferredCurrency={preferredCurrency}
				pending={payoutMutation.isPending}
				onSubmit={handleRecordPayout}
			/>

			<SavingsCircleMovementDialog
				open={movingPayout}
				onOpenChange={setMovingPayout}
				mode="movePayout"
				circle={circle}
				preferredCurrency={preferredCurrency}
				maxAmount={circle ? pendingPayoutAmount(circle) : undefined}
				pending={movePayoutMutation.isPending}
				onSubmit={handleMovePayout}
			/>

			<SavingsCircleCompleteDialog
				open={completing}
				onOpenChange={setCompleting}
				circle={circle}
				preferredCurrency={preferredCurrency}
				pending={completeMutation.isPending}
				onConfirm={() => void handleComplete()}
			/>

			<SavingsCircleFormDialog
				open={editingCircle}
				onOpenChange={setEditingCircle}
				circle={circle}
				pending={updateCircleMutation.isPending}
				onSubmit={handleEditCircle}
			/>

			<SavingsCircleDeleteDialog
				open={deletingCircle}
				onOpenChange={setDeletingCircle}
				circle={circle}
				preferredCurrency={preferredCurrency}
				pending={deleteCircleMutation.isPending}
				onConfirm={() => void handleDeleteCircle()}
			/>

			<SavingsCircleEditTransactionDialog
				open={editing != null}
				onOpenChange={(next) => {
					if (!next) setEditing(null);
				}}
				transaction={editing}
				circleName={circle?.name ?? ''}
				preferredCurrency={preferredCurrency}
				maxSpendable={available}
				maxPendingPayout={circle ? pendingPayoutAmount(circle) : undefined}
				pending={updateMutation.isPending}
				onSubmit={handleEdit}
			/>

			<SavingsCircleEntryDeleteDialog
				open={deleting != null}
				onOpenChange={(open) => {
					if (!open) setDeleting(null);
				}}
				item={deleting}
				circleName={circle?.name ?? ''}
				preferredCurrency={preferredCurrency}
				pending={deleteMutation.isPending}
				onConfirm={() => void handleDelete()}
			/>
		</div>
	);
}
