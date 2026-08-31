import { z } from 'zod';

export const goalFormSchema = z
	.object({
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

export const contributeFormSchema = z.object({
	amount: z
		.string()
		.trim()
		.min(1, 'Amount is required')
		.refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Enter a positive amount'),
	note: z.string().max(500, 'Note must be at most 500 characters'),
});

export type ContributeFormValues = z.infer<typeof contributeFormSchema>;

export function contributeFieldErrors(
	values: unknown,
): Partial<Record<keyof ContributeFormValues, string>> {
	const result = contributeFormSchema.safeParse(values);
	if (result.success) return {};
	const errors: Partial<Record<keyof ContributeFormValues, string>> = {};
	for (const issue of result.error.issues) {
		const key = issue.path[0] as keyof ContributeFormValues;
		if (key && errors[key] === undefined) errors[key] = issue.message;
	}
	return errors;
}

export const spendFromGoalFormSchema = z.object({
	amount: z
		.string()
		.trim()
		.min(1, 'Amount is required')
		.refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Enter a positive amount'),
	categoryId: z.string().min(1, 'Select a category'),
	subcategoryId: z.string(),
	description: z.string().max(500, 'Note must be at most 500 characters'),
	date: z.string().min(1, 'Date is required'),
});

export type SpendFromGoalFormValues = z.infer<typeof spendFromGoalFormSchema>;

export function spendFromGoalFieldErrors(
	values: unknown,
): Partial<Record<keyof SpendFromGoalFormValues, string>> {
	const result = spendFromGoalFormSchema.safeParse(values);
	if (result.success) return {};
	const errors: Partial<Record<keyof SpendFromGoalFormValues, string>> = {};
	for (const issue of result.error.issues) {
		const key = issue.path[0] as keyof SpendFromGoalFormValues;
		if (key && errors[key] === undefined) errors[key] = issue.message;
	}
	return errors;
}

const optionalReturnAmount = z
	.string()
	.trim()
	.min(1, 'Amount is required')
	.refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Enter a positive amount');

export const returnToAvailableFormSchema = z.object({
	amount: optionalReturnAmount,
});

export type ReturnToAvailableFormValues = z.infer<typeof returnToAvailableFormSchema>;

export function returnToAvailableFieldErrors(
	values: unknown,
): Partial<Record<keyof ReturnToAvailableFormValues, string>> {
	const result = returnToAvailableFormSchema.safeParse(values);
	if (result.success) return {};
	const errors: Partial<Record<keyof ReturnToAvailableFormValues, string>> = {};
	for (const issue of result.error.issues) {
		const key = issue.path[0] as keyof ReturnToAvailableFormValues;
		if (key && errors[key] === undefined) errors[key] = issue.message;
	}
	return errors;
}

export const increaseTargetFormSchema = z.object({
	targetAmount: z
		.string()
		.trim()
		.min(1, 'Target amount is required')
		.refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Enter a positive amount'),
});

export type IncreaseTargetFormValues = z.infer<typeof increaseTargetFormSchema>;

export function increaseTargetFieldErrors(
	values: unknown,
): Partial<Record<keyof IncreaseTargetFormValues, string>> {
	const result = increaseTargetFormSchema.safeParse(values);
	if (result.success) return {};
	const errors: Partial<Record<keyof IncreaseTargetFormValues, string>> = {};
	for (const issue of result.error.issues) {
		const key = issue.path[0] as keyof IncreaseTargetFormValues;
		if (key && errors[key] === undefined) errors[key] = issue.message;
	}
	return errors;
}
