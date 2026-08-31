import { useState, type ComponentType } from 'react';
import { ChevronsLeft, ChevronsRight, LogOut, Plus } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

import { useAppSelector } from '@/app/hooks';
import { BrandMark } from '@/components/brand/brand-mark';
import { LogoutConfirmDialog } from '@/components/layout/logout-confirm-dialog';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ACCOUNT_NAV_ITEMS, ADMIN_NAV_ITEMS, NAV_ITEMS } from '@/config/navigation';
import { selectUser } from '@/features/auth/authSlice';
import { getUserRole } from '@/features/auth/utils';
import { userInitials } from '@/features/settings/utils';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
	collapsed: boolean;
	onCollapsedChange: (collapsed: boolean) => void;
}

function navClassName(isActive: boolean, collapsed: boolean) {
	return cn(
		'flex items-center rounded-xl text-sm font-medium transition-colors',
		collapsed ? 'size-10 shrink-0 justify-center' : 'gap-3 px-3 py-2.5',
		isActive
			? collapsed
				? 'bg-primary/15 text-primary'
				: 'nav-active-fill text-primary'
			: 'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
	);
}

function SidebarNavLink({
	to,
	icon: Icon,
	title,
	collapsed,
	testId,
}: {
	to: string;
	icon: ComponentType<{ className?: string }>;
	title: string;
	collapsed: boolean;
	testId?: string;
}) {
	const link = (
		<NavLink
			to={to}
			aria-label={collapsed ? title : undefined}
			className={({ isActive }) => navClassName(isActive, collapsed)}
			data-testid={testId}
		>
			<Icon className="size-4 shrink-0" aria-hidden="true" />
			<span className={cn('truncate', collapsed && 'hidden')}>{title}</span>
		</NavLink>
	);

	if (!collapsed) return link;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="inline-flex">{link}</span>
			</TooltipTrigger>
			<TooltipContent side="right" sideOffset={8}>
				{title}
			</TooltipContent>
		</Tooltip>
	);
}

export function SidebarNav({ collapsed, onCollapsedChange }: SidebarNavProps) {
	const user = useAppSelector(selectUser);
	const isAdmin = getUserRole(user) === 'admin';
	const navItems = isAdmin ? ADMIN_NAV_ITEMS : NAV_ITEMS;
	const [logoutOpen, setLogoutOpen] = useState(false);

	return (
		<>
			<aside
				className={cn(
					'fixed inset-y-0 left-0 z-40 hidden flex-col overflow-x-hidden bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-in-out md:flex',
					collapsed ? 'w-16' : 'w-64',
				)}
				aria-label="Main navigation"
				data-collapsed={collapsed ? 'true' : 'false'}
			>
				<div
					className={cn(
						'flex pt-4',
						collapsed ? 'justify-center px-2 pb-7' : 'items-center gap-2 px-3 pb-7',
					)}
				>
					{collapsed ? (
						<button
							type="button"
							className="group relative shrink-0"
							onClick={() => onCollapsedChange(false)}
							aria-label="Show sidebar"
							data-testid="sidebar-expand-toggle"
						>
							<span className="group-hover:invisible">
								<BrandMark showWordmark={false} />
							</span>
							<span className="absolute inset-0 hidden items-center justify-center group-hover:flex">
								<span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
									<ChevronsRight className="size-5" aria-hidden="true" />
								</span>
							</span>
						</button>
					) : (
						<>
							<div className="min-w-0 flex-1">
								<BrandMark />
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="shrink-0 text-muted-foreground"
								onClick={() => onCollapsedChange(true)}
								aria-label="Hide sidebar"
								data-testid="sidebar-collapse-toggle"
							>
								<ChevronsLeft className="size-4" />
							</Button>
						</>
					)}
				</div>

				{!isAdmin ? (
					<div className={cn(collapsed ? 'flex justify-center px-2 pb-4' : 'px-3 pb-5')}>
						{collapsed ? (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button asChild size="icon" data-testid="add-transaction-sidebar">
										<Link to="/transactions?add=1" aria-label="Add transaction">
											<Plus className="size-4" />
										</Link>
									</Button>
								</TooltipTrigger>
								<TooltipContent side="right" sideOffset={8}>
									Add transaction
								</TooltipContent>
							</Tooltip>
						) : (
							<Button asChild className="w-full justify-start gap-2" data-testid="add-transaction-sidebar">
								<Link to="/transactions?add=1">
									<Plus className="size-4" />
									Add transaction
								</Link>
							</Button>
						)}
					</div>
				) : null}

				<nav
					className={cn(
						'min-h-0 flex-1 overflow-y-auto pt-1 pb-3 scrollbar-hidden',
						collapsed ? 'flex flex-col items-center gap-3 px-2' : 'space-y-0.5 px-3',
					)}
				>
					{navItems.map((item) => (
						<SidebarNavLink
							key={item.href}
							to={item.href}
							icon={item.icon}
							title={item.title}
							collapsed={collapsed}
						/>
					))}
				</nav>

				<div
					className={cn(
						'shrink-0 pt-2 pb-3',
						collapsed ? 'flex flex-col items-center gap-3 px-2' : 'space-y-0.5 px-3',
					)}
				>
					<nav
						className={cn(collapsed ? 'flex flex-col items-center gap-3' : 'space-y-0.5')}
						aria-label="Account"
					>
						{ACCOUNT_NAV_ITEMS.map((item) => (
							<SidebarNavLink
								key={item.href}
								to={item.href}
								icon={item.icon}
								title={item.title}
								collapsed={collapsed}
								testId={item.href === '/profile' ? 'sidebar-profile' : 'sidebar-change-password'}
							/>
						))}
					</nav>
					{collapsed ? (
						<div className="flex justify-center">
							<ThemeToggle />
						</div>
					) : (
						<ThemeToggle
							variant="row"
							className="rounded-xl px-3 py-2.5 font-medium hover:bg-sidebar-accent/70"
						/>
					)}
					{collapsed ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className="mx-auto flex items-center justify-center rounded-full"
									onClick={() => setLogoutOpen(true)}
									aria-label="Log out"
									data-testid="sidebar-logout"
								>
									<Avatar className="size-9">
										{user?.avatarUrl ? (
											<AvatarImage src={user.avatarUrl} alt="" className="object-cover" />
										) : null}
										<AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
											{userInitials(user?.name)}
										</AvatarFallback>
									</Avatar>
								</button>
							</TooltipTrigger>
							<TooltipContent side="right" sideOffset={8}>
								Log out
							</TooltipContent>
						</Tooltip>
					) : (
						<div className="mt-2 flex items-center gap-3 px-2 py-2">
							<Avatar className="size-9">
								{user?.avatarUrl ? (
									<AvatarImage src={user.avatarUrl} alt={user.name} className="object-cover" />
								) : null}
								<AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
									{userInitials(user?.name)}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{user?.name ?? 'Account'}</p>
								<p className="truncate text-xs text-muted-foreground">{user?.email}</p>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="shrink-0 text-muted-foreground"
								onClick={() => setLogoutOpen(true)}
								aria-label="Log out"
								data-testid="sidebar-logout"
							>
								<LogOut className="size-4" />
							</Button>
						</div>
					)}
				</div>
			</aside>
			<LogoutConfirmDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
		</>
	);
}
