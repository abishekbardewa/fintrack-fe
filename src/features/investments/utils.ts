import {
	formatDisplayDate,
	formatMoney,
	toDateInputValue,
} from '@/features/transactions/utils';
import type { Investment, InvestmentStatus, InvestmentTransaction } from '@/features/investments/types';

export { formatDisplayDate, formatMoney, toDateInputValue };

export function displayInvestmentBalance(investment: Investment, preferredCurrency: string) {
	const amount = investment.currentBalancePreferred ?? investment.currentBalance;
	const currency =
		investment.currentBalancePreferred != null ? preferredCurrency : investment.currency;
	return formatMoney(amount, currency);
}

export function hasInvestmentBalance(investment: Investment) {
	return (investment.currentBalancePreferred ?? investment.currentBalance) > 0;
}

export function transactionDisplayAmount(
	item: InvestmentTransaction,
	preferredCurrency: string,
) {
	const amount = Math.abs(item.amountPreferred ?? item.amount);
	const currency = item.amountPreferred != null ? preferredCurrency : item.currency;
	return formatMoney(amount, currency);
}

export function isInvestmentOutflow(item: InvestmentTransaction) {
	return item.source === 'withdrawal' || item.source === 'loss';
}

export function investmentTransactionKindLabel(item: InvestmentTransaction) {
	if (item.source === 'starting_balance') return 'Starting Balance';
	if (item.source === 'withdrawal') return 'Move to Spendable';
	if (item.source === 'return') return 'Return';
	if (item.source === 'loss') return 'Record Loss';
	return 'Add Money';
}

export function statusLabel(status: InvestmentStatus) {
	return status === 'closed' ? 'Closed' : 'Active';
}
