import { z } from 'zod';

const optionalPositiveAmount = z
	.string()
	.trim()
	.refine(
		(v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) > 0),
		'Enter a positive amount',
	);

export const goalFormSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Name is required')
		.max(50, 'Name must be at most 50 characters'),
	targetAmount: z
		.string()
		.trim()
		.min(1, 'Target amount is required')
		.refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Enter a positive amount'),
	targetDate: z.string(),
	initialAmount: optionalPositiveAmount,
	initialDate: z.string(),
});

export type GoalFormValues = z.infer<typeof goalFormSchema>;

export function goalFieldErrors(
	values: unknown,
): Partial<Record<keyof GoalFormValues, string>> {
	const result = goalFormSchema.safeParse(values);
	if (result.success) return {};
	const errors: Partial<Record<keyof GoalFormValues, string>> = {};
	for (const issue of result.error.issues) {
		const key = issue.path[0] as keyof GoalFormValues;
		if (key && errors[key] === undefined) errors[key] = issue.message;
	}
	return errors;
}

export const contributionFormSchema = z.object({
	amount: z
		.string()
		.trim()
		.min(1, 'Amount is required')
		.refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Enter a positive amount'),
	date: z.string().min(1, 'Date is required'),
	note: z.string().max(500, 'Note must be at most 500 characters'),
});

export type ContributionFormValues = z.infer<typeof contributionFormSchema>;

export function contributionFieldErrors(
	values: unknown,
): Partial<Record<keyof ContributionFormValues, string>> {
	const result = contributionFormSchema.safeParse(values);
	if (result.success) return {};
	const errors: Partial<Record<keyof ContributionFormValues, string>> = {};
	for (const issue of result.error.issues) {
		const key = issue.path[0] as keyof ContributionFormValues;
		if (key && errors[key] === undefined) errors[key] = issue.message;
	}
	return errors;
}
