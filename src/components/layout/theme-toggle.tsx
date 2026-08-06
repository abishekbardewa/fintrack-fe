import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function useIsClient() {
	return useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);
}

interface ThemeToggleProps {
	variant?: 'icon' | 'row';
	className?: string;
}

export function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
	const { resolvedTheme, setTheme } = useTheme();
	const mounted = useIsClient();
	const isDark = resolvedTheme === 'dark';

	const toggle = () => setTheme(isDark ? 'light' : 'dark');

	if (!mounted) {
		return variant === 'row' ? (
			<div className={cn('h-9 w-full', className)} aria-hidden="true" />
		) : (
			<div className={cn('size-9', className)} aria-hidden="true" />
		);
	}

	if (variant === 'row') {
		return (
			<button
				type="button"
				onClick={toggle}
				className={cn(
					'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
					className,
				)}
			>
				{isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
				{isDark ? 'Light mode' : 'Dark mode'}
			</button>
		);
	}

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			onClick={toggle}
			className={className}
			aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
		>
			{isDark ? <Sun /> : <Moon />}
		</Button>
	);
}
