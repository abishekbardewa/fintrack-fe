import { ChevronsLeft, ChevronsRight, Plus } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

import { BrandMark } from '@/components/brand/brand-mark';
import { Button } from '@/components/ui/button';
import { NAV_ITEMS } from '@/config/navigation';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
	collapsed: boolean;
	onCollapsedChange: (collapsed: boolean) => void;
}

export function SidebarNav({ collapsed, onCollapsedChange }: SidebarNavProps) {
	return (
		<aside
			className={cn(
				'fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out md:flex',
				collapsed ? '-translate-x-full pointer-events-none' : 'translate-x-0',
			)}
			aria-label="Main navigation"
			aria-hidden={collapsed}
			data-collapsed={collapsed ? 'true' : 'false'}
		>
			<div className="flex items-center gap-2 px-3 pt-4 pb-7">
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
			</div>

			<div className="px-3 pb-5">
				<Button asChild className="w-full justify-start gap-2" data-testid="add-transaction-sidebar">
					<Link to="/transactions?add=1">
						<Plus className="size-4" />
						Add transaction
					</Link>
				</Button>
			</div>

			<nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pt-1 pb-3 scrollbar-hidden">
				{NAV_ITEMS.map((item) => {
					const Icon = item.icon;
					return (
						<NavLink
							key={item.href}
							to={item.href}
							tabIndex={collapsed ? -1 : undefined}
							className={({ isActive }) =>
								cn(
									'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
									isActive
										? 'nav-active-fill text-primary'
										: 'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
								)
							}
						>
							<Icon className="size-4 shrink-0" aria-hidden="true" />
							<span className="truncate">{item.title}</span>
						</NavLink>
					);
				})}
			</nav>
		</aside>
	);
}

interface SidebarExpandButtonProps {
	onExpand: () => void;
}

export function SidebarExpandButton({ onExpand }: SidebarExpandButtonProps) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			className="hidden shrink-0 text-muted-foreground md:inline-flex"
			onClick={onExpand}
			aria-label="Show sidebar"
			data-testid="sidebar-expand-toggle"
		>
			<ChevronsRight className="size-4" />
		</Button>
	);
}
