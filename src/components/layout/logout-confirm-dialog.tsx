import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@/app/hooks';
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
import { clearUser } from '@/features/auth/authSlice';

interface LogoutConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function LogoutConfirmDialog({ open, onOpenChange }: LogoutConfirmDialogProps) {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const handleConfirm = () => {
		dispatch(clearUser());
		navigate('/login', { replace: true });
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Log out?</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription>Are you sure you want to log out?</AlertDialogDescription>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={(e) => {
							e.preventDefault();
							handleConfirm();
						}}
						data-testid="logout-confirm"
					>
						Log out
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
