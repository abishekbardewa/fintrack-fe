import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowLeftRight, Ban, History, MoreHorizontal, Plus, RotateCcw, Target, Wallet } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
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
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { selectUser } from '@/features/auth/authSlice';
import { useCategoriesQuery } from '@/features/categories/hooks/use-categories';
import { GoalCancelDialog } from '@/features/goals/components/goal-cancel-dialog';
import { GoalContributeDialog } from '@/features/goals/components/goal-contribute-dialog';
import { GoalEditContributionDialog } from '@/features/goals/components/goal-edit-contribution-dialog';
import { GoalEntryDeleteDialog } from '@/features/goals/components/goal-entry-delete-dialog';
import { GoalHistoryList } from '@/features/goals/components/goal-history-list';
import { GoalIncreaseTargetDialog } from '@/features/goals/components/goal-increase-target-dialog';
import { GoalMoneyBadge } from '@/features/goals/components/goal-money-badge';
import { GoalReturnDialog } from '@/features/goals/components/goal-return-dialog';
import { GoalSpendDialog } from '@/features/goals/components/goal-spend-dialog';
import {
	useAddContributionMutation,
	useContributionsQuery,
	useDeleteContributionMutation,
	useGoalQuery,
	useGoalsQuery,
	useReturnToAvailableMutation,
	useSpendFromGoalMutation,
	useUpdateContributionMutation,
	useUpdateGoalMutation,
} from '@/features/goals/hooks/use-goals';
import type { GoalContribution, UpdateContributionRequest } from '@/features/goals/types';
import {
	displayCurrent,
	displayTarget,
	formatMoney,
	hasMovableBalance,
	statusLabel,
} from '@/features/goals/utils';
import { getErrorMessage } from '@/lib/api/errors';
import { DEFAULT_CURRENCY } from '@/lib/currencies';
import { cn } from '@/lib/utils';

const PAGE_LIMIT = 20;

