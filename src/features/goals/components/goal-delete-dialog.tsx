import { Loader2 } from 'lucide-react';

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

interface GoalDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	goalName: string;
	pending?: boolean;
	onConfirm: () => void;
}

export function GoalDeleteDialog({
	open,
	onOpenChange,
	goalName,
	pending = false,
	onConfirm,
}: GoalDeleteDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete savings goal?</AlertDialogTitle>
					<AlertDialogDescription>
						Delete &ldquo;{goalName}&rdquo; and all of its contributions? This cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
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
