import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Banknote, Briefcase, Info, Landmark, PiggyBank, Target, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import {
	Popover,
	PopoverArrow,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import type { DashboardSummary } from '@/features/dashboard/types';
import { formatMoney } from '@/features/transactions/utils';
import { cn } from '@/lib/utils';

interface DashboardMoneyHeroProps {
	summary: DashboardSummary;
	currency: string;
	startingBalanceSet?: boolean;
	onUpdateStartingBalance?: () => void;
}

function MoneyHeroCard({
	label,
	tooltip,
	amount,
	currency,
	icon: Icon,
	surface,
	testId,
	action,
	negativeAsExpense,
	emptyLabel,
	href,
}: {
	label: string;
	tooltip: string;
	amount: number;
	currency: string;
	icon: LucideIcon;
	surface: string;
	testId: string;
	action?: ReactNode;
	negativeAsExpense?: boolean;
	emptyLabel?: string;
	href?: string;
}) {
	const amountClass = cn(
		'text-2xl font-semibold tracking-tight tabular-nums',
		emptyLabel
			? 'text-current/70'
			: negativeAsExpense && amount < 0
				? 'text-expense'
				: 'text-current',
	);
	const amountText = emptyLabel ?? formatMoney(amount, currency);
	const amountNode = href ? (
		<Link to={href} className={cn(amountClass, 'hover:underline')} aria-label={`View ${label}`}>
			{amountText}
		</Link>
	) : (
		<p className={amountClass}>{amountText}</p>
	);
	return (
		<article
			className={cn('relative overflow-hidden rounded-2xl p-4 shadow-sm', surface)}
			data-testid={testId}
		>
			<Icon
				className="pointer-events-none absolute -right-3 -bottom-3 size-24 rotate-12 text-current opacity-15"
				aria-hidden="true"
				strokeWidth={1.25}
			/>
			<div className="relative z-10">
				<div className="flex items-center gap-1">
					<p className="text-xs font-medium tracking-wide uppercase text-current/80">
						{label}
					</p>
					<Popover>
						<PopoverTrigger asChild>
							<button
								type="button"
								className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-current/70 hover:text-current data-[state=open]:text-current"
								aria-label={`About ${label}`}
							>
								<Info className="size-3.5" aria-hidden="true" />
							</button>
						</PopoverTrigger>
						<PopoverContent
							side="top"
							align="center"
							sideOffset={8}
							className="w-auto max-w-[17.5rem] rounded-lg border-0 bg-[#1c2430] px-3 py-2.5 text-xs font-medium leading-snug text-white shadow-md dark:bg-white dark:text-[#1c2430]"
						>
							{tooltip}
							<PopoverArrow className="fill-[#1c2430] dark:fill-white" />
						</PopoverContent>
					</Popover>
				</div>
				<div className="mt-2 flex items-center gap-2">
					{amountNode}
					{action}
				</div>
			</div>
		</article>
	);
}

export function DashboardMoneyHero({
	summary,
	currency,
	startingBalanceSet = true,
	onUpdateStartingBalance,
}: DashboardMoneyHeroProps) {
	const startingBalance = summary.startingBalance ?? summary.openingBalance ?? 0;
	const spendable = summary.spendable ?? summary.available ?? 0;
	const financialPosition = summary.financialPosition ?? summary.balance ?? 0;

	const cards: Array<{
		key: string;
		label: string;
		tooltip: string;
		amount: number;
		icon: LucideIcon;
		surface: string;
		emptyLabel?: string;
		action?: ReactNode;
		negativeAsExpense?: boolean;
		href?: string;
	}> = [
		{
			key: 'starting-balance',
			label: 'Starting Balance',
			tooltip: 'Money you had when you started using Fintracker.',
			amount: startingBalance,
			icon: PiggyBank,
			surface: 'bg-primary text-primary-foreground',
			emptyLabel: startingBalanceSet ? undefined : 'Not set',
			action: onUpdateStartingBalance ? (
				<Badge
					asChild
					variant="outline"
					className="border-current/35 bg-current/10 px-2 py-0 text-[10px] font-medium text-current hover:bg-current/20"
				>
					<button
						type="button"
						onClick={onUpdateStartingBalance}
						data-testid={
							startingBalanceSet
								? 'dashboard-update-starting-balance'
								: 'dashboard-add-starting-balance'
						}
					>
						{startingBalanceSet ? 'Update' : 'Add Starting Balance'}
					</button>
				</Badge>
			) : undefined,
		},
		{
			key: 'spendable',
			label: 'Spendable Money',
			tooltip: 'Money available to spend.',
			amount: spendable,
			icon: Wallet,
			surface: 'bg-income/15 text-foreground',
			negativeAsExpense: true,
		},
		{
			key: 'in-savings',
			label: 'Savings',
			tooltip: 'Money set aside for later.',
			amount: summary.inSavings ?? 0,
			icon: Landmark,
			surface: 'bg-muted text-foreground',
			negativeAsExpense: true,
			href: '/savings',
		},
		{
			key: 'in-goals',
			label: 'Allocated to Goals',
			tooltip: 'Money currently in your goals.',
			amount: summary.inGoals ?? 0,
			icon: Target,
			surface: 'bg-secondary text-secondary-foreground',
			negativeAsExpense: true,
			href: '/goals',
		},
		{
			key: 'in-investments',
			label: 'Investments',
			tooltip: 'Money currently in your investments.',
			amount: summary.inInvestments ?? 0,
			icon: Briefcase,
			surface: 'bg-primary/10 text-foreground',
			negativeAsExpense: true,
			href: '/investments',
		},
		{
			key: 'financial-position',
			label: 'Overall Position',
			tooltip: 'Spendable, Savings, Goals, and Investments combined.',
			amount: financialPosition,
			icon: Banknote,
			surface: 'bg-accent text-accent-foreground',
			negativeAsExpense: true,
		},
	];

	return (
		<section
			className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
			aria-label="Balances"
			data-testid="dashboard-money-hero"
		>
			{cards.map((card) => (
				<MoneyHeroCard
					key={card.key}
					label={card.label}
					tooltip={card.tooltip}
					amount={card.amount}
					currency={currency}
					icon={card.icon}
					surface={card.surface}
					testId={`dashboard-snapshot-${card.key}`}
					action={card.action}
					negativeAsExpense={card.negativeAsExpense}
					emptyLabel={card.emptyLabel}
					href={card.href}
				/>
			))}
		</section>
	);
}
