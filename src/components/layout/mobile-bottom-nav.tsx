import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { useAppSelector } from '@/app/hooks';
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import { ADMIN_NAV_ITEMS, PRIMARY_NAV_ITEMS, SECONDARY_NAV_ITEMS } from '@/config/navigation';
import { selectUser } from '@/features/auth/authSlice';
import { getUserRole } from '@/features/auth/utils';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
	const user = useAppSelector(selectUser);
	const isAdmin = getUserRole(user) === 'admin';
	const [moreOpen, setMoreOpen] = useState(false);

	if (isAdmin) {
		return (
			<nav
				className="fixed inset-x-0 bottom-0 z-40 border-t border-border/15 bg-header/95 backdrop-blur supports-backdrop-filter:bg-header/80 md:hidden"
				aria-label="Primary navigation"
				style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
			>
				<div className="flex h-16 items-stretch justify-around px-1">
					{ADMIN_NAV_ITEMS.map((item) => {
						const Icon = item.icon;
						return (
							<NavLink
								key={item.href}
								to={item.href}
								className={({ isActive }) =>
									cn(
										'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors',
										isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
									)
								}
							>
								{({ isActive }) => (
									<>
										<span
											className={cn(
												'flex size-8 items-center justify-center rounded-full',
												isActive && 'bg-primary/15',
											)}
										>
											<Icon className="size-5" aria-hidden="true" />
										</span>
										<span className="truncate">{item.title}</span>
									</>
								)}
							</NavLink>
						);
					})}
				</div>
			</nav>
		);
	}

	return (
		<nav
			className="fixed inset-x-0 bottom-0 z-40 border-t border-border/15 bg-header/95 backdrop-blur supports-backdrop-filter:bg-header/80 md:hidden"
			aria-label="Primary navigation"
			style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
		>
			<div className="flex h-16 items-stretch justify-around px-1">
				{PRIMARY_NAV_ITEMS.map((item) => {
					const Icon = item.icon;
					return (
						<NavLink
							key={item.href}
							to={item.href}
							className={({ isActive }) =>
								cn(
									'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors',
									isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
								)
							}
						>
							{({ isActive }) => (
								<>
									<span
										className={cn(
											'flex size-8 items-center justify-center rounded-full',
											isActive && 'bg-primary/15',
										)}
									>
										<Icon className="size-5" aria-hidden="true" />
									</span>
									<span className="truncate">{item.title}</span>
								</>
							)}
						</NavLink>
					);
				})}

				<Sheet open={moreOpen} onOpenChange={setMoreOpen}>
					<SheetTrigger asChild>
						<button
							type="button"
							className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
							aria-label="More navigation"
							data-testid="mobile-more-nav"
						>
							<span className="flex size-8 items-center justify-center rounded-full">
								<Menu className="size-5" aria-hidden="true" />
							</span>
							<span>More</span>
						</button>
					</SheetTrigger>
					<SheetContent side="bottom" showCloseButton={false} className="rounded-t-xl pb-8">
						<SheetHeader className="sr-only">
							<SheetTitle>More</SheetTitle>
							<SheetDescription>Categories, trends, and other destinations.</SheetDescription>
						</SheetHeader>
						<div className="grid gap-1 px-4 pt-2">
							{SECONDARY_NAV_ITEMS.map((item) => {
								const Icon = item.icon;
								return (
									<NavLink
										key={item.href}
										to={item.href}
										onClick={() => setMoreOpen(false)}
										className={({ isActive }) =>
											cn(
												'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
												isActive ? 'nav-active-fill text-primary' : 'hover:bg-muted',
											)
										}
									>
										<Icon className="size-4" aria-hidden="true" />
										{item.title}
									</NavLink>
								);
							})}
							<SheetClose asChild>
								<button
									type="button"
									className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-muted"
								>
									<X className="size-4" aria-hidden="true" />
									Close
								</button>
							</SheetClose>
						</div>
					</SheetContent>
				</Sheet>
			</div>
		</nav>
	);
}
