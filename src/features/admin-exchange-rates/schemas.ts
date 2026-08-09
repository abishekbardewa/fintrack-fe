import { z } from 'zod';

const rateValueSchema = z.coerce.number().positive('Must be greater than 0');

export const exchangeRateFormSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'),
	notes: z.string().max(500, 'Max 500 characters').optional(),
	rates: z.record(z.string(), rateValueSchema).refine((rates) => Object.keys(rates).length > 0, {
		message: 'Enter at least one rate',
	}),
});

export type ExchangeRateFormValues = z.infer<typeof exchangeRateFormSchema>;

export function fieldErrorsFromSchema<T extends z.ZodType>(
	schema: T,
	values: unknown,
): Partial<Record<string, string>> {
	const result = schema.safeParse(values);
	if (result.success) return {};

	const errors: Partial<Record<string, string>> = {};
	for (const issue of result.error.issues) {
		const key = issue.path.join('.') || 'form';
		if (errors[key] === undefined) {
			errors[key] = issue.message;
		}
	}
	return errors;
}