export function GoalHistoryPage() {
	const user = useAppSelector(selectUser);
	const preferredCurrency = user?.currency || DEFAULT_CURRENCY;
	const { goalId } = useParams<{ goalId: string }>();
	const [searchParams] = useSearchParams();
	const transactionId = searchParams.get('transaction');

	const [page, setPage] = useState(1);
	const [contributing, setContributing] = useState(false);
	const [spending, setSpending] = useState(false);
	const [returning, setReturning] = useState(false);
	const [cancelling, setCancelling] = useState(false);
	const [increasingTarget, setIncreasingTarget] = useState(false);
	const [editing, setEditing] = useState<GoalContribution | null>(null);
	const [deleting, setDeleting] = useState<GoalContribution | null>(null);
	const openedFromQuery = useRef<string | null>(null);

	const listParams = useMemo(() => ({ page, limit: PAGE_LIMIT }), [page]);
	const { data: goalData, isLoading: goalLoading, isError: goalError, refetch: refetchGoal } =
		useGoalQuery(goalId ?? null);
	const { data: goalsData } = useGoalsQuery();
	const { data, isLoading, isError, refetch, isFetching } = useContributionsQuery(
		goalId ?? null,
		listParams,
	);
	const { data: categoriesData } = useCategoriesQuery();

	const contributeMutation = useAddContributionMutation();
	const spendMutation = useSpendFromGoalMutation();
	const returnMutation = useReturnToAvailableMutation();
	const updateMutation = useUpdateContributionMutation();
	const updateGoalMutation = useUpdateGoalMutation();
	const deleteMutation = useDeleteContributionMutation();

	const goal = goalData?.goal ?? null;
	const available = goalsData?.money?.spendable ?? goalsData?.money?.available;
	const items = data?.items ?? [];
	const totalPages = data?.totalPages ?? 1;
	const pageNum = data?.page ?? page;
	const showChromeSkeleton = (goalLoading && !goalData) || (isLoading && !data);
	const isActive = goal?.status === 'active';
	const isCompleted = goal?.status === 'completed';
	const isCancelled = goal?.status === 'cancelled';
	const canMoveMoney = isActive || isCompleted;

	const categoryLabels = useMemo(() => {
		const map = new Map<string, string>();
		for (const c of categoriesData?.categories ?? []) {
			map.set(c.id, c.name);
		}
		return map;
	}, [categoriesData?.categories]);

	const highlighted = useMemo(() => {
		if (!transactionId) return null;
		return items.find((item) => item.transactionId === transactionId) ?? null;
	}, [items, transactionId]);

	useEffect(() => {
		if (!highlighted || openedFromQuery.current === highlighted.id) return;
		openedFromQuery.current = highlighted.id;
		setEditing(highlighted);
		const row = document.querySelector(`[data-testid="contribution-row-${highlighted.id}"]`);
		row?.scrollIntoView({ block: 'center' });
	}, [highlighted]);

	useEffect(() => {
		if (!data) return;
		if (data.totalPages >= 1 && page > data.totalPages) {
			setPage(data.totalPages);
		}
	}, [data, page]);

	const handleContribute = async (payload: { amount: number; note?: string }) => {
		if (!goal) return;
		try {
			await contributeMutation.mutateAsync({ goalId: goal.id, payload });
			toast.success('Money added');
			setContributing(false);
			setPage(1);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not add money.'));
		}
	};

	const handleSpend = async (payload: {
		amount: number;
		currency: string;
		categoryId: string;
		subcategoryId?: string;
		description?: string;
		date: string;
	}) => {
		if (!goal) return;
		try {
			await spendMutation.mutateAsync({ goalId: goal.id, payload });
			toast.success('Expense saved');
			setSpending(false);
			setPage(1);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not save expense.'));
		}
	};

	const openReturn = () => {
		if (!goal) return;
		if (!hasMovableBalance(goal)) {
			toast.error('Nothing to move. This goal has no balance.');
			return;
		}
		setReturning(true);
	};

	const handleReturn = async (payload: { amount?: number }) => {
		if (!goal) return;
		try {
			await returnMutation.mutateAsync({ goalId: goal.id, payload });
			toast.success('Money moved');
			setReturning(false);
			setPage(1);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not move money.'));
		}
	};

	const handleCancelGoal = async () => {
		if (!goal) return;
		try {
			await returnMutation.mutateAsync({
				goalId: goal.id,
				payload: { cancel: true },
			});
			toast.success('Goal cancelled');
			setCancelling(false);
			setPage(1);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not cancel goal.'));
		}
	};

	const handleReactivate = async () => {
		if (!goal) return;
		try {
			await updateGoalMutation.mutateAsync({
				id: goal.id,
				payload: { status: 'active' },
			});
			toast.success('Goal reactivated');
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not reactivate goal.'));
		}
	};

	const handleIncreaseTarget = async (targetAmount: number) => {
		if (!goal) return;
		try {
			await updateGoalMutation.mutateAsync({
				id: goal.id,
				payload: { targetAmount },
			});
			toast.success('Target increased');
			setIncreasingTarget(false);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not increase target.'));
		}
	};

	const handleEdit = async (payload: UpdateContributionRequest) => {
		if (!goal || !editing) return;
		try {
			await updateMutation.mutateAsync({
				goalId: goal.id,
				contributionId: editing.id,
				payload,
			});
			toast.success('Entry updated');
			setEditing(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not update.'));
		}
	};

	const handleDelete = async () => {
		if (!goal || !deleting) return;
		try {
			await deleteMutation.mutateAsync({
				goalId: goal.id,
				contributionId: deleting.id,
			});
			toast.success('Entry deleted');
			setDeleting(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not delete.'));
		}
	};

	const deleteCategoryName = deleting?.categoryId
		? categoryLabels.get(deleting.categoryId)
		: undefined;
	const deleteSubcategoryName = deleting?.subcategoryId
		? categoryLabels.get(deleting.subcategoryId)
		: undefined;

	if (goalError) {
		return (
			<div className="flex flex-col gap-6">
				<Link
					to="/goals"
					className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
				>
					<ArrowLeft className="size-4" />
					Goals
				</Link>
				<ErrorState
					title="Could not load goal"
					description="Check your connection and try again."
					onRetry={() => void refetchGoal()}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<Link
				to="/goals"
				className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Goals
			</Link>

			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					{showChromeSkeleton || !goal ? (
						<>
							<Skeleton className="h-8 w-48" />
							<Skeleton className="mt-2 h-4 w-36" />
						</>
					) : (
						<>
							<div className="flex flex-wrap items-center gap-2">
								<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
									{goal.name}
								</h1>
								<Badge
									variant="outline"
									className={cn(
										'font-medium',
										goal.status === 'active' &&
											'border-primary/30 bg-primary/10 text-primary',
										goal.status === 'completed' &&
											'border-income/30 bg-income/10 text-income',
										goal.status === 'cancelled' &&
											'border-border bg-background text-muted-foreground',
									)}
								>
									{statusLabel(goal.status)}
								</Badge>
							</div>
						</>
					)}
				</div>
				{showChromeSkeleton ? (
					<div className="flex flex-wrap items-center gap-2">
						<Skeleton className="h-9 w-28 rounded-full" />
						<Skeleton className="h-9 w-36 rounded-full" />
					</div>
				) : isCancelled ? (
					<Button
						type="button"
						onClick={() => void handleReactivate()}
						disabled={updateGoalMutation.isPending}
						data-testid="goal-history-reactivate"
					>
						<RotateCcw className="size-4" />
						Reactivate
					</Button>
				) : canMoveMoney ? (
					<div className="flex flex-wrap items-center gap-2">
						{isActive ? (
							<Button
								type="button"
								onClick={() => setContributing(true)}
								data-testid="goal-history-add"
							>
								<Plus className="size-4" />
								Add Money
							</Button>
						) : null}
						{isCompleted ? (
							<Button
								type="button"
								onClick={() => setIncreasingTarget(true)}
								data-testid="goal-history-increase-target"
							>
								<Target className="size-4" />
								Increase Target
							</Button>
						) : null}
						<Button
							type="button"
							variant="outline"
							onClick={() => setSpending(true)}
							data-testid="goal-history-spend"
						>
							<Wallet className="size-4" />
							Spend from Goal
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									type="button"
									variant="outline"
									size="icon"
									aria-label="Goal actions"
									data-testid="goal-history-more"
								>
									<MoreHorizontal className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={openReturn}
									data-testid="goal-history-return"
								>
									<ArrowLeftRight />
									Move to Spendable
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => setCancelling(true)}
									data-testid="goal-history-cancel"
								>
									<Ban className="text-destructive" />
									Cancel Goal
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				) : null}
			</header>

			{isCompleted && !showChromeSkeleton && goal ? (
				<div
					className="rounded-2xl bg-income/10 px-4 py-3"
					data-testid="goal-history-reached"
				>
					<p className="text-sm font-semibold text-foreground">Goal reached!</p>
					<p className="text-sm text-muted-foreground">
						You’ve reached your {displayTarget(goal, preferredCurrency)} target.
					</p>
				</div>
			) : null}

			{showChromeSkeleton ? (
				<div className="flex flex-wrap gap-2" aria-hidden="true">
					<Skeleton className="h-8 w-40 rounded-full" />
					<Skeleton className="h-8 w-32 rounded-full" />
					<Skeleton className="h-8 w-44 rounded-full" />
				</div>
			) : goal ? (
				<div className="flex flex-wrap gap-2" data-testid="goal-history-money">
					<GoalMoneyBadge
						label="Goal Balance"
						value={displayCurrent(goal, preferredCurrency)}
						tone="goal"
						amount={goal.currentAmountPreferred ?? goal.currentAmount}
					/>
					<GoalMoneyBadge
						label="Target"
						value={displayTarget(goal, preferredCurrency)}
						tone="target"
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
					<GoalHistoryList
						items={items}
						categoryLabels={categoryLabels}
						preferredCurrency={preferredCurrency}
						highlightedId={highlighted?.id}
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

			<GoalContributeDialog
				open={contributing}
				onOpenChange={setContributing}
				goal={goal}
				maxAmount={available}
				pending={contributeMutation.isPending}
				onSubmit={handleContribute}
			/>

			<GoalSpendDialog
				open={spending}
				onOpenChange={setSpending}
				goal={goal}
				preferredCurrency={preferredCurrency}
				pending={spendMutation.isPending}
				onSubmit={handleSpend}
			/>

			<GoalReturnDialog
				open={returning}
				onOpenChange={setReturning}
				goal={goal}
				preferredCurrency={preferredCurrency}
				pending={returnMutation.isPending && !cancelling}
				onSubmit={handleReturn}
			/>

			<GoalCancelDialog
				open={cancelling}
				onOpenChange={setCancelling}
				goal={goal}
				preferredCurrency={preferredCurrency}
				pending={returnMutation.isPending && cancelling}
				onConfirm={() => void handleCancelGoal()}
			/>

			<GoalIncreaseTargetDialog
				open={increasingTarget}
				onOpenChange={setIncreasingTarget}
				goal={goal}
				preferredCurrency={preferredCurrency}
				pending={updateGoalMutation.isPending}
				onSubmit={handleIncreaseTarget}
			/>

			<GoalEditContributionDialog
				open={editing != null}
				onOpenChange={(next) => {
					if (!next) setEditing(null);
				}}
				contribution={editing}
				goalName={goal?.name ?? ''}
				preferredCurrency={preferredCurrency}
				maxAvailable={available}
				maxGoalBalance={
					goal ? (goal.currentAmountPreferred ?? goal.currentAmount) : undefined
				}
				pending={updateMutation.isPending}
				onSubmit={handleEdit}
			/>

			<GoalEntryDeleteDialog
				open={deleting != null}
				onOpenChange={(open) => {
					if (!open) setDeleting(null);
				}}
				item={deleting}
				goalName={goal?.name ?? ''}
				categoryName={deleteCategoryName}
				subcategoryName={deleteSubcategoryName}
				preferredCurrency={preferredCurrency}
				pending={deleteMutation.isPending}
				onConfirm={() => void handleDelete()}
			/>
		</div>
	);
}
