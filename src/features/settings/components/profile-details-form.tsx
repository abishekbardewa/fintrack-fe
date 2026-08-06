import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AuthUser } from '@/features/auth/types';
import { useUpdateMeMutation } from '@/features/settings/hooks/use-profile';
import {
	fieldErrorsFromSchema,
	profileNameSchema,
	type ProfileNameValues,
} from '@/features/settings/schemas';
import { userInitials } from '@/features/settings/utils';
import { getErrorMessage, getFieldErrors } from '@/lib/api/errors';

interface ProfileDetailsFormProps {
	user: AuthUser;
}

const NAME_FIELDS = ['name'] as const;

export function ProfileDetailsForm({ user }: ProfileDetailsFormProps) {
	return (
		<ProfileDetailsFields
			key={`${user.id}:${user.updatedAt ?? ''}:${user.name}`}
			user={user}
		/>
	);
}

function ProfileDetailsFields({ user }: ProfileDetailsFormProps) {
	const updateMutation = useUpdateMeMutation();
	const [name, setName] = useState(user.name ?? '');
	const [errors, setErrors] = useState<Partial<Record<keyof ProfileNameValues, string>>>({});

	const pending = updateMutation.isPending;
	const dirty = name.trim() !== (user.name ?? '').trim();

	const handleCancel = () => {
		setName(user.name ?? '');
		setErrors({});
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const values = { name };
		const fieldErrors = fieldErrorsFromSchema(profileNameSchema, values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}

		const parsed = profileNameSchema.parse(values);
		if (parsed.name === (user.name ?? '').trim()) {
			toast.message('No changes to save');
			return;
		}

		try {
			await updateMutation.mutateAsync({ name: parsed.name });
			toast.success('Profile updated');
		} catch (error) {
			const apiFields = getFieldErrors(error, NAME_FIELDS);
			if (Object.keys(apiFields).length > 0) {
				setErrors(apiFields);
				return;
			}
			toast.error(getErrorMessage(error, 'Could not update profile.'));
		}
	};

	return (
		<form onSubmit={handleSubmit} noValidate className="grid gap-6">
			<div>
				<h2 className="text-lg font-semibold tracking-tight">Profile Details</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Update your display name and review your account email.
				</p>
			</div>

			<Avatar className="size-20">
				<AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
					{userInitials(user.name)}
				</AvatarFallback>
			</Avatar>

			<div className="grid gap-2">
				<Label htmlFor="settings-name">Name</Label>
				<Input
					id="settings-name"
					value={name}
					onChange={(e) => {
						setName(e.target.value);
						if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
					}}
					disabled={pending}
					aria-invalid={Boolean(errors.name)}
					autoComplete="name"
					data-testid="settings-name"
				/>
				{errors.name ? (
					<p className="text-sm text-destructive" role="alert">
						{errors.name}
					</p>
				) : null}
			</div>

			<div className="grid gap-2">
				<Label htmlFor="settings-email">Email Address</Label>
				<Input
					id="settings-email"
					value={user.email ?? ''}
					disabled
					readOnly
					data-testid="settings-email"
				/>
			</div>

			<div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
				<Button
					type="button"
					variant="ghost"
					onClick={handleCancel}
					disabled={pending || !dirty}
					data-testid="settings-profile-cancel"
				>
					Cancel
				</Button>
				<Button type="submit" disabled={pending || !dirty} data-testid="settings-profile-save">
					{pending ? (
						<>
							<Loader2 className="animate-spin" />
							Saving…
						</>
					) : (
						'Save Changes'
					)}
				</Button>
			</div>
		</form>
	);
}
