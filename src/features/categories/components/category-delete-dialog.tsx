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

interface CategoryDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	categoryName: string;
	isSub?: boolean;
	pending?: boolean;
	onConfirm: () => void;
}

export function CategoryDeleteDialog({
	open,
	onOpenChange,
	categoryName,
	isSub = false,
	pending = false,
	onConfirm,
}: CategoryDeleteDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{isSub ? 'Delete subcategory?' : 'Delete category?'}
					</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription asChild>
					<ConfirmCopy
						lead={
							<>
								Are you sure you want to delete <ConfirmHighlight>{categoryName}</ConfirmHighlight>?
							</>
						}
						body={
							isSub
								? 'The subcategory will be permanently deleted. Existing transactions will not be deleted.'
								: 'The category will be permanently deleted. This is only possible if it has no transactions or subcategories.'
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
						data-testid="category-delete-confirm"
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
