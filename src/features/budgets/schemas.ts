import { z } from 'zod';

export const OVERALL_BUDGET_VALUE = '__overall__';

export const budgetFormSchema = z.object({
	target: z.string().min(1, 'Select what this budget is for'),
	limitAmount: z
		.string()
		.trim()
		.min(1, 'Limit is required')
		.refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Enter a positive amount'),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export function budgetFieldErrors(
	values: unknown,
): Partial<Record<keyof BudgetFormValues, string>> {
	const result = budgetFormSchema.safeParse(values);
	if (result.success) return {};
	const errors: Partial<Record<keyof BudgetFormValues, string>> = {};
	for (const issue of result.error.issues) {
		const key = issue.path[0] as keyof BudgetFormValues;
		if (key && errors[key] === undefined) errors[key] = issue.message;
	}
	return errors;
}
