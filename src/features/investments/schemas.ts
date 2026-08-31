import { z } from 'zod';

export const investmentFormSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, 'Name is required')
			.max(50, 'Name must be at most 50 characters'),
		notes: z.string().max(500, 'Note must be at most 500 characters'),
		startDate: z.string(),
		startingAmount: z.string(),
	})
	.superRefine((values, ctx) => {
		const trimmed = values.startingAmount.trim();
		if (!trimmed) return;
		const amount = Number(trimmed);
		if (Number.isNaN(amount) || amount <= 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['startingAmount'],
				message: 'Enter a positive amount',
			});
		}
	});

export type InvestmentFormValues = z.infer<typeof investmentFormSchema>;

export function investmentFieldErrors(
	values: unknown,
): Partial<Record<keyof InvestmentFormValues, string>> {
	const result = investmentFormSchema.safeParse(values);
	if (result.success) return {};
	const errors: Partial<Record<keyof InvestmentFormValues, string>> = {};
	for (const issue of result.error.issues) {
		const key = issue.path[0] as keyof InvestmentFormValues;
		if (key && errors[key] === undefined) errors[key] = issue.message;
	}
	return errors;
}

export const investmentMovementFormSchema = z.object({
	amount: z
		.string()
		.trim()
		.min(1, 'Amount is required')
		.refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Enter a positive amount'),
	date: z.string(),
	note: z.string().max(500, 'Note must be at most 500 characters'),
});

export type InvestmentMovementFormValues = z.infer<typeof investmentMovementFormSchema>;

export function investmentMovementFieldErrors(
	values: unknown,
): Partial<Record<keyof InvestmentMovementFormValues, string>> {
	const result = investmentMovementFormSchema.safeParse(values);
	if (result.success) return {};
	const errors: Partial<Record<keyof InvestmentMovementFormValues, string>> = {};
	for (const issue of result.error.issues) {
		const key = issue.path[0] as keyof InvestmentMovementFormValues;
		if (key && errors[key] === undefined) errors[key] = issue.message;
	}
	return errors;
}
