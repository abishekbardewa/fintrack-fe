import {
	formatDisplayDate,
	formatMoney,
	toDateInputValue,
} from '@/features/transactions/utils';
import type { SavingsGoal, SavingsGoalStatus } from '@/features/goals/types';

export { formatDisplayDate, formatMoney, toDateInputValue };

export function displayTarget(goal: SavingsGoal, preferredCurrency: string) {
	const amount = goal.targetAmountPreferred ?? goal.targetAmount;
	const currency =
		goal.targetAmountPreferred != null ? preferredCurrency : goal.currency;
	return formatMoney(amount, currency);
}

export function displayCurrent(goal: SavingsGoal, preferredCurrency: string) {
	const amount = goal.currentAmountPreferred ?? goal.currentAmount;
	const currency =
		goal.currentAmountPreferred != null ? preferredCurrency : goal.currency;
	return formatMoney(amount, currency);
}

export function displayRemaining(goal: SavingsGoal) {
	return formatMoney(goal.remaining, goal.currency);
}

export function statusLabel(status: SavingsGoalStatus) {
	switch (status) {
		case 'active':
			return 'Active';
		case 'completed':
			return 'Completed';
		case 'cancelled':
			return 'Cancelled';
	}
}
