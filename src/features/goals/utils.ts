import {
	formatDisplayDate,
	formatMoney,
	toDateInputValue,
} from '@/features/transactions/utils';
import type {
	GoalContribution,
	SavingsGoal,
	SavingsGoalStatus,
} from '@/features/goals/types';

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

export function hasMovableBalance(goal: SavingsGoal) {
	return (goal.currentAmountPreferred ?? goal.currentAmount) > 0;
}

export function contributionDisplayAmount(
	item: GoalContribution,
	preferredCurrency: string,
) {
	const amount = Math.abs(item.amountPreferred ?? item.amount);
	const currency = item.amountPreferred != null ? preferredCurrency : item.currency;
	return formatMoney(amount, currency);
}

export function isContributionOutflow(item: GoalContribution) {
	return item.source === 'goal_spend' || item.source === 'return_to_available';
}

export function contributionKindLabel(item: GoalContribution) {
	if (item.source === 'goal_spend') return 'Spend from Goal';
	if (item.source === 'return_to_available') return 'Move to Spendable';
	if (item.source === 'starting_balance') return 'Starting Balance';
	return 'Add Money';
}

export function contributionNote(item: GoalContribution) {
	if (item.source === 'goal_spend') {
		return item.description?.trim() || item.note?.trim() || '';
	}
	return item.note?.trim() || '';
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
