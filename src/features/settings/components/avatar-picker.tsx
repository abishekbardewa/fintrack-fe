import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { AuthUser } from '@/features/auth/types';
import { useUpdateAvatarMutation } from '@/features/settings/hooks/use-profile';
import { AVATAR_ACCEPT, userInitials, validateAvatarFile } from '@/features/settings/utils';
import { getErrorMessage } from '@/lib/api/errors';

interface AvatarPickerProps {
	user: AuthUser;
	disabled?: boolean;
}

export function AvatarPicker({ user, disabled }: AvatarPickerProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const previewRef = useRef<string | null>(null);
	const uploadMutation = useUpdateAvatarMutation();
	const [preview, setPreview] = useState<string | null>(null);

	const uploading = uploadMutation.isPending;

	const releasePreview = () => {
		if (previewRef.current) URL.revokeObjectURL(previewRef.current);
		previewRef.current = null;
	};

	useEffect(() => releasePreview, []);

	const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] ?? null;
		e.target.value = '';
		if (!file) return;

		const error = validateAvatarFile(file);
		if (error) {
			toast.error(error);
			return;
		}

		releasePreview();
		previewRef.current = URL.createObjectURL(file);
		setPreview(previewRef.current);

		try {
			await uploadMutation.mutateAsync(file);
			toast.success('Avatar updated');
		} catch (err) {
			releasePreview();
			setPreview(null);
			toast.error(getErrorMessage(err, 'Could not update avatar.'));
		}
	};

	const src = preview ?? user.avatarUrl ?? undefined;

	return (
		<div className="relative size-20">
			<Avatar className="size-20">
				{src ? <AvatarImage src={src} alt={user.name} className="object-cover" /> : null}
				<AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
					{userInitials(user.name)}
				</AvatarFallback>
			</Avatar>

			{uploading ? (
				<div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
					<Loader2 className="size-5 animate-spin text-muted-foreground" />
				</div>
			) : null}

			<Button
				type="button"
				size="icon"
				variant="secondary"
				className="absolute -right-1 -bottom-1 size-7 rounded-full border border-border shadow-xs"
				onClick={() => inputRef.current?.click()}
				disabled={disabled || uploading}
				aria-label="Change photo"
				data-testid="avatar-edit"
			>
				<Pencil className="size-3.5" />
			</Button>

			<input
				ref={inputRef}
				type="file"
				accept={AVATAR_ACCEPT}
				className="sr-only"
				onChange={handleChange}
				disabled={disabled || uploading}
				tabIndex={-1}
				data-testid="avatar-input"
			/>
		</div>
	);
}
