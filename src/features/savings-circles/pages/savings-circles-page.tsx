import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

import { useAppSelector } from '@/app/hooks';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { selectUser } from '@/features/auth/authSlice';
import { GoalMoneyBadge } from '@/features/goals/components/goal-money-badge';
import { SavingsCircleCompleteDialog } from '@/features/savings-circles/components/savings-circle-complete-dialog';
import { SavingsCircleDeleteDialog } from '@/features/savings-circles/components/savings-circle-delete-dialog';
import { SavingsCircleFormDialog } from '@/features/savings-circles/components/savings-circle-form-dialog';
import { SavingsCircleList } from '@/features/savings-circles/components/savings-circle-list';
import { SavingsCircleMovementDialog } from '@/features/savings-circles/components/savings-circle-movement-dialog';
import {
	useCompleteSavingsCircleMutation,
	useContributeToSavingsCircleMutation,
	useCreateSavingsCircleMutation,
	useDeleteSavingsCircleMutation,
	useMoveSavingsCirclePayoutMutation,
	useRecordSavingsCirclePayoutMutation,
	useSavingsCirclesQuery,
	useUpdateSavingsCircleMutation,
} from '@/features/savings-circles/hooks/use-savings-circles';
import type {
	CreateSavingsCircleRequest,
	SavingsCircle,
	SavingsCircleStatus,
	UpdateSavingsCircleRequest,
} from '@/features/savings-circles/types';
import { formatMoney, hasPendingPayout, pendingPayoutAmount } from '@/features/savings-circles/utils';
import { getErrorMessage } from '@/lib/api/errors';
import { DEFAULT_CURRENCY } from '@/lib/currencies';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: { value: SavingsCircleStatus; label: string }[] = [
	{ value: 'active', label: 'Active' },
	{ value: 'completed', label: 'Completed' },
];

