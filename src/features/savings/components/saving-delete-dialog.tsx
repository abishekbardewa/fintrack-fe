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
import type { Saving } from '@/features/savings/types';
import { displaySavingBalance, hasSavingBalance } from '@/features/savings/utils';

interface SavingDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	saving: Saving | null;
	preferredCurrency: string;
	pending?: boolean;
	onConfirm: () => void;
}

export function SavingDeleteDialog({
	open,
	onOpenChange,
	saving,
	preferredCurrency,
	pending = false,
	onConfirm,
}: SavingDeleteDialogProps) {
	const hasBalance = saving ? hasSavingBalance(saving) : false;
	const balance = saving ? displaySavingBalance(saving, preferredCurrency) : '';

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Savings?</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription asChild>
					<ConfirmCopy
						lead={
							<>
								Delete <ConfirmHighlight>{saving?.name ?? 'this savings'}</ConfirmHighlight>?
							</>
						}
						body={
							hasBalance ? (
								<>
									<ConfirmHighlight className="tabular-nums">{balance}</ConfirmHighlight> will
									be moved to Spendable and this savings history will be deleted.
								</>
							) : (
								'This savings and its history will be deleted.'
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
						data-testid="saving-delete-confirm"
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
