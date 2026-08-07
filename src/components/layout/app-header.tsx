import { SidebarExpandButton } from '@/components/layout/sidebar-nav';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { UserMenu } from '@/components/layout/user-menu';

interface AppHeaderProps {
	showSidebarExpand?: boolean;
	onExpandSidebar?: () => void;
}

export function AppHeader({ showSidebarExpand = false, onExpandSidebar }: AppHeaderProps) {
	return (
		<header
			className="sticky top-0 z-30 border-b border-border/15 bg-header/90 backdrop-blur-md supports-backdrop-filter:bg-header/75"
			aria-label="App toolbar"
		>
			<div className="flex h-14 w-full items-center justify-between gap-2 px-5 md:px-6">
				<div className="flex min-w-0 items-center">
					{showSidebarExpand && onExpandSidebar ? (
						<SidebarExpandButton onExpand={onExpandSidebar} />
					) : null}
				</div>
				<div className="flex shrink-0 items-center gap-1">
					<ThemeToggle />
					<UserMenu />
				</div>
			</div>
		</header>
	);
}
