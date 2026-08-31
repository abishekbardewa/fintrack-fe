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

interface GoalDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	goal: SavingsGoal | null;
	preferredCurrency: string;
	pending?: boolean;
	onConfirm: () => void;
}

export function GoalDeleteDialog({
	open,
	onOpenChange,
	goal,
	pending = false,
	onConfirm,
}: GoalDeleteDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Goal?</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription asChild>
					<ConfirmCopy
						lead={
							<>
								Delete <ConfirmHighlight>{goal?.name ?? 'this goal'}</ConfirmHighlight>?
							</>
						}
						body="This cannot be undone. Remaining money moves to Spendable."
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
						data-testid="goal-delete-confirm"
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
