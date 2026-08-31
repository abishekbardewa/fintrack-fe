import {
	formatDisplayDate,
	formatMoney,
	toDateInputValue,
} from '@/features/transactions/utils';
import type {
	SavingsCircle,
	SavingsCircleFrequency,
	SavingsCircleTransaction,
} from '@/features/savings-circles/types';

export { formatDisplayDate, formatMoney, toDateInputValue };

export function displayPendingPayout(circle: SavingsCircle, preferredCurrency: string) {
	const amount = circle.pendingPayoutPreferred ?? circle.pendingPayout ?? 0;
	const currency = circle.pendingPayoutPreferred != null ? preferredCurrency : circle.currency;
	return formatMoney(amount, currency);
}

export function hasPendingPayout(circle: SavingsCircle) {
	return (circle.pendingPayoutPreferred ?? circle.pendingPayout ?? 0) > 0;
}

export function pendingPayoutAmount(circle: SavingsCircle) {
	return circle.pendingPayoutPreferred ?? circle.pendingPayout ?? 0;
}

export function transactionDisplayAmount(
	item: SavingsCircleTransaction,
	preferredCurrency: string,
) {
	const amount = Math.abs(item.amountPreferred ?? item.amount);
	const currency = item.amountPreferred != null ? preferredCurrency : item.currency;
	return formatMoney(amount, currency);
}

export function isCircleOutflow(item: SavingsCircleTransaction) {
	return item.source === 'payout_to_spendable';
}

export function circleTransactionKindLabel(item: SavingsCircleTransaction) {
	if (item.source === 'payout_to_spendable') return 'Move to Spendable';
	if (item.source === 'payout') return 'Payout';
	return 'Contribution';
}

export function frequencyLabel(frequency: SavingsCircleFrequency) {
	if (frequency === 'weekly') return 'Weekly';
	if (frequency === 'yearly') return 'Yearly';
	return 'Monthly';
}

export function statusLabel(status: SavingsCircle['status']) {
	return status === 'completed' ? 'Completed' : 'Active';
}
