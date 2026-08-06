import type { LucideIcon } from 'lucide-react';
import {
	Activity,
	FolderTree,
	Receipt,
	Sparkles,
	Target,
	TrendingUp,
	Wallet,
} from 'lucide-react';

export interface NavItem {
	title: string;
	href: string;
	icon: LucideIcon;
	primary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
	{ title: 'Pulse', href: '/pulse', icon: Activity, primary: true },
	{ title: 'Transactions', href: '/transactions', icon: Receipt, primary: true },
	{ title: 'Budgets', href: '/budgets', icon: Wallet, primary: true },
	{ title: 'Goals', href: '/goals', icon: Target, primary: true },
	{ title: 'Categories', href: '/categories', icon: FolderTree },
	{ title: 'Trends', href: '/trends', icon: TrendingUp },
	{ title: 'Reviews', href: '/reviews', icon: Sparkles },
];

export const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter((item) => item.primary);
export const SECONDARY_NAV_ITEMS = NAV_ITEMS.filter((item) => !item.primary);
