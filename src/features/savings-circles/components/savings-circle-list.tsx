import { Link } from 'react-router-dom';
import {
	ArrowLeftRight,
	CheckCircle2,
	History,
	MoreHorizontal,
	Pencil,
	Plus,
	Trash2,
	TrendingUp,
	Users,
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
import type { SavingsCircle } from '@/features/savings-circles/types';
import {
	displayPendingPayout,
	formatDisplayDate,
	formatMoney,
	frequencyLabel,
	hasPendingPayout,
} from '@/features/savings-circles/utils';

interface SavingsCircleListProps {
	circles: SavingsCircle[];
	preferredCurrency: string;
	onContribute: (circle: SavingsCircle) => void;
	onRecordPayout: (circle: SavingsCircle) => void;
	onMovePayout: (circle: SavingsCircle) => void;
	onComplete: (circle: SavingsCircle) => void;
	onEdit: (circle: SavingsCircle) => void;
	onDelete: (circle: SavingsCircle) => void;
}

export function SavingsCircleList({
	circles,
	preferredCurrency,
	onContribute,
	onRecordPayout,
	onMovePayout,
	onComplete,
	onEdit,
	onDelete,
}: SavingsCircleListProps) {
	return (
		<div
			className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
			data-testid="circle-list"
		>
			{circles.map((circle) => (
				<CircleCard
					key={circle.id}
					circle={circle}
					preferredCurrency={preferredCurrency}
					onContribute={() => onContribute(circle)}
					onRecordPayout={() => onRecordPayout(circle)}
					onMovePayout={() => onMovePayout(circle)}
					onComplete={() => onComplete(circle)}
					onEdit={() => onEdit(circle)}
					onDelete={() => onDelete(circle)}
				/>
			))}
		</div>
	);
}

interface CircleCardProps {
	circle: SavingsCircle;
	preferredCurrency: string;
	onContribute: () => void;
	onRecordPayout: () => void;
	onMovePayout: () => void;
	onComplete: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

function CircleCard({
	circle,
	preferredCurrency,
	onContribute,
	onRecordPayout,
	onMovePayout,
	onComplete,
	onEdit,
	onDelete,
}: CircleCardProps) {
	const completed = circle.status === 'completed';
	const payoutPending = hasPendingPayout(circle);
	const payout = displayPendingPayout(circle, preferredCurrency);
	const expected = formatMoney(circle.expectedPayout, circle.currency);

	return (
		<article
			className="relative flex flex-col overflow-hidden rounded-3xl bg-primary/10 shadow-sm ring-1 ring-primary/20"
			data-testid={`circle-card-${circle.id}`}
		>
			<Users
				className="pointer-events-none absolute -right-4 -bottom-4 size-36 rotate-12 text-primary/20"
				aria-hidden="true"
				strokeWidth={1.25}
			/>

			<div className="relative z-10 flex items-start gap-3 px-5 pt-5 pb-3">
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="truncate text-sm font-semibold text-foreground">{circle.name}</h3>
						<Badge variant={completed ? 'secondary' : 'default'} className="shrink-0">
							{completed ? 'Completed' : 'Active'}
						</Badge>
					</div>
					<p className="mt-1 truncate text-xs text-muted-foreground">
						{frequencyLabel(circle.frequency)} · {circle.memberCount} members
						{circle.startDate ? ` · ${formatDisplayDate(circle.startDate)}` : ''}
					</p>
					{circle.notes ? (
						<p className="mt-1 truncate text-xs text-muted-foreground">{circle.notes}</p>
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
								data-testid={`circle-history-${circle.id}`}
							>
								<Link to={`/circles/${circle.id}`} aria-label="View history">
									<History />
								</Link>
							</Button>
						</TooltipTrigger>
						<TooltipContent sideOffset={6}>View history</TooltipContent>
					</Tooltip>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button type="button" variant="ghost" size="icon-sm" aria-label="Circle actions">
								<MoreHorizontal />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{completed ? null : (
								<>
									<DropdownMenuItem onClick={onEdit}>
										<Pencil />
										Edit
									</DropdownMenuItem>
									<DropdownMenuItem onClick={onComplete}>
										<CheckCircle2 />
										Complete Circle
									</DropdownMenuItem>
									<DropdownMenuSeparator />
								</>
							)}
							<DropdownMenuItem variant="destructive" onClick={onDelete}>
								<Trash2 />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="relative z-10 flex flex-1 flex-col gap-3 px-5 pb-5">
				{completed && payoutPending ? (
					<div
						className="rounded-2xl bg-background/80 px-4 py-3 ring-1 ring-primary/30"
						data-testid={`circle-pending-banner-${circle.id}`}
					>
						<p className="text-xs font-semibold tracking-wide text-primary uppercase">
							Payout pending
						</p>
						<p className="mt-1 text-sm text-foreground">
							<span className="font-semibold tabular-nums">{payout}</span> is ready to be moved
							to Spendable.
						</p>
						<Button
							type="button"
							size="sm"
							className="mt-3 w-full"
							onClick={onMovePayout}
							data-testid={`circle-move-payout-${circle.id}`}
						>
							<ArrowLeftRight className="size-3.5" />
							Move to Spendable
						</Button>
					</div>
				) : (
					<>
						<p className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
							{payoutPending ? payout : expected}
						</p>
						<p className="text-xs text-muted-foreground">
							{payoutPending ? 'Pending payout' : 'Expected payout'}
						</p>
						<p className="text-xs text-muted-foreground">
							Contribution {formatMoney(circle.contributionAmount, circle.currency)}
						</p>
					</>
				)}

				{completed ? null : (
					<div className="mt-auto grid grid-cols-2 gap-2">
						<Button
							type="button"
							size="sm"
							className="w-full"
							onClick={onContribute}
							data-testid={`circle-contribute-${circle.id}`}
						>
							<Plus className="size-3.5" />
							Add Contribution
						</Button>
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="w-full"
							onClick={onRecordPayout}
							data-testid={`circle-payout-${circle.id}`}
						>
							<TrendingUp className="size-3.5" />
							Record Payout
						</Button>
					</div>
				)}

				{completed || !payoutPending ? null : (
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="w-full"
						onClick={onMovePayout}
					>
						<ArrowLeftRight className="size-3.5" />
						Move to Spendable
					</Button>
				)}
			</div>
		</article>
	);
}
