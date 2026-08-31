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

interface SavingsCircleCompleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	circle: SavingsCircle | null;
	preferredCurrency: string;
	pending?: boolean;
	onConfirm: () => void;
}

export function SavingsCircleCompleteDialog({
	open,
	onOpenChange,
	circle,
	preferredCurrency,
	pending = false,
	onConfirm,
}: SavingsCircleCompleteDialogProps) {
	const payoutPending = circle ? hasPendingPayout(circle) : false;
	const payout = circle ? displayPendingPayout(circle, preferredCurrency) : '';

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Complete Circle</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription asChild>
					<ConfirmCopy
						lead={
							<>
								Complete <ConfirmHighlight>{circle?.name ?? 'this circle'}</ConfirmHighlight>?
							</>
						}
						body={
							payoutPending ? (
								<>
									<ConfirmHighlight className="tabular-nums">{payout}</ConfirmHighlight> stays
									pending. History is kept.
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
						data-testid="circle-complete-confirm"
					>
						{pending ? (
							<>
								<Loader2 className="animate-spin" />
								Completing…
							</>
						) : (
							'Complete Circle'
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
