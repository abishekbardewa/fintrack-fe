import { KeyRound, LogOut, UserRound } from 'lucide-react';
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
			<DropdownMenuContent align="end" className="w-64">
				<DropdownMenuLabel className="p-0 font-normal text-foreground">
					<div className="flex items-center gap-3 px-2.5 py-2">
						<Avatar className="size-9">
							<AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
								{userInitials(user?.name)}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">{user?.name ?? 'Account'}</p>
							<p className="truncate text-xs text-muted-foreground">{user?.email}</p>
						</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild data-testid="user-menu-profile">
					<Link to="/profile">
						<UserRound />
						Profile
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild data-testid="user-menu-change-password">
					<Link to="/change-password">
						<KeyRound />
						Change password
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
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
