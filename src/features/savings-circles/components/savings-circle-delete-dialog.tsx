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
import type { SavingsCircle } from '@/features/savings-circles/types';
import { displayPendingPayout, hasPendingPayout } from '@/features/savings-circles/utils';

interface SavingsCircleDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	circle: SavingsCircle | null;
	preferredCurrency: string;
	pending?: boolean;
	onConfirm: () => void;
}

export function SavingsCircleDeleteDialog({
	open,
	onOpenChange,
	circle,
	preferredCurrency,
	pending = false,
	onConfirm,
}: SavingsCircleDeleteDialogProps) {
	const payoutPending = circle ? hasPendingPayout(circle) : false;
	const payout = circle ? displayPendingPayout(circle, preferredCurrency) : '';

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Circle?</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription asChild>
					<ConfirmCopy
						lead={
							<>
								Delete <ConfirmHighlight>{circle?.name ?? 'this circle'}</ConfirmHighlight>?
							</>
						}
						body={
							payoutPending ? (
								<>
									<ConfirmHighlight className="tabular-nums">{payout}</ConfirmHighlight> will
									be moved to Spendable and this circle and its history will be deleted.
								</>
							) : (
								'This circle and its history will be deleted.'
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
						data-testid="circle-delete-confirm"
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
