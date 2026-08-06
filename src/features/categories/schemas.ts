import { z } from 'zod';

export const categoryNameSchema = z
	.string()
	.trim()
	.min(1, 'Name is required')
	.min(2, 'Name must be at least 2 characters')
	.max(40, 'Name must be at most 40 characters');

export const createCategorySchema = z.object({
	name: categoryNameSchema,
});

export type CategoryNameValues = z.infer<typeof createCategorySchema>;

export function categoryFieldErrors(values: unknown): Partial<Record<'name', string>> {
	const result = createCategorySchema.safeParse(values);
	if (result.success) return {};
	const errors: Partial<Record<'name', string>> = {};
	for (const issue of result.error.issues) {
		if (issue.path[0] === 'name' && errors.name === undefined) {
			errors.name = issue.message;
		}
	}
	return errors;
}
