import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { AuthUser } from '@/features/auth/types';
import { useCurrenciesQuery } from '@/features/currencies/hooks/use-currencies';
import { CurrencyChangeDialog } from '@/features/settings/components/currency-change-dialog';
import { useUpdateMeMutation } from '@/features/settings/hooks/use-profile';
import {
	fieldErrorsFromSchema,
	profileFormSchema,
	type ProfileFormValues,
} from '@/features/settings/schemas';
import type { UpdateMeRequest } from '@/features/settings/types';
import { userInitials } from '@/features/settings/utils';
import { getErrorMessage, getFieldErrors } from '@/lib/api/errors';
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '@/lib/currencies';

interface ProfileFormProps {
	user: AuthUser;
}

const PROFILE_FIELDS = ['name', 'currency'] as const;

export function ProfileForm({ user }: ProfileFormProps) {
	return (
		<ProfileFormFields
			key={`${user.id}:${user.updatedAt ?? ''}:${user.name}:${user.currency ?? ''}`}
			user={user}
		/>
	);
}

function ProfileFormFields({ user }: ProfileFormProps) {
	const updateMutation = useUpdateMeMutation();
	const currenciesQuery = useCurrenciesQuery(true);
	const initialName = user.name ?? '';
	const initialCurrency = user.currency || DEFAULT_CURRENCY;

	const [name, setName] = useState(initialName);
	const [currency, setCurrency] = useState(initialCurrency);
	const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormValues, string>>>({});
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pendingPayload, setPendingPayload] = useState<UpdateMeRequest | null>(null);

	const currencyOptions =
		currenciesQuery.data?.currencies?.length
			? currenciesQuery.data.currencies
			: SUPPORTED_CURRENCIES;

	const pending = updateMutation.isPending;
	const dirty =
		name.trim() !== initialName.trim() || currency !== initialCurrency;

	const handleCancel = () => {
		setName(initialName);
		setCurrency(initialCurrency);
		setErrors({});
		setConfirmOpen(false);
		setPendingPayload(null);
	};

	const saveProfile = async (payload: UpdateMeRequest) => {
		try {
			await updateMutation.mutateAsync(payload);
			setConfirmOpen(false);
			setPendingPayload(null);
			toast.success('Profile updated');
		} catch (error) {
			const apiFields = getFieldErrors(error, PROFILE_FIELDS);
			if (Object.keys(apiFields).length > 0) {
				setConfirmOpen(false);
				setPendingPayload(null);
				setErrors(apiFields);
				return;
			}
			toast.error(getErrorMessage(error, 'Could not update profile.'));
		}
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const values = { name, currency };
		const fieldErrors = fieldErrorsFromSchema(profileFormSchema, values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}

		const parsed = profileFormSchema.parse(values);
		const nameChanged = parsed.name !== initialName.trim();
		const currencyChanged = parsed.currency !== initialCurrency;
		if (!nameChanged && !currencyChanged) {
			toast.message('No changes to save');
			return;
		}

		const payload: UpdateMeRequest = {
			...(nameChanged ? { name: parsed.name } : {}),
			...(currencyChanged ? { currency: parsed.currency } : {}),
		};

		if (currencyChanged) {
			setPendingPayload(payload);
			setConfirmOpen(true);
			return;
		}

		await saveProfile(payload);
	};

	return (
		<>
			<form onSubmit={handleSubmit} noValidate className="grid gap-6">
				<Avatar className="size-20">
					<AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
						{userInitials(user.name)}
					</AvatarFallback>
				</Avatar>

				<div className="grid gap-2">
					<Label htmlFor="profile-name">Name</Label>
					<Input
						id="profile-name"
						value={name}
						onChange={(e) => {
							setName(e.target.value);
							if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
						}}
						disabled={pending}
						aria-invalid={Boolean(errors.name)}
						autoComplete="name"
						data-testid="profile-name"
					/>
					{errors.name ? (
						<p className="text-[10px] leading-tight text-destructive" role="alert">
							{errors.name}
						</p>
					) : null}
				</div>

				<div className="grid gap-2">
					<Label htmlFor="profile-email">Email</Label>
					<Input
						id="profile-email"
						value={user.email ?? ''}
						disabled
						readOnly
						data-testid="profile-email"
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="profile-currency">Currency</Label>
					<Select
						value={currency}
						onValueChange={(v) => {
							setCurrency(v);
							if (errors.currency) setErrors((prev) => ({ ...prev, currency: undefined }));
						}}
						disabled={pending || currenciesQuery.isLoading}
					>
						<SelectTrigger
							id="profile-currency"
							className="w-full"
							aria-invalid={Boolean(errors.currency)}
							data-testid="profile-currency"
						>
							<SelectValue placeholder="Select currency" />
						</SelectTrigger>
						<SelectContent>
							{currencyOptions.map((c) => (
								<SelectItem key={c.code} value={c.code}>
									{c.code} — {c.name}
									{c.symbol ? ` (${c.symbol})` : ''}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{errors.currency ? (
						<p className="text-[10px] leading-tight text-destructive" role="alert">
							{errors.currency}
						</p>
					) : null}
				</div>

				<div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
					<Button
						type="button"
						variant="ghost"
						onClick={handleCancel}
						disabled={pending || !dirty}
						data-testid="profile-cancel"
					>
						Cancel
					</Button>
					<Button type="submit" disabled={pending || !dirty} data-testid="profile-save">
						{pending ? (
							<>
								<Loader2 className="animate-spin" />
								Saving…
							</>
						) : (
							'Save changes'
						)}
					</Button>
				</div>
			</form>

			<CurrencyChangeDialog
				open={confirmOpen}
				onOpenChange={(open) => {
					if (open) {
						setConfirmOpen(true);
						return;
					}
					setConfirmOpen(false);
					setPendingPayload(null);
					setCurrency(initialCurrency);
					if (errors.currency) setErrors((prev) => ({ ...prev, currency: undefined }));
				}}
				currency={pendingPayload?.currency ?? currency}
				pending={pending}
				onConfirm={() => {
					if (pendingPayload) void saveProfile(pendingPayload);
				}}
			/>
		</>
	);
}
