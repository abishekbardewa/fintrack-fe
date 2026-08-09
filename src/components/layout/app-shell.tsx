import { Outlet } from 'react-router-dom';

import { AppHeader } from '@/components/layout/app-header';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useSidebarCollapsed } from '@/components/layout/use-sidebar-collapsed';
import { cn } from '@/lib/utils';

export function AppShell() {
	const [collapsed, setCollapsed] = useSidebarCollapsed();

	return (
		<div className="min-h-svh bg-background text-foreground">
			<SidebarNav collapsed={collapsed} onCollapsedChange={setCollapsed} />
			<div
				className={cn(
					'min-w-0 bg-background transition-[padding] duration-300 ease-in-out',
					collapsed ? 'md:pl-0' : 'md:pl-64',
				)}
			>
				<AppHeader
					showSidebarExpand={collapsed}
					onExpandSidebar={() => setCollapsed(false)}
				/>
				<main className="min-h-[calc(100svh-3.5rem)] w-full max-w-[1400px] px-5 pb-24 pt-6 md:px-6 md:pb-8 md:pt-8">
					<Outlet />
				</main>
			</div>
			<MobileBottomNav />
		</div>
	);
}
