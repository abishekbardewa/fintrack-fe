import { Loader2 } from 'lucide-react';

import { ConfirmCopy, ConfirmHighlight } from '@/components/common/confirm-delete-details';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Transaction } from '@/features/transactions/types';
import { formatMoney } from '@/features/transactions/utils';

interface TransactionDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	transaction: Transaction | null;
	categoryName: string;
	subcategoryName?: string | null;
	goalName?: string | null;
	preferredCurrency: string;
	pending?: boolean;
	onConfirm: () => void;
}

function displayAmount(tx: Transaction, preferredCurrency: string) {
	const amount = tx.amountPreferred ?? tx.amount;
	const currency = tx.amountPreferred != null ? preferredCurrency : tx.currency;
	return formatMoney(amount, currency);
}

function CategoryPath({
	categoryName,
	subcategoryName,
}: {
	categoryName: string;
	subcategoryName?: string | null;
}) {
	if (subcategoryName) {
		return (
			<>
				<ConfirmHighlight>{categoryName}</ConfirmHighlight>
				{' / '}
				<ConfirmHighlight>{subcategoryName}</ConfirmHighlight>
			</>
		);
	}
	return <ConfirmHighlight>{categoryName || 'this category'}</ConfirmHighlight>;
}

export function TransactionDeleteDialog({
	open,
	onOpenChange,
	transaction,
	categoryName,
	subcategoryName,
	goalName,
	preferredCurrency,
	pending = false,
	onConfirm,
}: TransactionDeleteDialogProps) {
	const fromGoal = Boolean(transaction?.fundedFromGoalId);
	const isIncome = transaction?.type === 'income';
	const amount = transaction ? displayAmount(transaction, preferredCurrency) : '';

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{isIncome ? 'Delete income?' : 'Delete expense?'}
					</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription asChild>
					<ConfirmCopy
						lead={
							fromGoal ? (
								<>
									This expense is from{' '}
									<ConfirmHighlight>{goalName || 'a goal'}</ConfirmHighlight>. Delete it from
									that goal’s history.
								</>
							) : isIncome ? (
								<>
									Are you sure you want to delete the{' '}
									<ConfirmHighlight className="tabular-nums">{amount}</ConfirmHighlight> income
									from{' '}
									<CategoryPath
										categoryName={categoryName}
										subcategoryName={subcategoryName}
									/>
									?
								</>
							) : (
								<>
									Are you sure you want to delete the{' '}
									<ConfirmHighlight className="tabular-nums">{amount}</ConfirmHighlight> expense
									from{' '}
									<CategoryPath
										categoryName={categoryName}
										subcategoryName={subcategoryName}
									/>
									?
								</>
							)
						}
						body={
							fromGoal ? (
								'Goal-funded expenses can only be removed from goal history.'
							) : isIncome ? (
								<>
									This will reduce your Overall Position and Spendable Money by{' '}
									<ConfirmHighlight className="tabular-nums">{amount}</ConfirmHighlight>.
								</>
							) : (
								<>
									This will increase your Overall Position and Spendable Money by{' '}
									<ConfirmHighlight className="tabular-nums">{amount}</ConfirmHighlight>.
								</>
							)
						}
					/>
				</AlertDialogDescription>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={pending || fromGoal}
						onClick={(e) => {
							e.preventDefault();
							onConfirm();
						}}
						data-testid="transaction-delete-confirm"
					>
						{pending ? (
							<>
								<Loader2 className="animate-spin" />
								Deleting…
							</>
						) : (
							'Delete'
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
