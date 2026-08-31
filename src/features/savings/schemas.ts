import { z } from 'zod';

export const savingFormSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, 'Name is required')
			.max(50, 'Name must be at most 50 characters'),
		notes: z.string().max(500, 'Note must be at most 500 characters'),
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

export type SavingFormValues = z.infer<typeof savingFormSchema>;

export function savingFieldErrors(
	values: unknown,
): Partial<Record<keyof SavingFormValues, string>> {
	const result = savingFormSchema.safeParse(values);
	if (result.success) return {};
	const errors: Partial<Record<keyof SavingFormValues, string>> = {};
	for (const issue of result.error.issues) {
		const key = issue.path[0] as keyof SavingFormValues;
		if (key && errors[key] === undefined) errors[key] = issue.message;
	}
	return errors;
}

export const savingMovementFormSchema = z.object({
	amount: z
		.string()
		.trim()
		.min(1, 'Amount is required')
		.refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Enter a positive amount'),
	date: z.string(),
	note: z.string().max(500, 'Note must be at most 500 characters'),
});

export type SavingMovementFormValues = z.infer<typeof savingMovementFormSchema>;

export function savingMovementFieldErrors(
	values: unknown,
): Partial<Record<keyof SavingMovementFormValues, string>> {
	const result = savingMovementFormSchema.safeParse(values);
	if (result.success) return {};
	const errors: Partial<Record<keyof SavingMovementFormValues, string>> = {};
	for (const issue of result.error.issues) {
		const key = issue.path[0] as keyof SavingMovementFormValues;
		if (key && errors[key] === undefined) errors[key] = issue.message;
	}
	return errors;
}
