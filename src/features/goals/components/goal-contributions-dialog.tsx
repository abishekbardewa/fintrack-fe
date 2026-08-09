import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
	useContributionsQuery,
	useDeleteContributionMutation,
} from '@/features/goals/hooks/use-goals';
import type { SavingsGoal } from '@/features/goals/types';
import { formatDisplayDate, formatMoney } from '@/features/goals/utils';
import { getErrorMessage } from '@/lib/api/errors';

interface GoalContributionsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	goal: SavingsGoal | null;
	preferredCurrency: string;
}

export function GoalContributionsDialog({
	open,
	onOpenChange,
	goal,
	preferredCurrency,
}: GoalContributionsDialogProps) {
	const goalId = open && goal ? goal.id : null;
	const { data, isLoading, isError, refetch } = useContributionsQuery(goalId);
	const deleteMutation = useDeleteContributionMutation();

	const handleDelete = async (contributionId: string) => {
		if (!goal) return;
		try {
			await deleteMutation.mutateAsync({ goalId: goal.id, contributionId });
			toast.success('Contribution deleted');
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not delete contribution.'));
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Contributions</DialogTitle>
					<DialogDescription>
						{goal ? `History for “${goal.name}”.` : 'Contribution history.'}
					</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="space-y-2 py-2">
						<Skeleton className="h-12 w-full rounded-xl" />
						<Skeleton className="h-12 w-full rounded-xl" />
					</div>
				) : null}

				{isError ? (
					<div className="py-4 text-center">
						<p className="text-sm text-muted-foreground">Could not load contributions.</p>
						<Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void refetch()}>
							Retry
						</Button>
					</div>
				) : null}

				{!isLoading && !isError && (data?.contributions.length ?? 0) === 0 ? (
					<p className="py-6 text-center text-sm text-muted-foreground">
						No contributions yet.
					</p>
				) : null}

				{!isLoading && !isError && (data?.contributions.length ?? 0) > 0 ? (
					<ul className="max-h-80 divide-y divide-border overflow-y-auto rounded-xl border border-border/60">
						{data!.contributions.map((item) => {
							const amount = item.amountPreferred ?? item.amount;
							const currency =
								item.amountPreferred != null ? preferredCurrency : item.currency;
							const canDelete = item.source === 'manual';

							return (
								<li
									key={item.id}
									className="flex items-center gap-3 px-3 py-2.5"
									data-testid={`contribution-row-${item.id}`}
								>
									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium tabular-nums text-foreground">
											{formatMoney(amount, currency)}
										</p>
										<p className="text-xs text-muted-foreground">
											{formatDisplayDate(item.date)}
											{item.note ? ` · ${item.note}` : ''}
										</p>
									</div>
									{canDelete ? (
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											disabled={deleteMutation.isPending}
											aria-label="Delete contribution"
											onClick={() => void handleDelete(item.id)}
										>
											{deleteMutation.isPending ? (
												<Loader2 className="animate-spin" />
											) : (
												<Trash2 />
											)}
										</Button>
									) : null}
								</li>
							);
						})}
					</ul>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
