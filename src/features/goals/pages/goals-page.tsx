import { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { toast } from 'sonner';

import { useAppSelector } from '@/app/hooks';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { selectUser } from '@/features/auth/authSlice';
import { GoalCancelDialog } from '@/features/goals/components/goal-cancel-dialog';
import { GoalContributeDialog } from '@/features/goals/components/goal-contribute-dialog';
import { GoalDeleteDialog } from '@/features/goals/components/goal-delete-dialog';
import { GoalFormDialog } from '@/features/goals/components/goal-form-dialog';
import { GoalIncreaseTargetDialog } from '@/features/goals/components/goal-increase-target-dialog';
import { GoalList } from '@/features/goals/components/goal-list';
import { GoalMoneyBadge } from '@/features/goals/components/goal-money-badge';
import { GoalReturnDialog } from '@/features/goals/components/goal-return-dialog';
import { GoalSpendDialog } from '@/features/goals/components/goal-spend-dialog';
import {
	useAddContributionMutation,
	useCreateGoalMutation,
	useDeleteGoalMutation,
	useGoalsQuery,
	useReturnToAvailableMutation,
	useSpendFromGoalMutation,
	useUpdateGoalMutation,
} from '@/features/goals/hooks/use-goals';
import type {
	CreateGoalRequest,
	SavingsGoal,
	SavingsGoalStatus,
} from '@/features/goals/types';
import { formatMoney, hasMovableBalance } from '@/features/goals/utils';
import { getErrorMessage } from '@/lib/api/errors';
import { DEFAULT_CURRENCY } from '@/lib/currencies';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: { value: SavingsGoalStatus; label: string }[] = [
	{ value: 'active', label: 'Active' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'cancelled', label: 'Cancelled' },
];

export function GoalsPage() {
	const user = useAppSelector(selectUser);
	const preferredCurrency = user?.currency || DEFAULT_CURRENCY;

	const [statusFilter, setStatusFilter] = useState<SavingsGoalStatus>('active');

	const { data, isLoading, isError, refetch } = useGoalsQuery(statusFilter);
	const createMutation = useCreateGoalMutation();
	const updateMutation = useUpdateGoalMutation();
	const deleteMutation = useDeleteGoalMutation();
	const contributeMutation = useAddContributionMutation();
	const spendMutation = useSpendFromGoalMutation();
	const returnMutation = useReturnToAvailableMutation();

	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<SavingsGoal | null>(null);
	const [contributing, setContributing] = useState<SavingsGoal | null>(null);
	const [spending, setSpending] = useState<SavingsGoal | null>(null);
	const [returning, setReturning] = useState<SavingsGoal | null>(null);
	const [cancelling, setCancelling] = useState<SavingsGoal | null>(null);
	const [increasingTarget, setIncreasingTarget] = useState<SavingsGoal | null>(null);
	const [deleting, setDeleting] = useState<SavingsGoal | null>(null);

	const goals = data?.goals ?? [];
	const available = data?.money?.spendable ?? data?.money?.available;

	const formPending =
		createMutation.isPending || (updateMutation.isPending && increasingTarget == null);

	const openCreate = () => {
		setEditing(null);
		setFormOpen(true);
	};

	const openEdit = (goal: SavingsGoal) => {
		setEditing(goal);
		setFormOpen(true);
	};

	const handleFormSubmit = async (
		payload:
			| CreateGoalRequest
			| {
					name: string;
					targetAmount: number;
					targetDate?: string | null;
			  },
	) => {
		try {
			if (editing) {
				const { name, targetAmount, targetDate } = payload as {
					name: string;
					targetAmount: number;
					targetDate?: string | null;
				};
				await updateMutation.mutateAsync({
					id: editing.id,
					payload: { name, targetAmount, targetDate },
				});
				toast.success('Goal updated');
			} else {
				await createMutation.mutateAsync(payload as CreateGoalRequest);
				toast.success('Goal created');
			}
			setFormOpen(false);
			setEditing(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not save goal.'));
		}
	};

	const handleContribute = async (payload: { amount: number; note?: string }) => {
		if (!contributing) return;
		try {
			await contributeMutation.mutateAsync({
				goalId: contributing.id,
				payload,
			});
			toast.success('Money added');
			setContributing(null);
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
		if (!spending) return;
		try {
			await spendMutation.mutateAsync({ goalId: spending.id, payload });
			toast.success('Expense saved');
			setSpending(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not save expense.'));
		}
	};

	const openReturn = (goal: SavingsGoal) => {
		if (!hasMovableBalance(goal)) {
			toast.error('Nothing to move. This goal has no balance.');
			return;
		}
		setReturning(goal);
	};

	const handleReturn = async (payload: { amount?: number }) => {
		if (!returning) return;
		try {
			await returnMutation.mutateAsync({ goalId: returning.id, payload });
			toast.success('Money moved');
			setReturning(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not move money.'));
		}
	};

	const handleCancelGoal = async () => {
		if (!cancelling) return;
		try {
			await returnMutation.mutateAsync({
				goalId: cancelling.id,
				payload: { cancel: true },
			});
			toast.success('Goal cancelled');
			setCancelling(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not cancel goal.'));
		}
	};

	const handleIncreaseTarget = async (targetAmount: number) => {
		if (!increasingTarget) return;
		try {
			await updateMutation.mutateAsync({
				id: increasingTarget.id,
				payload: { targetAmount },
			});
			toast.success('Target increased');
			setIncreasingTarget(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not increase target.'));
		}
	};

	const handleReactivate = async (goal: SavingsGoal) => {
		try {
			await updateMutation.mutateAsync({
				id: goal.id,
				payload: { status: 'active' },
			});
			toast.success('Goal reactivated');
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not reactivate goal.'));
		}
	};

	const handleDelete = async () => {
		if (!deleting) return;
		try {
			await deleteMutation.mutateAsync(deleting.id);
			toast.success('Goal deleted');
			setDeleting(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not delete goal.'));
		}
	};

	const showChromeSkeleton = isLoading && !data;

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Goals</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Save money for the things that matter.
					</p>
				</div>
				{showChromeSkeleton ? (
					<Skeleton className="h-9 w-28 rounded-full" />
				) : (
					<Button
						type="button"
						onClick={openCreate}
						data-testid="goal-add"
					>
						<Plus className="size-4" />
						New Goal
					</Button>
				)}
			</header>

			{!showChromeSkeleton && typeof available === 'number' ? (
				<GoalMoneyBadge
					label="Spendable Money"
					value={formatMoney(available, preferredCurrency)}
					tone="available"
					amount={available}
				/>
			) : null}

			{showChromeSkeleton ? (
				<div className="flex flex-wrap gap-2" aria-hidden="true">
					<Skeleton className="h-8 w-20 rounded-full" />
					<Skeleton className="h-8 w-28 rounded-full" />
					<Skeleton className="h-8 w-28 rounded-full" />
				</div>
			) : (
				<div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
					{STATUS_FILTERS.map((item) => {
						const active = statusFilter === item.value;
						return (
							<button
								key={item.value}
								type="button"
								role="tab"
								aria-selected={active}
								onClick={() => setStatusFilter(item.value)}
								className={cn(
									'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
									active
										? 'bg-primary text-primary-foreground shadow-sm'
										: 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
								)}
								data-testid={`goal-filter-${item.value}`}
							>
								{item.label}
							</button>
						);
					})}
				</div>
			)}

			{isLoading ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
					<Skeleton className="h-48 rounded-3xl" />
					<Skeleton className="h-48 rounded-3xl" />
					<Skeleton className="h-48 rounded-3xl" />
				</div>
			) : null}

			{isError ? (
				<ErrorState
					title="Could not load goals"
					description="Check your connection and try again."
					onRetry={() => void refetch()}
				/>
			) : null}

			{!isLoading && !isError && goals.length === 0 ? (
				<EmptyState
					icon={Target}
					title={
						statusFilter === 'active'
							? 'No active goals'
							: statusFilter === 'completed'
								? 'No completed goals'
								: 'No cancelled goals'
					}
					description={
						statusFilter === 'active'
							? 'Create a goal to get started.'
							: 'Try another status.'
					}
					action={
						statusFilter === 'active' ? (
							<Button type="button" onClick={openCreate}>
								<Plus className="size-4" />
								New Goal
							</Button>
						) : undefined
					}
				/>
			) : null}

			{!isLoading && !isError && goals.length > 0 ? (
				<GoalList
					goals={goals}
					preferredCurrency={preferredCurrency}
					onContribute={setContributing}
					onSpend={setSpending}
					onReturn={openReturn}
					onCancelGoal={setCancelling}
					onIncreaseTarget={setIncreasingTarget}
					onEdit={openEdit}
					onReactivate={(g) => void handleReactivate(g)}
					onDelete={setDeleting}
				/>
			) : null}

			<GoalFormDialog
				open={formOpen}
				onOpenChange={(open) => {
					setFormOpen(open);
					if (!open) setEditing(null);
				}}
				goal={editing}
				pending={formPending}
				onSubmit={handleFormSubmit}
			/>

			<GoalContributeDialog
				open={contributing != null}
				onOpenChange={(open) => {
					if (!open) setContributing(null);
				}}
				goal={contributing}
				maxAmount={available}
				pending={contributeMutation.isPending}
				onSubmit={handleContribute}
			/>

			<GoalSpendDialog
				open={spending != null}
				onOpenChange={(open) => {
					if (!open) setSpending(null);
				}}
				goal={spending}
				preferredCurrency={preferredCurrency}
				pending={spendMutation.isPending}
				onSubmit={handleSpend}
			/>

			<GoalReturnDialog
				open={returning != null}
				onOpenChange={(open) => {
					if (!open) setReturning(null);
				}}
				goal={returning}
				preferredCurrency={preferredCurrency}
				pending={returnMutation.isPending && cancelling == null}
				onSubmit={handleReturn}
			/>

			<GoalCancelDialog
				open={cancelling != null}
				onOpenChange={(open) => {
					if (!open) setCancelling(null);
				}}
				goal={cancelling}
				preferredCurrency={preferredCurrency}
				pending={returnMutation.isPending && cancelling != null}
				onConfirm={() => void handleCancelGoal()}
			/>

			<GoalIncreaseTargetDialog
				open={increasingTarget != null}
				onOpenChange={(open) => {
					if (!open) setIncreasingTarget(null);
				}}
				goal={increasingTarget}
				preferredCurrency={preferredCurrency}
				pending={updateMutation.isPending && increasingTarget != null}
				onSubmit={handleIncreaseTarget}
			/>

			<GoalDeleteDialog
				open={deleting != null}
				onOpenChange={(open) => {
					if (!open) setDeleting(null);
				}}
				goal={deleting}
				preferredCurrency={preferredCurrency}
				pending={deleteMutation.isPending}
				onConfirm={() => void handleDelete()}
			/>
		</div>
	);
}
