import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type GoalMoneyTone = 'goal' | 'target' | 'available';

const TONE_CLASS: Record<GoalMoneyTone, string> = {
	goal: 'border-primary/30 bg-primary/10 text-primary',
	target: 'border-border bg-muted text-foreground',
	available: 'border-income/30 bg-income/10 text-income',
};

interface GoalMoneyBadgeProps {
	label: string;
	value: string;
	tone: GoalMoneyTone;
	amount?: number;
}

export function GoalMoneyBadge({ label, value, tone, amount }: GoalMoneyBadgeProps) {
	return (
		<Badge
			variant="outline"
			className={cn(
				'h-auto gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium',
				TONE_CLASS[tone],
			)}
		>
			<span className="font-medium text-current/80">{label}</span>
			<span
				className={cn(
					'font-semibold tabular-nums',
					amount != null && amount < 0 && 'text-expense',
				)}
			>
				{value}
			</span>
		</Badge>
	);
}
