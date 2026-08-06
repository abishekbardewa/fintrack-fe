import { z } from 'zod';

import { SUPPORTED_CURRENCIES } from '@/lib/currencies';

export const passwordSchema = z
	.string()
	.min(1, 'Password is required')
	.min(8, 'Password must be at least 8 characters')
	.max(30, 'Password must be at most 30 characters')
	.regex(/[a-z]/, 'Include at least one lowercase letter')
	.regex(/[A-Z]/, 'Include at least one uppercase letter')
	.regex(/[0-9]/, 'Include at least one number')
	.regex(/[^A-Za-z0-9]/, 'Include at least one special character');

const currencyCodes = SUPPORTED_CURRENCIES.map((c) => c.code) as [string, ...string[]];

export const loginSchema = z.object({
	email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
	password: passwordSchema,
});

export const registerSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Name is required')
		.min(3, 'Name must be at least 3 characters')
		.max(30, 'Name must be at most 30 characters'),
	email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
	password: passwordSchema,
	currency: z.enum(currencyCodes, { message: 'Select a currency' }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

export function zodFieldErrors<T extends z.ZodType>(
	schema: T,
	values: unknown,
): Partial<Record<keyof z.infer<T>, string>> {
	const result = schema.safeParse(values);
	if (result.success) return {};

	const errors: Partial<Record<keyof z.infer<T>, string>> = {};
	for (const issue of result.error.issues) {
		const key = issue.path[0] as keyof z.infer<T> | undefined;
		if (key !== undefined && errors[key] === undefined) {
			errors[key] = issue.message;
		}
	}
	return errors;
}

export function formDataToObject(formData: FormData) {
	const values: Record<string, string> = {};
	for (const [key, value] of formData.entries()) {
		if (typeof value === 'string') {
			values[key] = value;
		}
	}
	return values;
}
