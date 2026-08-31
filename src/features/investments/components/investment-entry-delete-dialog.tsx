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
import type { InvestmentTransaction } from '@/features/investments/types';
import { transactionDisplayAmount } from '@/features/investments/utils';

interface InvestmentEntryDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	item: InvestmentTransaction | null;
	investmentName: string;
	preferredCurrency: string;
	pending?: boolean;
	onConfirm: () => void;
}

export function InvestmentEntryDeleteDialog({
	open,
	onOpenChange,
	item,
	investmentName,
	preferredCurrency,
	pending = false,
	onConfirm,
}: InvestmentEntryDeleteDialogProps) {
	const amount = item ? transactionDisplayAmount(item, preferredCurrency) : '';

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete entry?</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription asChild>
					<ConfirmCopy
						lead={
							<>
								Delete <ConfirmHighlight className="tabular-nums">{amount}</ConfirmHighlight> from{' '}
								<ConfirmHighlight>{investmentName || 'this investment'}</ConfirmHighlight>?
							</>
						}
						body="This cannot be undone."
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
						data-testid="investment-entry-delete-confirm"
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
