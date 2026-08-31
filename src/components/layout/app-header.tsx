import { Link } from 'react-router-dom';

import { BrandMark } from '@/components/brand/brand-mark';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { UserMenu } from '@/components/layout/user-menu';

export function AppHeader() {
	return (
		<header
			className="sticky top-0 z-30 border-b border-border/15 bg-header/90 backdrop-blur-md supports-backdrop-filter:bg-header/75 md:hidden"
			aria-label="App toolbar"
		>
			<div className="flex h-14 w-full items-center justify-between gap-2 px-5">
				<div className="flex min-w-0 items-center gap-2">
					<Link to="/" aria-label="FinTrack home">
						<BrandMark size="sm" />
					</Link>
				</div>
				<div className="flex shrink-0 items-center gap-1">
					<ThemeToggle />
					<UserMenu />
				</div>
			</div>
		</header>
	);
}
