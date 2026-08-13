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
import { formatDate } from '@/features/admin-exchange-rates/utils';

interface ExchangeRateDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	date: string;
	pending?: boolean;
	onConfirm: () => void;
}

export function ExchangeRateDeleteDialog({
	open,
	onOpenChange,
	date,
	pending = false,
	onConfirm,
}: ExchangeRateDeleteDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete rate?</AlertDialogTitle>
					<AlertDialogDescription>
						Remove {formatDate(date)}. Can’t undo.
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
						data-testid="exchange-rate-delete-confirm"
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
