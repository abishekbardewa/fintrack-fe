import { Badge } from '@/components/ui/badge';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { useDashboardChartColors } from '@/features/dashboard/hooks/use-dashboard-chart-colors';
import type { DashboardCategoryBreakdownRow } from '@/features/dashboard/types';
import { formatMoney } from '@/features/transactions/utils';

interface DashboardCategoryBreakdownDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	items: DashboardCategoryBreakdownRow[];
	totalSpent: number;
	currency: string;
	periodLabel: string;
}

export function DashboardCategoryBreakdownDialog({
	open,
	onOpenChange,
	items,
	totalSpent,
	currency,
	periodLabel,
}: DashboardCategoryBreakdownDialogProps) {
	const colors = useDashboardChartColors();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[min(36rem,85vh)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
				<DialogHeader className="shrink-0 border-b border-border px-6 py-5 pr-12 text-left">
					<DialogTitle>Breakdown</DialogTitle>
					<DialogDescription>Spending in {periodLabel}.</DialogDescription>
				</DialogHeader>

				<div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
					{items.length === 0 ? (
						<p className="py-6 text-center text-sm text-muted-foreground">No spending this period.</p>
					) : (
						<div className="space-y-3" data-testid="dashboard-category-breakdown-list">
							<div className="flex items-center justify-between gap-3 rounded-xl border border-expense/25 bg-expense/10 px-3 py-3 shadow-xs">
								<span className="text-sm font-medium text-expense">Total spent</span>
								<span className="text-sm font-semibold tabular-nums text-expense">
									{formatMoney(totalSpent, currency)}
								</span>
							</div>

							<ul className="space-y-3">
								{items.map((row, index) => {
									const key = row.categoryId ?? `other-${index}`;
									const dot = colors.category[index % colors.category.length];
									const hasSubs = row.subcategories.length > 0;

									return (
										<li
											key={key}
											className="rounded-xl border border-border/60 bg-muted/35 px-3 py-3 shadow-xs"
										>
											<div className="flex flex-wrap items-center justify-between gap-2">
												<span className="flex min-w-0 items-center gap-2">
													<span
														className="size-2.5 shrink-0 rounded-full"
														style={{ backgroundColor: dot }}
														aria-hidden="true"
													/>
													<Badge
														variant="secondary"
														className="max-w-full truncate px-2.5 py-0.5"
													>
														{row.name}
													</Badge>
												</span>
												<Badge
													variant="outline"
													className="gap-1.5 border-primary/25 bg-primary/5 px-2.5 py-0.5 font-medium"
												>
													<span className="tabular-nums text-foreground">
														Total: {formatMoney(row.amount, currency)}
													</span>
													<span className="text-muted-foreground/70" aria-hidden="true">
														·
													</span>
													<span className="tabular-nums text-primary">{row.percent}%</span>
												</Badge>
											</div>

											{hasSubs ? (
												<ul className="mt-2.5 space-y-1.5 border-l-2 border-border/50 pl-3 ml-1">
													{row.subcategories.map((sub, subIndex) => (
														<li
															key={sub.subcategoryId ?? `direct-${key}-${subIndex}`}
															className="flex items-center justify-between gap-3"
														>
															<span className="flex min-w-0 items-center gap-2">
																<span
																	className="size-1.5 shrink-0 rounded-full bg-muted-foreground/50"
																	aria-hidden="true"
																/>
																<span className="truncate text-xs text-foreground">
																	{sub.name?.trim() || row.name}
																</span>
															</span>
															<span className="shrink-0 text-xs tabular-nums">
																<span className="text-foreground">
																	{formatMoney(sub.amount, currency)}
																</span>
																<span className="mx-1 text-muted-foreground/70">·</span>
																<span className="text-muted-foreground">{sub.percent}%</span>
															</span>
														</li>
													))}
												</ul>
											) : null}
										</li>
									);
								})}
							</ul>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
