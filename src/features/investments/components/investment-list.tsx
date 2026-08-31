import { Link } from 'react-router-dom';
import {
	ArrowLeftRight,
	Ban,
	Briefcase,
	History,
	MoreHorizontal,
	Pencil,
	Plus,
	Trash2,
	TrendingDown,
	TrendingUp,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Investment } from '@/features/investments/types';
import {
	displayInvestmentBalance,
	formatDisplayDate,
	formatMoney,
	statusLabel,
} from '@/features/investments/utils';
import { cn } from '@/lib/utils';

interface InvestmentListProps {
	investments: Investment[];
	preferredCurrency: string;
	onContribute: (investment: Investment) => void;
	onWithdraw: (investment: Investment) => void;
	onAddReturn: (investment: Investment) => void;
	onRecordLoss: (investment: Investment) => void;
	onClose: (investment: Investment) => void;
	onEdit: (investment: Investment) => void;
	onDelete: (investment: Investment) => void;
}

export function InvestmentList({
	investments,
	preferredCurrency,
	onContribute,
	onWithdraw,
	onAddReturn,
	onRecordLoss,
	onClose,
	onEdit,
	onDelete,
}: InvestmentListProps) {
	return (
		<div
			className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
			data-testid="investment-list"
		>
			{investments.map((investment) => (
				<InvestmentCard
					key={investment.id}
					investment={investment}
					preferredCurrency={preferredCurrency}
					onContribute={() => onContribute(investment)}
					onWithdraw={() => onWithdraw(investment)}
					onAddReturn={() => onAddReturn(investment)}
					onRecordLoss={() => onRecordLoss(investment)}
					onClose={() => onClose(investment)}
					onEdit={() => onEdit(investment)}
					onDelete={() => onDelete(investment)}
				/>
			))}
		</div>
	);
}

interface InvestmentCardProps {
	investment: Investment;
	preferredCurrency: string;
	onContribute: () => void;
	onWithdraw: () => void;
	onAddReturn: () => void;
	onRecordLoss: () => void;
	onClose: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

function InvestmentCard({
	investment,
	preferredCurrency,
	onContribute,
	onWithdraw,
	onAddReturn,
	onRecordLoss,
	onClose,
	onEdit,
	onDelete,
}: InvestmentCardProps) {
	const balance = investment.currentBalancePreferred ?? investment.currentBalance;
	const isActive = investment.status === 'active';
	const closedAmount = investment.closedAmount ?? 0;

	return (
		<article
			className={cn(
				'relative flex flex-col overflow-hidden rounded-3xl bg-muted shadow-sm',
				!isActive && 'opacity-80',
			)}
			data-testid={`investment-card-${investment.id}`}
		>
			<Briefcase
				className="pointer-events-none absolute -right-4 -bottom-4 size-36 rotate-12 text-primary/15"
				aria-hidden="true"
				strokeWidth={1.25}
			/>

			<div className="relative z-10 flex items-start gap-3 px-5 pt-5 pb-3">
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="truncate text-sm font-semibold text-foreground">{investment.name}</h3>
						<Badge
							variant="outline"
							className={cn(
								'font-medium',
								isActive
									? 'border-primary/30 bg-primary/10 text-primary'
									: 'border-border bg-background text-muted-foreground',
							)}
						>
							{statusLabel(investment.status)}
						</Badge>
					</div>
					<p className="mt-1 truncate text-xs text-muted-foreground">
						{investment.startDate
							? `Started ${formatDisplayDate(investment.startDate)}`
							: investment.notes || 'No notes'}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-0.5">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								asChild
								data-testid={`investment-history-${investment.id}`}
							>
								<Link to={`/investments/${investment.id}`} aria-label="View history">
									<History />
								</Link>
							</Button>
						</TooltipTrigger>
						<TooltipContent sideOffset={6}>View history</TooltipContent>
					</Tooltip>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label="Investment actions"
							>
								<MoreHorizontal />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{isActive ? (
								<>
									<DropdownMenuItem onClick={onEdit}>
										<Pencil />
										Edit
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={onAddReturn}
										data-testid={`investment-return-${investment.id}`}
									>
										<TrendingUp />
										Add Return
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={onRecordLoss}
										data-testid={`investment-loss-${investment.id}`}
									>
										<TrendingDown />
										Record Loss
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={onClose}
										data-testid={`investment-close-${investment.id}`}
									>
										<Ban />
										Close Investment
									</DropdownMenuItem>
									<DropdownMenuSeparator />
								</>
							) : null}
							<DropdownMenuItem variant="destructive" onClick={onDelete}>
								<Trash2 />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="relative z-10 flex flex-1 flex-col gap-3 px-5 pb-5">
				<p
					className={cn(
						'text-3xl font-bold tracking-tight tabular-nums',
						balance < 0 ? 'text-expense' : 'text-foreground',
					)}
				>
					{isActive
						? displayInvestmentBalance(investment, preferredCurrency)
						: formatMoney(closedAmount, investment.currency)}
				</p>
				<p className="text-xs text-muted-foreground">
					{isActive ? 'Current balance' : 'Moved to Spendable'}
				</p>

				{isActive ? (
					<div className="mt-auto grid grid-cols-2 gap-2">
						<Button
							type="button"
							size="sm"
							className="w-full"
							onClick={onContribute}
							data-testid={`investment-contribute-${investment.id}`}
						>
							<Plus className="size-3.5" />
							Add Money
						</Button>
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="w-full"
							onClick={onWithdraw}
							data-testid={`investment-withdraw-${investment.id}`}
						>
							<ArrowLeftRight className="size-3.5" />
							Move to Spendable
						</Button>
					</div>
				) : null}
			</div>
		</article>
	);
}
