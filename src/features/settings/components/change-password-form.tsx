import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/features/auth/components/password-input';
import { useChangePasswordMutation } from '@/features/settings/hooks/use-profile';
import {
	changePasswordSchema,
	fieldErrorsFromSchema,
	type ChangePasswordValues,
} from '@/features/settings/schemas';
import { getErrorMessage, getFieldErrors, toApiError } from '@/lib/api/errors';

const PASSWORD_FIELDS = ['currentPassword', 'newPassword'] as const;

const emptyValues: ChangePasswordValues = {
	currentPassword: '',
	newPassword: '',
};

export function ChangePasswordForm() {
	const changeMutation = useChangePasswordMutation();
	const [values, setValues] = useState<ChangePasswordValues>(emptyValues);
	const [errors, setErrors] = useState<Partial<Record<keyof ChangePasswordValues, string>>>({});

	const pending = changeMutation.isPending;

	const setField = <K extends keyof ChangePasswordValues>(
		key: K,
		value: ChangePasswordValues[K],
	) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) {
			setErrors((prev) => ({ ...prev, [key]: undefined }));
		}
	};

	const handleCancel = () => {
		setValues(emptyValues);
		setErrors({});
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const fieldErrors = fieldErrorsFromSchema(changePasswordSchema, values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}

		const parsed = changePasswordSchema.parse(values);

		try {
			await changeMutation.mutateAsync(parsed);
			toast.success('Password updated');
			setValues(emptyValues);
			setErrors({});
		} catch (error) {
			const apiError = toApiError(error);
			const apiFields = getFieldErrors(error, PASSWORD_FIELDS);
			if (Object.keys(apiFields).length > 0) {
				setErrors(apiFields);
				return;
			}
			if (apiError.statusCode === 401) {
				setErrors({ currentPassword: apiError.message || 'Current password is incorrect' });
				return;
			}
			toast.error(getErrorMessage(error, 'Could not change password.'));
		}
	};

	return (
		<form onSubmit={handleSubmit} noValidate className="grid max-w-md gap-6">
			<div>
				<h2 className="text-lg font-semibold tracking-tight">Change Password</h2>
			</div>

			<PasswordInput
				id="settings-current-password"
				label="Current password"
				name="currentPassword"
				autoComplete="current-password"
				value={values.currentPassword}
				onChange={(e) => setField('currentPassword', e.target.value)}
				disabled={pending}
				error={errors.currentPassword}
				data-testid="settings-current-password"
			/>

			<PasswordInput
				id="settings-new-password"
				label="New password"
				name="newPassword"
				autoComplete="new-password"
				value={values.newPassword}
				onChange={(e) => setField('newPassword', e.target.value)}
				disabled={pending}
				error={errors.newPassword}
				data-testid="settings-new-password"
			/>

			<div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
				<Button
					type="button"
					variant="ghost"
					onClick={handleCancel}
					disabled={pending}
					data-testid="settings-password-cancel"
				>
					Cancel
				</Button>
				<Button type="submit" disabled={pending} data-testid="settings-password-save">
					{pending ? (
						<>
							<Loader2 className="animate-spin" />
							Updating…
						</>
					) : (
						'Update Password'
					)}
				</Button>
			</div>
		</form>
	);
}
