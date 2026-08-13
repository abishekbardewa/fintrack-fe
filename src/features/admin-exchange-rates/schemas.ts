import { z } from 'zod';

const rateValueSchema = z.coerce.number().positive('Must be greater than 0');

export const exchangeRateFormSchema = z
	.object({
		date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'),
		notes: z.string().max(500, 'Max 500 characters').optional(),
		rates: z.record(z.string(), z.string()).default({}),
		requireAllRates: z.boolean().default(false),
		rateCodes: z.array(z.string()).default([]),
	})
	.superRefine((values, ctx) => {
		const entries = values.rateCodes.map((code) => ({
			code,
			raw: values.rates[code]?.trim() ?? '',
		}));
		const filled = entries.filter((e) => e.raw !== '');
		const anyFilled = filled.length > 0;

		if (!anyFilled && !values.requireAllRates) return;

		if (values.requireAllRates || anyFilled) {
			for (const entry of entries) {
				if (!entry.raw) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Required',
						path: ['rates', entry.code],
					});
					continue;
				}
				const parsed = rateValueSchema.safeParse(entry.raw);
				if (!parsed.success) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: parsed.error.issues[0]?.message ?? 'Invalid rate',
						path: ['rates', entry.code],
					});
				}
			}
		}
	});

export type ExchangeRateFormValues = z.infer<typeof exchangeRateFormSchema>;

export function parseRateMap(
	rates: Record<string, string>,
	codes: string[],
): Record<string, number> | undefined {
	const out: Record<string, number> = {};
	for (const code of codes) {
		const raw = rates[code]?.trim();
		if (!raw) continue;
		out[code] = Number(raw);
	}
	return Object.keys(out).length > 0 ? out : undefined;
}

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
