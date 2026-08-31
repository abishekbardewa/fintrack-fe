import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
import { getUserRole } from '@/features/auth/utils';
import { useCurrenciesQuery } from '@/features/currencies/hooks/use-currencies';
import { AvatarPicker } from '@/features/settings/components/avatar-picker';
import { CurrencyChangeDialog } from '@/features/settings/components/currency-change-dialog';
import { useUpdateMeMutation } from '@/features/settings/hooks/use-profile';
import {
	fieldErrorsFromSchema,
	profileFormSchema,
	profileNameSchema,
	currencyFormSchema,
	openingBalanceFormSchema,
	type ProfileFormValues,
} from '@/features/settings/schemas';
import type { UpdateMeRequest } from '@/features/settings/types';
import { getErrorMessage, getFieldErrors } from '@/lib/api/errors';
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '@/lib/currencies';
import { cn } from '@/lib/utils';

interface ProfileFormProps {
	user: AuthUser;
}

const PROFILE_FIELDS = ['name', 'currency'] as const;

export function ProfileForm({ user }: ProfileFormProps) {
	return (
		<ProfileFormFields
			key={`${user.id}:${user.name}:${user.currency ?? ''}:${(user.startingBalance ?? user.openingBalance)?.setAt ?? 'unset'}`}
			user={user}
		/>
	);
}

