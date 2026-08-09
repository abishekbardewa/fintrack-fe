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

interface ExchangeRateRetryDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	date: string;
	pending?: boolean;
	onConfirm: () => void;
}

export function ExchangeRateRetryDialog({
	open,
	onOpenChange,
	date,
	pending = false,
	onConfirm,
}: ExchangeRateRetryDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Retry sync?</AlertDialogTitle>
					<AlertDialogDescription>
						Fetch the latest rate for {date} from Frankfurter?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						disabled={pending}
						onClick={(e) => {
							e.preventDefault();
							onConfirm();
						}}
						data-testid="exchange-rate-retry-confirm"
					>
						{pending ? (
							<>
								<Loader2 className="animate-spin" />
								Syncing…
							</>
						) : (
							'Retry'
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
