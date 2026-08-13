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

interface CurrencyChangeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currency: string;
	pending?: boolean;
	onConfirm: () => void;
}

export function CurrencyChangeDialog({
	open,
	onOpenChange,
	currency,
	pending = false,
	onConfirm,
}: CurrencyChangeDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Change default currency to {currency}?</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className="space-y-2 text-sm text-muted-foreground">
							<ul className="list-disc space-y-1 pl-4">
								<li>Existing amounts stay as saved; totals convert to {currency}.</li>
								<li>
									New entries use {currency}. Transactions can still use another currency.
								</li>
							</ul>
						</div>
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
						data-testid="profile-currency-confirm"
					>
						{pending ? (
							<>
								<Loader2 className="animate-spin" />
								Saving…
							</>
						) : (
							'Change'
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
