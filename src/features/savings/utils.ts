import {
	formatDisplayDate,
	formatMoney,
	toDateInputValue,
} from '@/features/transactions/utils';
import type { Saving, SavingTransaction } from '@/features/savings/types';

export { formatDisplayDate, formatMoney, toDateInputValue };

export function displaySavingBalance(saving: Saving, preferredCurrency: string) {
	const amount = saving.currentAmountPreferred ?? saving.currentAmount;
	const currency =
		saving.currentAmountPreferred != null ? preferredCurrency : saving.currency;
	return formatMoney(amount, currency);
}

export function hasSavingBalance(saving: Saving) {
	return (saving.currentAmountPreferred ?? saving.currentAmount) > 0;
}

export function transactionDisplayAmount(
	item: SavingTransaction,
	preferredCurrency: string,
) {
	const amount = Math.abs(item.amountPreferred ?? item.amount);
	const currency = item.amountPreferred != null ? preferredCurrency : item.currency;
	return formatMoney(amount, currency);
}

export function isSavingOutflow(item: SavingTransaction) {
	return item.source === 'withdrawal';
}

export function savingTransactionKindLabel(item: SavingTransaction) {
	if (item.source === 'starting_balance') return 'Starting Balance';
	if (item.source === 'withdrawal') return 'Move to Spendable';
	if (item.source === 'return') return 'Return';
	if (item.source === 'contribution') return 'Add Money';
	return 'Add Money';
}
