import { useState } from 'react';
import { Briefcase, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { useAppSelector } from '@/app/hooks';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { selectUser } from '@/features/auth/authSlice';
import { GoalMoneyBadge } from '@/features/goals/components/goal-money-badge';
import { InvestmentCloseDialog } from '@/features/investments/components/investment-close-dialog';
import { InvestmentDeleteDialog } from '@/features/investments/components/investment-delete-dialog';
import { InvestmentFormDialog } from '@/features/investments/components/investment-form-dialog';
import { InvestmentList } from '@/features/investments/components/investment-list';
import { InvestmentMovementDialog } from '@/features/investments/components/investment-movement-dialog';
import {
	useAddInvestmentReturnMutation,
	useCloseInvestmentMutation,
	useContributeToInvestmentMutation,
	useCreateInvestmentMutation,
	useDeleteInvestmentMutation,
	useInvestmentsQuery,
	useRecordInvestmentLossMutation,
	useUpdateInvestmentMutation,
	useWithdrawFromInvestmentMutation,
} from '@/features/investments/hooks/use-investments';
import type {
	CreateInvestmentRequest,
	Investment,
	InvestmentStatus,
	UpdateInvestmentRequest,
} from '@/features/investments/types';
import { formatMoney, hasInvestmentBalance } from '@/features/investments/utils';
import { getErrorMessage } from '@/lib/api/errors';
import { DEFAULT_CURRENCY } from '@/lib/currencies';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: { value: InvestmentStatus; label: string }[] = [
	{ value: 'active', label: 'Active' },
	{ value: 'closed', label: 'Closed' },
];

export function InvestmentsPage() {
	const user = useAppSelector(selectUser);
	const preferredCurrency = user?.currency || DEFAULT_CURRENCY;

	const [statusFilter, setStatusFilter] = useState<InvestmentStatus>('active');
	const { data, isLoading, isError, refetch } = useInvestmentsQuery(statusFilter);
	const createMutation = useCreateInvestmentMutation();
	const updateMutation = useUpdateInvestmentMutation();
	const deleteMutation = useDeleteInvestmentMutation();
	const contributeMutation = useContributeToInvestmentMutation();
	const withdrawMutation = useWithdrawFromInvestmentMutation();
	const returnMutation = useAddInvestmentReturnMutation();
	const lossMutation = useRecordInvestmentLossMutation();
	const closeMutation = useCloseInvestmentMutation();

	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Investment | null>(null);
	const [contributing, setContributing] = useState<Investment | null>(null);
	const [withdrawing, setWithdrawing] = useState<Investment | null>(null);
	const [addingReturn, setAddingReturn] = useState<Investment | null>(null);
	const [recordingLoss, setRecordingLoss] = useState<Investment | null>(null);
	const [closing, setClosing] = useState<Investment | null>(null);
	const [deleting, setDeleting] = useState<Investment | null>(null);

	const investments = data?.investments ?? [];
	const available = data?.money?.spendable ?? data?.money?.available;
	const inInvestments = data?.money?.inInvestments;
	const formPending = createMutation.isPending || updateMutation.isPending;
	const showChromeSkeleton = isLoading && !data;

	const openCreate = () => {
		setEditing(null);
		setFormOpen(true);
	};

	const handleFormSubmit = async (payload: CreateInvestmentRequest | UpdateInvestmentRequest) => {
		try {
			if (editing) {
				await updateMutation.mutateAsync({
					id: editing.id,
					payload: payload as UpdateInvestmentRequest,
				});
				toast.success('Investment updated');
			} else {
				await createMutation.mutateAsync(payload as CreateInvestmentRequest);
				toast.success('Investment created');
			}
			setFormOpen(false);
			setEditing(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not save investment.'));
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
			await contributeMutation.mutateAsync({ investmentId: contributing.id, payload });
			toast.success('Money added');
			setContributing(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not add money.'));
		}
	};

	const openWithdraw = (investment: Investment) => {
		if (!hasInvestmentBalance(investment)) {
			toast.error('Nothing to move. This investment has no balance.');
			return;
		}
		setWithdrawing(investment);
	};

	const handleWithdraw = async (payload: {
		amount: number;
		currency?: string;
		date?: string;
		note?: string;
	}) => {
		if (!withdrawing) return;
		try {
			await withdrawMutation.mutateAsync({ investmentId: withdrawing.id, payload });
			toast.success('Money moved');
			setWithdrawing(null);
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
		if (!addingReturn) return;
		try {
			await returnMutation.mutateAsync({ investmentId: addingReturn.id, payload });
			toast.success('Return added');
			setAddingReturn(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not add return.'));
		}
	};

	const openLoss = (investment: Investment) => {
		if (!hasInvestmentBalance(investment)) {
			toast.error('Nothing to record. This investment has no balance.');
			return;
		}
		setRecordingLoss(investment);
	};

	const handleLoss = async (payload: {
		amount: number;
		currency?: string;
		date?: string;
		note?: string;
	}) => {
		if (!recordingLoss) return;
		try {
			await lossMutation.mutateAsync({ investmentId: recordingLoss.id, payload });
			toast.success('Loss recorded');
			setRecordingLoss(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not record loss.'));
		}
	};

	const handleClose = async () => {
		if (!closing) return;
		try {
			await closeMutation.mutateAsync({ investmentId: closing.id, payload: {} });
			toast.success('Investment closed');
			setClosing(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not close investment.'));
		}
	};

	const handleDelete = async () => {
		if (!deleting) return;
		try {
			await deleteMutation.mutateAsync(deleting.id);
			toast.success('Investment deleted');
			setDeleting(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not delete investment.'));
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Investments</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Keep track of your investments.
					</p>
				</div>
				{showChromeSkeleton ? (
					<Skeleton className="h-9 w-36 rounded-full" />
				) : (
					<Button type="button" onClick={openCreate} data-testid="investment-add">
						<Plus className="size-4" />
						New Investment
					</Button>
				)}
			</header>

			{!showChromeSkeleton && (typeof available === 'number' || typeof inInvestments === 'number') ? (
				<div className="flex flex-wrap gap-2">
					{typeof available === 'number' ? (
						<GoalMoneyBadge
							label="Spendable Money"
							value={formatMoney(available, preferredCurrency)}
							tone="available"
							amount={available}
						/>
					) : null}
					{typeof inInvestments === 'number' ? (
						<GoalMoneyBadge
							label="In Investments"
							value={formatMoney(inInvestments, preferredCurrency)}
							tone="goal"
							amount={inInvestments}
						/>
					) : null}
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
								data-testid={`investment-filter-${item.value}`}
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
					title="Could not load investments"
					description="Check your connection and try again."
					onRetry={() => void refetch()}
				/>
			) : null}

			{!isLoading && !isError && investments.length === 0 ? (
				<EmptyState
					icon={Briefcase}
					title={statusFilter === 'active' ? 'No active investments' : 'No closed investments'}
					description={
						statusFilter === 'active'
							? 'Create an investment to get started.'
							: 'Try another status.'
					}
					action={
						statusFilter === 'active' ? (
							<Button type="button" onClick={openCreate}>
								<Plus className="size-4" />
								New Investment
							</Button>
						) : undefined
					}
				/>
			) : null}

			{!isLoading && !isError && investments.length > 0 ? (
				<InvestmentList
					investments={investments}
					preferredCurrency={preferredCurrency}
					onContribute={setContributing}
					onWithdraw={openWithdraw}
					onAddReturn={setAddingReturn}
					onRecordLoss={openLoss}
					onClose={setClosing}
					onEdit={(investment) => {
						setEditing(investment);
						setFormOpen(true);
					}}
					onDelete={setDeleting}
				/>
			) : null}

			<InvestmentFormDialog
				open={formOpen}
				onOpenChange={(open) => {
					setFormOpen(open);
					if (!open) setEditing(null);
				}}
				investment={editing}
				pending={formPending}
				onSubmit={handleFormSubmit}
			/>

			<InvestmentMovementDialog
				open={contributing != null}
				onOpenChange={(open) => {
					if (!open) setContributing(null);
				}}
				mode="contribute"
				investment={contributing}
				preferredCurrency={preferredCurrency}
				maxAmount={available}
				pending={contributeMutation.isPending}
				onSubmit={handleContribute}
			/>

			<InvestmentMovementDialog
				open={withdrawing != null}
				onOpenChange={(open) => {
					if (!open) setWithdrawing(null);
				}}
				mode="withdraw"
				investment={withdrawing}
				preferredCurrency={preferredCurrency}
				maxAmount={
					withdrawing
						? (withdrawing.currentBalancePreferred ?? withdrawing.currentBalance)
						: undefined
				}
				pending={withdrawMutation.isPending}
				onSubmit={handleWithdraw}
			/>

			<InvestmentMovementDialog
				open={addingReturn != null}
				onOpenChange={(open) => {
					if (!open) setAddingReturn(null);
				}}
				mode="return"
				investment={addingReturn}
				preferredCurrency={preferredCurrency}
				pending={returnMutation.isPending}
				onSubmit={handleAddReturn}
			/>

			<InvestmentMovementDialog
				open={recordingLoss != null}
				onOpenChange={(open) => {
					if (!open) setRecordingLoss(null);
				}}
				mode="loss"
				investment={recordingLoss}
				preferredCurrency={preferredCurrency}
				maxAmount={
					recordingLoss
						? (recordingLoss.currentBalancePreferred ?? recordingLoss.currentBalance)
						: undefined
				}
				pending={lossMutation.isPending}
				onSubmit={handleLoss}
			/>

			<InvestmentCloseDialog
				open={closing != null}
				onOpenChange={(open) => {
					if (!open) setClosing(null);
				}}
				investment={closing}
				preferredCurrency={preferredCurrency}
				pending={closeMutation.isPending}
				onConfirm={() => void handleClose()}
			/>

			<InvestmentDeleteDialog
				open={deleting != null}
				onOpenChange={(open) => {
					if (!open) setDeleting(null);
				}}
				investment={deleting}
				preferredCurrency={preferredCurrency}
				pending={deleteMutation.isPending}
				onConfirm={() => void handleDelete()}
			/>
		</div>
	);
}
