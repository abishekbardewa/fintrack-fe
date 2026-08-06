import { LogOut, Settings, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { clearUser, selectUser } from '@/features/auth/authSlice';
import { userInitials } from '@/features/settings/utils';

export function UserMenu() {
	const user = useAppSelector(selectUser);
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const handleLogout = () => {
		dispatch(clearUser());
		navigate('/login', { replace: true });
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="rounded-full"
					aria-label="Account menu"
					data-testid="user-menu-trigger"
				>
					<Avatar className="size-8">
						<AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
							{userInitials(user?.name)}
						</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="font-normal">
					<div className="flex items-center gap-2">
						<UserRound className="size-4 shrink-0 text-muted-foreground" />
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">{user?.name ?? 'Account'}</p>
							<p className="truncate text-xs text-muted-foreground">{user?.email}</p>
						</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild data-testid="user-menu-settings">
					<Link to="/settings">
						<Settings />
						Settings
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem
					variant="destructive"
					onClick={handleLogout}
					data-testid="logout-button"
				>
					<LogOut />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
