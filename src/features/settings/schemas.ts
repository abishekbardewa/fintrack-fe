import { z } from 'zod';

import { passwordSchema } from '@/features/auth/schemas';

export const profileNameSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Name is required')
		.min(3, 'Name must be at least 3 characters')
		.max(30, 'Name must be at most 30 characters'),
});

export const currencyFormSchema = z.object({
	currency: z.string().min(1, 'Select a currency'),
});

export const openingBalanceFormSchema = z.object({
	openingBalanceAmount: z
		.string()
		.trim()
		.min(1, 'Starting balance amount is required')
		.refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, 'Enter a valid amount'),
	openingBalanceCurrency: z.string().min(1, 'Select starting balance currency'),
});

export const profileFormSchema = profileNameSchema
	.merge(currencyFormSchema)
	.merge(openingBalanceFormSchema);

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Current password is required'),
		newPassword: passwordSchema,
	})
	.refine((v) => v.currentPassword !== v.newPassword, {
		message: 'New password must be different from current password',
		path: ['newPassword'],
	});

export type ProfileNameValues = z.infer<typeof profileNameSchema>;
export type CurrencyFormValues = z.infer<typeof currencyFormSchema>;
export type OpeningBalanceFormValues = z.infer<typeof openingBalanceFormSchema>;
export type ProfileFormValues = z.infer<typeof profileFormSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function fieldErrorsFromSchema<T extends z.ZodType>(
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
