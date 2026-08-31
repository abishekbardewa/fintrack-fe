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
import type { GoalContribution } from '@/features/goals/types';
import { contributionDisplayAmount } from '@/features/goals/utils';

interface GoalEntryDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	item: GoalContribution | null;
	goalName: string;
	categoryName?: string | null;
	subcategoryName?: string | null;
	preferredCurrency: string;
	pending?: boolean;
	onConfirm: () => void;
}

export function GoalEntryDeleteDialog({
	open,
	onOpenChange,
	item,
	goalName,
	preferredCurrency,
	pending = false,
	onConfirm,
}: GoalEntryDeleteDialogProps) {
	const amount = item ? contributionDisplayAmount(item, preferredCurrency) : '';

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
								<ConfirmHighlight>{goalName || 'this goal'}</ConfirmHighlight>?
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
						data-testid="goal-entry-delete-confirm"
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
