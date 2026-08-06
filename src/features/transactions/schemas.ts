import { z } from 'zod';

import { SUPPORTED_CURRENCIES } from '@/lib/currencies';

const currencyCodes = SUPPORTED_CURRENCIES.map((c) => c.code) as [string, ...string[]];

export const transactionFormSchema = z.object({
	type: z.enum(['expense', 'income']),
	amount: z.coerce
		.number({ error: 'Amount is required' })
		.positive('Amount must be greater than 0'),
	currency: z.enum(currencyCodes, { message: 'Select a currency' }),
	categoryId: z.string().min(1, 'Select a category'),
	subcategoryId: z.string().optional(),
	description: z
		.string()
		.trim()
		.max(500, 'Description must be at most 500 characters')
		.optional()
		.or(z.literal('')),
	date: z.string().min(1, 'Date is required'),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export function transactionFieldErrors(
	values: unknown,
): Partial<Record<keyof TransactionFormValues, string>> {
	const result = transactionFormSchema.safeParse(values);
	if (result.success) return {};

	const errors: Partial<Record<keyof TransactionFormValues, string>> = {};
	for (const issue of result.error.issues) {
		const key = issue.path[0] as keyof TransactionFormValues | undefined;
		if (key !== undefined && errors[key] === undefined) {
			errors[key] = issue.message;
		}
	}
	return errors;
}
