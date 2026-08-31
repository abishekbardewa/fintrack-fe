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
import type { Investment } from '@/features/investments/types';
import { displayInvestmentBalance, hasInvestmentBalance } from '@/features/investments/utils';

interface InvestmentDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	investment: Investment | null;
	preferredCurrency: string;
	pending?: boolean;
	onConfirm: () => void;
}

export function InvestmentDeleteDialog({
	open,
	onOpenChange,
	investment,
	preferredCurrency,
	pending = false,
	onConfirm,
}: InvestmentDeleteDialogProps) {
	const isClosed = investment?.status === 'closed';
	const hasBalance = investment ? !isClosed && hasInvestmentBalance(investment) : false;
	const balance = investment ? displayInvestmentBalance(investment, preferredCurrency) : '';

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Investment?</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription asChild>
					<ConfirmCopy
						lead={
							<>
								Delete <ConfirmHighlight>{investment?.name ?? 'this investment'}</ConfirmHighlight>?
							</>
						}
						body={
							hasBalance ? (
								<>
									<ConfirmHighlight className="tabular-nums">{balance}</ConfirmHighlight> will
									move to Spendable. This investment and its history will be deleted.
								</>
							) : (
								'This investment and its history will be deleted.'
							)
						}
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
						data-testid="investment-delete-confirm"
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
