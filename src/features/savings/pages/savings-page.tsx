import { useState } from 'react';
import { Landmark, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { useAppSelector } from '@/app/hooks';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { selectUser } from '@/features/auth/authSlice';
import { GoalMoneyBadge } from '@/features/goals/components/goal-money-badge';
import { SavingDeleteDialog } from '@/features/savings/components/saving-delete-dialog';
import { SavingFormDialog } from '@/features/savings/components/saving-form-dialog';
import { SavingList } from '@/features/savings/components/saving-list';
import { SavingMovementDialog } from '@/features/savings/components/saving-movement-dialog';
import {
	useAddSavingReturnMutation,
	useContributeToSavingMutation,
	useCreateSavingMutation,
	useDeleteSavingMutation,
	useSavingsQuery,
	useUpdateSavingMutation,
	useWithdrawFromSavingMutation,
} from '@/features/savings/hooks/use-savings';
import type { CreateSavingRequest, Saving, UpdateSavingRequest } from '@/features/savings/types';
import { formatMoney, hasSavingBalance } from '@/features/savings/utils';
import { getErrorMessage } from '@/lib/api/errors';
import { DEFAULT_CURRENCY } from '@/lib/currencies';

export function SavingsPage() {
	const user = useAppSelector(selectUser);
	const preferredCurrency = user?.currency || DEFAULT_CURRENCY;

	const { data, isLoading, isError, refetch } = useSavingsQuery();
	const createMutation = useCreateSavingMutation();
	const updateMutation = useUpdateSavingMutation();
	const deleteMutation = useDeleteSavingMutation();
	const contributeMutation = useContributeToSavingMutation();
	const withdrawMutation = useWithdrawFromSavingMutation();
	const returnMutation = useAddSavingReturnMutation();

	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Saving | null>(null);
	const [contributing, setContributing] = useState<Saving | null>(null);
	const [withdrawing, setWithdrawing] = useState<Saving | null>(null);
	const [addingReturn, setAddingReturn] = useState<Saving | null>(null);
	const [deleting, setDeleting] = useState<Saving | null>(null);

	const savings = data?.savings ?? [];
	const available = data?.money?.spendable ?? data?.money?.available;
	const inSavings = data?.money?.inSavings;
	const formPending = createMutation.isPending || updateMutation.isPending;
	const showChromeSkeleton = isLoading && !data;

	const openCreate = () => {
		setEditing(null);
		setFormOpen(true);
	};

	const openEdit = (saving: Saving) => {
		setEditing(saving);
		setFormOpen(true);
	};

	const handleFormSubmit = async (payload: CreateSavingRequest | UpdateSavingRequest) => {
		try {
			if (editing) {
				await updateMutation.mutateAsync({
					id: editing.id,
					payload: payload as UpdateSavingRequest,
				});
				toast.success('Savings updated');
			} else {
				await createMutation.mutateAsync(payload as CreateSavingRequest);
				toast.success('Savings created');
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
			await contributeMutation.mutateAsync({ savingId: contributing.id, payload });
			toast.success('Money added');
			setContributing(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not add money.'));
		}
	};

	const openWithdraw = (saving: Saving) => {
		if (!hasSavingBalance(saving)) {
			toast.error('Nothing to move. This savings has no balance.');
			return;
		}
		setWithdrawing(saving);
	};

	const handleWithdraw = async (payload: {
		amount: number;
		currency?: string;
		date?: string;
		note?: string;
	}) => {
		if (!withdrawing) return;
		try {
			await withdrawMutation.mutateAsync({ savingId: withdrawing.id, payload });
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
			await returnMutation.mutateAsync({ savingId: addingReturn.id, payload });
			toast.success('Return added');
			setAddingReturn(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not add return.'));
		}
	};

	const handleDelete = async () => {
		if (!deleting) return;
		try {
			await deleteMutation.mutateAsync(deleting.id);
			toast.success('Savings deleted');
			setDeleting(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not delete.'));
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Savings</h1>
					<p className="mt-1 text-sm text-muted-foreground">Set money aside for later.</p>
				</div>
				{showChromeSkeleton ? (
					<Skeleton className="h-9 w-32 rounded-full" />
				) : (
					<Button type="button" onClick={openCreate} data-testid="saving-add">
						<Plus className="size-4" />
						New Savings
					</Button>
				)}
			</header>

			{!showChromeSkeleton && (typeof available === 'number' || typeof inSavings === 'number') ? (
				<div className="flex flex-wrap gap-2">
					{typeof available === 'number' ? (
						<GoalMoneyBadge
							label="Spendable Money"
							value={formatMoney(available, preferredCurrency)}
							tone="available"
							amount={available}
						/>
					) : null}
					{typeof inSavings === 'number' ? (
						<GoalMoneyBadge
							label="In Savings"
							value={formatMoney(inSavings, preferredCurrency)}
							tone="goal"
							amount={inSavings}
						/>
					) : null}
				</div>
			) : null}

			{isLoading ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
					<Skeleton className="h-48 rounded-3xl" />
					<Skeleton className="h-48 rounded-3xl" />
					<Skeleton className="h-48 rounded-3xl" />
				</div>
			) : null}

			{isError ? (
				<ErrorState
					title="Could not load savings"
					description="Check your connection and try again."
					onRetry={() => void refetch()}
				/>
			) : null}

			{!isLoading && !isError && savings.length === 0 ? (
				<EmptyState
					icon={Landmark}
					title="No savings yet"
					description="Create savings to get started."
					action={
						<Button type="button" onClick={openCreate}>
							<Plus className="size-4" />
							New Savings
						</Button>
					}
				/>
			) : null}

			{!isLoading && !isError && savings.length > 0 ? (
				<SavingList
					savings={savings}
					preferredCurrency={preferredCurrency}
					onContribute={setContributing}
					onWithdraw={openWithdraw}
					onAddReturn={setAddingReturn}
					onEdit={openEdit}
					onDelete={setDeleting}
				/>
			) : null}

			<SavingFormDialog
				open={formOpen}
				onOpenChange={(open) => {
					setFormOpen(open);
					if (!open) setEditing(null);
				}}
				saving={editing}
				pending={formPending}
				onSubmit={handleFormSubmit}
			/>

			<SavingMovementDialog
				open={contributing != null}
				onOpenChange={(open) => {
					if (!open) setContributing(null);
				}}
				mode="contribute"
				saving={contributing}
				preferredCurrency={preferredCurrency}
				maxAmount={available}
				pending={contributeMutation.isPending}
				onSubmit={handleContribute}
			/>

			<SavingMovementDialog
				open={withdrawing != null}
				onOpenChange={(open) => {
					if (!open) setWithdrawing(null);
				}}
				mode="withdraw"
				saving={withdrawing}
				preferredCurrency={preferredCurrency}
				maxAmount={
					withdrawing
						? (withdrawing.currentAmountPreferred ?? withdrawing.currentAmount)
						: undefined
				}
				pending={withdrawMutation.isPending}
				onSubmit={handleWithdraw}
			/>

			<SavingMovementDialog
				open={addingReturn != null}
				onOpenChange={(open) => {
					if (!open) setAddingReturn(null);
				}}
				mode="return"
				saving={addingReturn}
				preferredCurrency={preferredCurrency}
				pending={returnMutation.isPending}
				onSubmit={handleAddReturn}
			/>

			<SavingDeleteDialog
				open={deleting != null}
				onOpenChange={(open) => {
					if (!open) setDeleting(null);
				}}
				saving={deleting}
				preferredCurrency={preferredCurrency}
				pending={deleteMutation.isPending}
				onConfirm={() => void handleDelete()}
			/>
		</div>
	);
}
