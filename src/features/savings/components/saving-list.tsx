import { Link } from 'react-router-dom';
import { ArrowLeftRight, History, Landmark, MoreHorizontal, Pencil, Plus, Trash2, TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Saving } from '@/features/savings/types';
import { displaySavingBalance } from '@/features/savings/utils';
import { cn } from '@/lib/utils';

interface SavingListProps {
	savings: Saving[];
	preferredCurrency: string;
	onContribute: (saving: Saving) => void;
	onWithdraw: (saving: Saving) => void;
	onAddReturn: (saving: Saving) => void;
	onEdit: (saving: Saving) => void;
	onDelete: (saving: Saving) => void;
}

export function SavingList({
	savings,
	preferredCurrency,
	onContribute,
	onWithdraw,
	onAddReturn,
	onEdit,
	onDelete,
}: SavingListProps) {
	return (
		<div
			className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
			data-testid="saving-list"
		>
			{savings.map((saving) => (
				<SavingCard
					key={saving.id}
					saving={saving}
					preferredCurrency={preferredCurrency}
					onContribute={() => onContribute(saving)}
					onWithdraw={() => onWithdraw(saving)}
					onAddReturn={() => onAddReturn(saving)}
					onEdit={() => onEdit(saving)}
					onDelete={() => onDelete(saving)}
				/>
			))}
		</div>
	);
}

interface SavingCardProps {
	saving: Saving;
	preferredCurrency: string;
	onContribute: () => void;
	onWithdraw: () => void;
	onAddReturn: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

function SavingCard({
	saving,
	preferredCurrency,
	onContribute,
	onWithdraw,
	onAddReturn,
	onEdit,
	onDelete,
}: SavingCardProps) {
	const balance = saving.currentAmountPreferred ?? saving.currentAmount;

	return (
		<article
			className="relative flex flex-col overflow-hidden rounded-3xl bg-muted shadow-sm"
			data-testid={`saving-card-${saving.id}`}
		>
			<Landmark
				className="pointer-events-none absolute -right-4 -bottom-4 size-36 rotate-12 text-primary/15"
				aria-hidden="true"
				strokeWidth={1.25}
			/>

			<div className="relative z-10 flex items-start gap-3 px-5 pt-5 pb-3">
				<div className="min-w-0 flex-1">
					<h3 className="truncate text-sm font-semibold text-foreground">{saving.name}</h3>
					{saving.notes ? (
						<p className="mt-1 truncate text-xs text-muted-foreground">{saving.notes}</p>
					) : (
						<p className="mt-1 text-xs text-muted-foreground">No notes</p>
					)}
				</div>
				<div className="flex shrink-0 items-center gap-0.5">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								asChild
								data-testid={`saving-history-${saving.id}`}
							>
								<Link to={`/savings/${saving.id}`} aria-label="View history">
									<History />
								</Link>
							</Button>
						</TooltipTrigger>
						<TooltipContent sideOffset={6}>View history</TooltipContent>
					</Tooltip>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button type="button" variant="ghost" size="icon-sm" aria-label="Savings actions">
								<MoreHorizontal />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={onEdit}>
								<Pencil />
								Edit
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={onAddReturn}
								data-testid={`saving-return-${saving.id}`}
							>
								<TrendingUp />
								Add Return
							</DropdownMenuItem>
							<DropdownMenuSeparator />
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
					{displaySavingBalance(saving, preferredCurrency)}
				</p>
				<p className="text-xs text-muted-foreground">Current balance</p>

				<div className="mt-auto grid grid-cols-2 gap-2">
					<Button
						type="button"
						size="sm"
						className="w-full"
						onClick={onContribute}
						data-testid={`saving-contribute-${saving.id}`}
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
						data-testid={`saving-withdraw-${saving.id}`}
					>
						<ArrowLeftRight className="size-3.5" />
						Move to Spendable
					</Button>
				</div>
			</div>
		</article>
	);
}
