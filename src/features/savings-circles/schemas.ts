import { z } from 'zod';

const positiveAmountString = (label: string) =>
	z
		.string()
		.trim()
		.min(1, `${label} is required`)
		.refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, `Enter a positive ${label.toLowerCase()}`);

export const savingsCircleFormSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, 'Name is required')
			.max(50, 'Name must be at most 50 characters'),
		contributionAmount: positiveAmountString('Contribution amount'),
		frequency: z.enum(['weekly', 'monthly', 'yearly']),
		memberCount: z
			.string()
			.trim()
			.min(1, 'Number of members is required')
			.refine((v) => {
				const n = Number(v);
				return Number.isInteger(n) && n >= 2;
			}, 'Enter at least 2 members'),
		startDate: z.string().min(1, 'Start date is required'),
		expectedPayout: z.string(),
		notes: z.string().max(500, 'Note must be at most 500 characters'),
	})
	.superRefine((values, ctx) => {
		const trimmed = values.expectedPayout.trim();
		if (!trimmed) return;
		const amount = Number(trimmed);
		if (Number.isNaN(amount) || amount <= 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['expectedPayout'],
				message: 'Enter a positive amount',
			});
		}
	});

export type SavingsCircleFormValues = z.infer<typeof savingsCircleFormSchema>;

export function savingsCircleFieldErrors(
	values: unknown,
): Partial<Record<keyof SavingsCircleFormValues, string>> {
	const result = savingsCircleFormSchema.safeParse(values);
	if (result.success) return {};
	const errors: Partial<Record<keyof SavingsCircleFormValues, string>> = {};
	for (const issue of result.error.issues) {
		const key = issue.path[0] as keyof SavingsCircleFormValues;
		if (key && errors[key] === undefined) errors[key] = issue.message;
	}
	return errors;
}

export const savingsCircleMovementFormSchema = z.object({
	amount: z
		.string()
		.trim()
		.min(1, 'Amount is required')
		.refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Enter a positive amount'),
	date: z.string(),
	note: z.string().max(500, 'Note must be at most 500 characters'),
});

export type SavingsCircleMovementFormValues = z.infer<typeof savingsCircleMovementFormSchema>;

export function savingsCircleMovementFieldErrors(
	values: unknown,
): Partial<Record<keyof SavingsCircleMovementFormValues, string>> {
	const result = savingsCircleMovementFormSchema.safeParse(values);
	if (result.success) return {};
	const errors: Partial<Record<keyof SavingsCircleMovementFormValues, string>> = {};
	for (const issue of result.error.issues) {
		const key = issue.path[0] as keyof SavingsCircleMovementFormValues;
		if (key && errors[key] === undefined) errors[key] = issue.message;
	}
	return errors;
}