export function SavingsCirclesPage() {
	const user = useAppSelector(selectUser);
	const preferredCurrency = user?.currency || DEFAULT_CURRENCY;

	const [statusFilter, setStatusFilter] = useState<SavingsCircleStatus>('active');
	const { data, isLoading, isError, refetch } = useSavingsCirclesQuery(statusFilter);
	const createMutation = useCreateSavingsCircleMutation();
	const updateMutation = useUpdateSavingsCircleMutation();
	const deleteMutation = useDeleteSavingsCircleMutation();
	const contributeMutation = useContributeToSavingsCircleMutation();
	const payoutMutation = useRecordSavingsCirclePayoutMutation();
	const movePayoutMutation = useMoveSavingsCirclePayoutMutation();
	const completeMutation = useCompleteSavingsCircleMutation();

	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<SavingsCircle | null>(null);
	const [contributing, setContributing] = useState<SavingsCircle | null>(null);
	const [recordingPayout, setRecordingPayout] = useState<SavingsCircle | null>(null);
	const [movingPayout, setMovingPayout] = useState<SavingsCircle | null>(null);
	const [completing, setCompleting] = useState<SavingsCircle | null>(null);
	const [deleting, setDeleting] = useState<SavingsCircle | null>(null);

	const circles = data?.circles ?? [];
	const available = data?.money?.spendable ?? data?.money?.available;
	const formPending = createMutation.isPending || updateMutation.isPending;
	const showChromeSkeleton = isLoading && !data;

	const openCreate = () => {
		setEditing(null);
		setFormOpen(true);
	};

	const openEdit = (circle: SavingsCircle) => {
		setEditing(circle);
		setFormOpen(true);
	};

	const handleFormSubmit = async (
		payload: CreateSavingsCircleRequest | UpdateSavingsCircleRequest,
	) => {
		try {
			if (editing) {
				await updateMutation.mutateAsync({
					id: editing.id,
					payload: payload as UpdateSavingsCircleRequest,
				});
				toast.success('Circle updated');
			} else {
				await createMutation.mutateAsync(payload as CreateSavingsCircleRequest);
				toast.success('Circle created');
			}
			setFormOpen(false);
			setEditing(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not save.'));
		}
	};

	const handleContribute = async (payload: {
		amount: number;
		currency?: string;
		date?: string;
		note?: string;
	}) => {
		if (!contributing) return;
		try {
			await contributeMutation.mutateAsync({ circleId: contributing.id, payload });
			toast.success('Contribution recorded');
			setContributing(null);
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
		if (!recordingPayout) return;
		try {
			await payoutMutation.mutateAsync({ circleId: recordingPayout.id, payload });
			toast.success('Payout recorded');
			setRecordingPayout(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not record payout.'));
		}
	};

	const openMovePayout = (circle: SavingsCircle) => {
		if (!hasPendingPayout(circle)) {
			toast.error('No pending payout to move.');
			return;
		}
		setMovingPayout(circle);
	};

	const handleMovePayout = async (payload: {
		amount: number;
		currency?: string;
		date?: string;
		note?: string;
	}) => {
		if (!movingPayout) return;
		try {
			await movePayoutMutation.mutateAsync({ circleId: movingPayout.id, payload });
			toast.success('Payout moved to Spendable');
			setMovingPayout(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not move payout.'));
		}
	};

	const handleComplete = async () => {
		if (!completing) return;
		try {
			await completeMutation.mutateAsync(completing.id);
			toast.success('Circle completed');
			setCompleting(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not complete circle.'));
		}
	};

	const handleDelete = async () => {
		if (!deleting) return;
		try {
			await deleteMutation.mutateAsync(deleting.id);
			toast.success('Circle deleted');
			setDeleting(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not delete.'));
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Circles</h1>
					<p className="mt-1 text-sm text-muted-foreground">Keep track of your savings circles.</p>
				</div>
				{showChromeSkeleton ? (
					<Skeleton className="h-9 w-28 rounded-full" />
				) : (
					<Button type="button" onClick={openCreate} data-testid="circle-add">
						<Plus className="size-4" />
						New Circle
					</Button>
				)}
			</header>

			{!showChromeSkeleton && typeof available === 'number' ? (
				<div className="flex flex-wrap gap-2">
					<GoalMoneyBadge
						label="Spendable Money"
						value={formatMoney(available, preferredCurrency)}
						tone="available"
						amount={available}
					/>
				</div>
			) : null}

			{showChromeSkeleton ? (
				<div className="flex flex-wrap gap-2" aria-hidden="true">
					<Skeleton className="h-8 w-20 rounded-full" />
					<Skeleton className="h-8 w-24 rounded-full" />
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
								data-testid={`circle-filter-${item.value}`}
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
					title="Could not load circles"
					description="Check your connection and try again."
					onRetry={() => void refetch()}
				/>
			) : null}

			{!isLoading && !isError && circles.length === 0 ? (
				<EmptyState
					icon={Users}
					title={statusFilter === 'active' ? 'No active circles' : 'No completed circles'}
					description={
						statusFilter === 'active' ? 'Create a circle to get started.' : 'Try another status.'
					}
					action={
						statusFilter === 'active' ? (
							<Button type="button" onClick={openCreate}>
								<Plus className="size-4" />
								New Circle
							</Button>
						) : undefined
					}
				/>
			) : null}

			{!isLoading && !isError && circles.length > 0 ? (
				<SavingsCircleList
					circles={circles}
					preferredCurrency={preferredCurrency}
					onContribute={setContributing}
					onRecordPayout={setRecordingPayout}
					onMovePayout={openMovePayout}
					onComplete={setCompleting}
					onEdit={openEdit}
					onDelete={setDeleting}
				/>
			) : null}

			<SavingsCircleFormDialog
				open={formOpen}
				onOpenChange={(open) => {
					setFormOpen(open);
					if (!open) setEditing(null);
				}}
				circle={editing}
				pending={formPending}
				onSubmit={handleFormSubmit}
			/>

			<SavingsCircleMovementDialog
				open={contributing != null}
				onOpenChange={(open) => {
					if (!open) setContributing(null);
				}}
				mode="contribute"
				circle={contributing}
				preferredCurrency={preferredCurrency}
				maxAmount={available}
				pending={contributeMutation.isPending}
				onSubmit={handleContribute}
			/>

			<SavingsCircleMovementDialog
				open={recordingPayout != null}
				onOpenChange={(open) => {
					if (!open) setRecordingPayout(null);
				}}
				mode="recordPayout"
				circle={recordingPayout}
				preferredCurrency={preferredCurrency}
				pending={payoutMutation.isPending}
				onSubmit={handleRecordPayout}
			/>

			<SavingsCircleMovementDialog
				open={movingPayout != null}
				onOpenChange={(open) => {
					if (!open) setMovingPayout(null);
				}}
				mode="movePayout"
				circle={movingPayout}
				preferredCurrency={preferredCurrency}
				maxAmount={movingPayout ? pendingPayoutAmount(movingPayout) : undefined}
				pending={movePayoutMutation.isPending}
				onSubmit={handleMovePayout}
			/>

			<SavingsCircleCompleteDialog
				open={completing != null}
				onOpenChange={(open) => {
					if (!open) setCompleting(null);
				}}
				circle={completing}
				preferredCurrency={preferredCurrency}
				pending={completeMutation.isPending}
				onConfirm={() => void handleComplete()}
			/>

			<SavingsCircleDeleteDialog
				open={deleting != null}
				onOpenChange={(open) => {
					if (!open) setDeleting(null);
				}}
				circle={deleting}
				preferredCurrency={preferredCurrency}
				pending={deleteMutation.isPending}
				onConfirm={() => void handleDelete()}
			/>
		</div>
	);
}
