import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

interface StartingBalancePromptDialogProps {
	open: boolean;
	pending?: boolean;
	onAdd: () => void;
	onMaybeLater: () => void;
	onOpenChange: (open: boolean) => void;
}

export function StartingBalancePromptDialog({
	open,
	pending = false,
	onAdd,
	onMaybeLater,
	onOpenChange,
}: StartingBalancePromptDialogProps) {
	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (pending) return;
				onOpenChange(next);
			}}
		>
			<DialogContent showCloseButton={!pending} data-testid="starting-balance-prompt">
				<DialogHeader>
					<DialogTitle>Starting Balance</DialogTitle>
					<DialogDescription>
						How much money do you have available to spend?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={onMaybeLater}
						disabled={pending}
						data-testid="starting-balance-prompt-later"
					>
						{pending ? (
							<>
								<Loader2 className="animate-spin" />
								Saving…
							</>
						) : (
							'Maybe Later'
						)}
					</Button>
					<Button
						type="button"
						onClick={onAdd}
						disabled={pending}
						data-testid="starting-balance-prompt-add"
					>
						Add Starting Balance
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
