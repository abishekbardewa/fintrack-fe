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
import type { SavingsGoal } from '@/features/goals/types';

interface GoalCancelDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	goal: SavingsGoal | null;
	preferredCurrency: string;
	pending?: boolean;
	onConfirm: () => void;
}

export function GoalCancelDialog({
	open,
	onOpenChange,
	goal,
	pending = false,
	onConfirm,
}: GoalCancelDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Cancel Goal?</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription asChild>
					<ConfirmCopy
						lead={
							<>
								Cancel <ConfirmHighlight>{goal?.name ?? 'this goal'}</ConfirmHighlight>?
							</>
						}
						body="Remaining money moves to Spendable."
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
						data-testid="goal-cancel-confirm"
					>
						{pending ? (
							<>
								<Loader2 className="animate-spin" />
								Cancelling…
							</>
						) : (
							'Cancel Goal'
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
