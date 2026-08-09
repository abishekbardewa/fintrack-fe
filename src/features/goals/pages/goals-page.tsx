import { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { toast } from 'sonner';

import { useAppSelector } from '@/app/hooks';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { selectUser } from '@/features/auth/authSlice';
import { GoalContributeDialog } from '@/features/goals/components/goal-contribute-dialog';
import { GoalContributionsDialog } from '@/features/goals/components/goal-contributions-dialog';
import { GoalDeleteDialog } from '@/features/goals/components/goal-delete-dialog';
import { GoalFormDialog } from '@/features/goals/components/goal-form-dialog';
import { GoalList } from '@/features/goals/components/goal-list';
import {
	useAddContributionMutation,
	useCreateGoalMutation,
	useDeleteGoalMutation,
	useGoalsQuery,
	useUpdateGoalMutation,
} from '@/features/goals/hooks/use-goals';
import type {
	CreateGoalRequest,
	SavingsGoal,
	SavingsGoalStatus,
} from '@/features/goals/types';
import { MAX_ACTIVE_SAVINGS_GOALS } from '@/features/goals/types';
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
	const { data: activeData } = useGoalsQuery('active');
	const createMutation = useCreateGoalMutation();
	const updateMutation = useUpdateGoalMutation();
	const deleteMutation = useDeleteGoalMutation();
	const contributeMutation = useAddContributionMutation();

	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<SavingsGoal | null>(null);
	const [contributing, setContributing] = useState<SavingsGoal | null>(null);
	const [historyGoal, setHistoryGoal] = useState<SavingsGoal | null>(null);
	const [deleting, setDeleting] = useState<SavingsGoal | null>(null);

	const goals = data?.goals ?? [];
	const activeCount = activeData?.goals.length ?? 0;
	const atActiveCap = activeCount >= MAX_ACTIVE_SAVINGS_GOALS;

	const formPending = createMutation.isPending || updateMutation.isPending;

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

	const handleContribute = async (payload: {
		amount: number;
		currency: string;
		date: string;
		note?: string;
	}) => {
		if (!contributing) return;
		try {
			await contributeMutation.mutateAsync({
				goalId: contributing.id,
				payload,
			});
			toast.success('Contribution added');
			setContributing(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not add contribution.'));
		}
	};

	const handleCancelGoal = async (goal: SavingsGoal) => {
		try {
			await updateMutation.mutateAsync({
				id: goal.id,
				payload: { status: 'cancelled' },
			});
			toast.success('Goal cancelled');
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not cancel goal.'));
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

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Goals</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Track savings goals and manual contributions.
					</p>
				</div>
				<Button
					type="button"
					onClick={openCreate}
					disabled={atActiveCap}
					data-testid="goal-add"
				>
					<Plus className="size-4" />
					New Goal
				</Button>
			</header>

			{atActiveCap ? (
				<p className="text-sm text-muted-foreground">
					You&apos;ve reached the limit of {MAX_ACTIVE_SAVINGS_GOALS} active goals. Complete or
					cancel one to add another.
				</p>
			) : null}

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
						statusFilter === 'active' && !atActiveCap ? (
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
					onEdit={openEdit}
					onHistory={setHistoryGoal}
					onCancel={(g) => void handleCancelGoal(g)}
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
				preferredCurrency={preferredCurrency}
				pending={formPending}
				onSubmit={handleFormSubmit}
			/>

			<GoalContributeDialog
				open={contributing != null}
				onOpenChange={(open) => {
					if (!open) setContributing(null);
				}}
				goal={contributing}
				preferredCurrency={preferredCurrency}
				pending={contributeMutation.isPending}
				onSubmit={handleContribute}
			/>

			<GoalContributionsDialog
				open={historyGoal != null}
				onOpenChange={(open) => {
					if (!open) setHistoryGoal(null);
				}}
				goal={historyGoal}
				preferredCurrency={preferredCurrency}
			/>

			<GoalDeleteDialog
				open={deleting != null}
				onOpenChange={(open) => {
					if (!open) setDeleting(null);
				}}
				goalName={deleting?.name ?? ''}
				pending={deleteMutation.isPending}
				onConfirm={() => void handleDelete()}
			/>
		</div>
	);
}
