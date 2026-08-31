import type { LucideIcon } from 'lucide-react';
import {
	ArrowLeftRight,
	Briefcase,
	FolderTree,
	KeyRound,
	LayoutDashboard,
	PiggyBank,
	Receipt,
	Sparkles,
	Target,
	TrendingUp,
	UserRound,
	Users,
	Wallet,
} from 'lucide-react';

export interface NavItem {
	title: string;
	href: string;
	icon: LucideIcon;
	primary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
	{ title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, primary: true },
	{ title: 'Transactions', href: '/transactions', icon: Receipt, primary: true },
	{ title: 'Budgets', href: '/budgets', icon: Wallet, primary: true },
	{ title: 'Goals', href: '/goals', icon: Target, primary: true },
	{ title: 'Savings', href: '/savings', icon: PiggyBank },
	{ title: 'Circles', href: '/circles', icon: Users },
	{ title: 'Investments', href: '/investments', icon: Briefcase },
	{ title: 'Categories', href: '/categories', icon: FolderTree },
	{ title: 'Trends', href: '/trends', icon: TrendingUp },
	{ title: 'AI Review', href: '/reviews', icon: Sparkles },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
	{ title: 'Exchange rates', href: '/admin/exchange-rates', icon: ArrowLeftRight, primary: true },
];

export const ACCOUNT_NAV_ITEMS: NavItem[] = [
	{ title: 'Profile', href: '/profile', icon: UserRound },
	{ title: 'Change password', href: '/change-password', icon: KeyRound },
];

export const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter((item) => item.primary);
export const SECONDARY_NAV_ITEMS = NAV_ITEMS.filter((item) => !item.primary);