function ProfileFormFields({ user }: ProfileFormProps) {
	const isAdmin = getUserRole(user) === 'admin';
	const updateMutation = useUpdateMeMutation();
	const currenciesQuery = useCurrenciesQuery(true);
	const initialName = user.name ?? '';
	const initialCurrency = user.currency || DEFAULT_CURRENCY;
	const initialOpeningBalanceAmount =
		(user.startingBalance ?? user.openingBalance)?.setAt != null
			? String((user.startingBalance ?? user.openingBalance)?.amount)
			: '';
	const initialOpeningBalanceCurrency =
		(user.startingBalance ?? user.openingBalance)?.currency || initialCurrency;

	const [name, setName] = useState(initialName);
	const [currency, setCurrency] = useState(initialCurrency);
	const [openingBalanceAmount, setOpeningBalanceAmount] = useState(initialOpeningBalanceAmount);
	const [openingBalanceCurrency, setOpeningBalanceCurrency] = useState(initialOpeningBalanceCurrency);
	const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormValues, string>>>({});
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pendingPayload, setPendingPayload] = useState<UpdateMeRequest | null>(null);

	const currencyOptions =
		currenciesQuery.data?.currencies?.length
			? currenciesQuery.data.currencies
			: SUPPORTED_CURRENCIES;

	const pending = updateMutation.isPending;
	const dirty = isAdmin
		? name.trim() !== initialName.trim()
		: name.trim() !== initialName.trim() ||
			currency !== initialCurrency ||
			((user.startingBalance ?? user.openingBalance)?.setAt != null
				? openingBalanceAmount.trim() !== initialOpeningBalanceAmount ||
					openingBalanceCurrency !== initialOpeningBalanceCurrency
				: openingBalanceAmount.trim() !== '');

	const handleCancel = () => {
		setName(initialName);
		setCurrency(initialCurrency);
		setOpeningBalanceAmount(initialOpeningBalanceAmount);
		setOpeningBalanceCurrency(initialOpeningBalanceCurrency);
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

	const openingBalanceUnset = (user.startingBalance ?? user.openingBalance)?.setAt == null;

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (isAdmin) {
			const fieldErrors = fieldErrorsFromSchema(profileNameSchema, { name });
			if (Object.keys(fieldErrors).length > 0) {
				setErrors(fieldErrors);
				return;
			}
			const parsed = profileNameSchema.parse({ name });
			if (parsed.name === initialName.trim()) {
				toast.message('No changes to save');
				return;
			}
			await saveProfile({ name: parsed.name });
			return;
		}

		const openingBalanceTouched =
			openingBalanceUnset
				? openingBalanceAmount.trim() !== ''
				: openingBalanceAmount.trim() !== initialOpeningBalanceAmount ||
					openingBalanceCurrency !== initialOpeningBalanceCurrency;

		const values = {
			name,
			currency,
			openingBalanceAmount: openingBalanceTouched ? openingBalanceAmount : '0',
			openingBalanceCurrency,
		};

		const nameCurrencySchema = profileNameSchema.merge(currencyFormSchema);
		const fieldErrors = fieldErrorsFromSchema(nameCurrencySchema, values);
		if (openingBalanceTouched) {
			Object.assign(
				fieldErrors,
				fieldErrorsFromSchema(openingBalanceFormSchema, {
					openingBalanceAmount,
					openingBalanceCurrency,
				}),
			);
		}
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}

		const parsed = profileFormSchema.parse(
			openingBalanceTouched
				? values
				: { ...values, openingBalanceAmount: initialOpeningBalanceAmount || '0' },
		);
		const nameChanged = parsed.name !== initialName.trim();
		const currencyChanged = parsed.currency !== initialCurrency;
		const openingBalanceChanged =
			openingBalanceTouched &&
			(parsed.openingBalanceAmount !== initialOpeningBalanceAmount ||
				parsed.openingBalanceCurrency !== initialOpeningBalanceCurrency);
		if (!nameChanged && !currencyChanged && !openingBalanceChanged) {
			toast.message('No changes to save');
			return;
		}

		const payload: UpdateMeRequest = {
			...(nameChanged ? { name: parsed.name } : {}),
			...(currencyChanged ? { currency: parsed.currency } : {}),
			...(openingBalanceChanged
				? {
						openingBalance: {
							amount: Number(parsed.openingBalanceAmount),
							currency: parsed.openingBalanceCurrency,
						},
					}
				: {}),
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
				<AvatarPicker user={user} disabled={pending} />

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

				{!isAdmin ? (
					<>
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

				<div className="grid gap-2">
					<Label htmlFor="opening-balance-amount">Starting Balance</Label>
					<div
						className={cn(
							'flex h-10 overflow-hidden rounded-lg border border-input/20 bg-muted shadow-xs transition-[color,box-shadow]',
							'focus-within:border-primary/50 focus-within:ring-[3px] focus-within:ring-primary/30',
							(errors.openingBalanceAmount || errors.openingBalanceCurrency) &&
								'border-destructive ring-destructive/20 focus-within:border-destructive focus-within:ring-destructive/20',
						)}
					>
						<Input
							id="opening-balance-amount"
							type="number"
							inputMode="decimal"
							min="0"
							step="any"
							value={openingBalanceAmount}
							onChange={(e) => {
								setOpeningBalanceAmount(e.target.value);
								if (errors.openingBalanceAmount) {
									setErrors((prev) => ({ ...prev, openingBalanceAmount: undefined }));
								}
							}}
							placeholder={openingBalanceUnset ? 'Not set' : undefined}
							disabled={pending}
							aria-invalid={Boolean(errors.openingBalanceAmount)}
							className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0 tabular-nums"
							data-testid="profile-opening-balance-amount"
						/>
						<Select
							value={openingBalanceCurrency}
							onValueChange={(v) => {
								setOpeningBalanceCurrency(v);
								if (errors.openingBalanceCurrency) {
									setErrors((prev) => ({ ...prev, openingBalanceCurrency: undefined }));
								}
							}}
							disabled={pending || currenciesQuery.isLoading}
						>
							<SelectTrigger
								id="opening-balance-currency"
								aria-label="Starting balance currency"
								aria-invalid={Boolean(errors.openingBalanceCurrency)}
								className="h-full w-auto shrink-0 rounded-none border-0 border-l border-input/20 bg-transparent px-3 shadow-none focus-visible:border-transparent focus-visible:ring-0"
								data-testid="profile-opening-balance-currency"
							>
								<SelectValue placeholder="Select currency" />
							</SelectTrigger>
							<SelectContent align="end">
								{currencyOptions.map((c) => (
									<SelectItem key={c.code} value={c.code}>
										{c.code}
										{c.symbol ? ` (${c.symbol})` : ''}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{errors.openingBalanceAmount ? (
						<p className="text-[10px] leading-tight text-destructive" role="alert">
							{errors.openingBalanceAmount}
						</p>
					) : null}
					{errors.openingBalanceCurrency ? (
						<p className="text-[10px] leading-tight text-destructive" role="alert">
							{errors.openingBalanceCurrency}
						</p>
					) : null}
						</div>
					</>
				) : null}

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

			{!isAdmin ? (
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
						setOpeningBalanceAmount(initialOpeningBalanceAmount);
						setOpeningBalanceCurrency(initialOpeningBalanceCurrency);
						if (errors.currency) setErrors((prev) => ({ ...prev, currency: undefined }));
					}}
					currency={pendingPayload?.currency ?? currency}
					pending={pending}
					onConfirm={() => {
						if (pendingPayload) void saveProfile(pendingPayload);
					}}
				/>
			) : null}
		</>
	);
}
