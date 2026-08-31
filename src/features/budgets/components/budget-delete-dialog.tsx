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
import type { Budget } from '@/features/budgets/types';
import { displayLimit } from '@/features/budgets/utils';

interface BudgetDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	budget: Budget | null;
	budgetLabel: string;
	periodLabel: string;
	preferredCurrency: string;
	pending?: boolean;
	onConfirm: () => void;
}

export function BudgetDeleteDialog({
	open,
	onOpenChange,
	budget,
	budgetLabel,
	preferredCurrency,
	pending = false,
	onConfirm,
}: BudgetDeleteDialogProps) {
	const amount = budget ? displayLimit(budget, preferredCurrency) : '';

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete budget?</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription asChild>
					<ConfirmCopy
						lead={
							<>
								Are you sure you want to delete the{' '}
								<ConfirmHighlight className="tabular-nums">{amount}</ConfirmHighlight> budget
								for <ConfirmHighlight>{budgetLabel}</ConfirmHighlight>?
							</>
						}
						body="This budget will be permanently deleted. Your transactions and financial balances will not be affected."
					/>
				</AlertDialogDescription>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={pending}
						onClick={(e) => {
							e.preventDefault();
							onConfirm();
						}}
						data-testid="budget-delete-confirm"
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
