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

interface InvestmentCloseDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	investment: Investment | null;
	preferredCurrency: string;
	pending?: boolean;
	onConfirm: () => void;
}

export function InvestmentCloseDialog({
	open,
	onOpenChange,
	investment,
	preferredCurrency,
	pending = false,
	onConfirm,
}: InvestmentCloseDialogProps) {
	const hasBalance = investment ? hasInvestmentBalance(investment) : false;
	const balance = investment ? displayInvestmentBalance(investment, preferredCurrency) : '';

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Close Investment</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription asChild>
					<ConfirmCopy
						lead={
							<>
								Close <ConfirmHighlight>{investment?.name ?? 'this investment'}</ConfirmHighlight>?
							</>
						}
						body={
							hasBalance ? (
								<>
									<ConfirmHighlight className="tabular-nums">{balance}</ConfirmHighlight> will
									move to Spendable. History is kept.
								</>
							) : (
								'History is kept.'
							)
						}
					/>
				</AlertDialogDescription>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						disabled={pending}
						onClick={(e) => {
							e.preventDefault();
							onConfirm();
						}}
						data-testid="investment-close-confirm"
					>
						{pending ? (
							<>
								<Loader2 className="animate-spin" />
								Closing…
							</>
						) : (
							'Close Investment'
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
