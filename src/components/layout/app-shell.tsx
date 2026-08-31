import { Outlet } from 'react-router-dom';

import { AppHeader } from '@/components/layout/app-header';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useSidebarCollapsed } from '@/components/layout/use-sidebar-collapsed';
import { cn } from '@/lib/utils';

export function AppShell() {
	const [collapsed, setCollapsed] = useSidebarCollapsed();

	return (
		<div className="min-h-svh bg-background text-foreground md:bg-sidebar">
			<SidebarNav collapsed={collapsed} onCollapsedChange={setCollapsed} />
			<div
				className={cn(
					'min-w-0 bg-background transition-[padding] duration-300 ease-in-out md:bg-transparent',
					collapsed ? 'md:pl-16' : 'md:pl-64',
				)}
			>
				<div className="md:p-3">
					<AppHeader />
					<main
						className={cn(
							'min-h-[calc(100svh-3.5rem)] w-full px-5 pb-24 pt-6',
							'md:min-h-[calc(100svh-1.5rem)] md:rounded-[2rem] md:bg-background md:px-6 md:pb-8 md:pt-6',
						)}
					>
						<div className="w-full max-w-[1400px]">
							<Outlet />
						</div>
					</main>
				</div>
			</div>
			<MobileBottomNav />
		</div>
	);
}
