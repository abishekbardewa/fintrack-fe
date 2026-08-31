import { useState } from 'react';
import { KeyRound, LogOut, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAppSelector } from '@/app/hooks';
import { LogoutConfirmDialog } from '@/components/layout/logout-confirm-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { selectUser } from '@/features/auth/authSlice';
import { userInitials } from '@/features/settings/utils';

export function UserMenu() {
	const user = useAppSelector(selectUser);
	const [logoutOpen, setLogoutOpen] = useState(false);

	return (
		<>
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
							{user?.avatarUrl ? (
								<AvatarImage src={user.avatarUrl} alt={user.name} className="object-cover" />
							) : null}
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
								{user?.avatarUrl ? (
									<AvatarImage src={user.avatarUrl} alt={user.name} className="object-cover" />
								) : null}
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
						onClick={() => setLogoutOpen(true)}
						data-testid="logout-button"
					>
						<LogOut />
						Log out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<LogoutConfirmDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
		</>
	);
}
