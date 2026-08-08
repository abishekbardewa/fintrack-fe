import { useId, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { categoryFieldErrors, createCategorySchema } from '@/features/categories/schemas';

interface CategoryFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmLabel: string;
	initialName?: string;
	pending?: boolean;
	onSubmit: (name: string) => Promise<void> | void;
}

export function CategoryFormDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel,
	initialName = '',
	pending = false,
	onSubmit,
}: CategoryFormDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open ? (
					<CategoryFormFields
						key={`${title}-${initialName}`}
						title={title}
						description={description}
						confirmLabel={confirmLabel}
						initialName={initialName}
						pending={pending}
						onCancel={() => onOpenChange(false)}
						onSubmit={onSubmit}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface CategoryFormFieldsProps {
	title: string;
	description: string;
	confirmLabel: string;
	initialName: string;
	pending: boolean;
	onCancel: () => void;
	onSubmit: (name: string) => Promise<void> | void;
}

function CategoryFormFields({
	title,
	description,
	confirmLabel,
	initialName,
	pending,
	onCancel,
	onSubmit,
}: CategoryFormFieldsProps) {
	const inputId = useId();
	const errorId = `${inputId}-error`;
	const [name, setName] = useState(initialName);
	const [error, setError] = useState<string>();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const fieldErrors = categoryFieldErrors({ name });
		if (fieldErrors.name) {
			setError(fieldErrors.name);
			return;
		}
		await onSubmit(createCategorySchema.parse({ name }).name);
	};

	return (
		<form onSubmit={handleSubmit} noValidate>
			<DialogHeader>
				<DialogTitle>{title}</DialogTitle>
				<DialogDescription>{description}</DialogDescription>
			</DialogHeader>
			<div className="grid gap-2 py-4">
				<Label htmlFor={inputId}>Name</Label>
				<Input
					id={inputId}
					value={name}
					onChange={(e) => {
						setName(e.target.value);
						if (error) setError(undefined);
					}}
					placeholder="Category name"
					autoComplete="off"
					disabled={pending}
					aria-invalid={Boolean(error)}
					aria-describedby={error ? errorId : undefined}
					data-testid="category-name-input"
				/>
				{error ? (
					<p id={errorId} className="text-[10px] leading-tight text-destructive" role="alert">
						{error}
					</p>
				) : null}
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
					Cancel
				</Button>
				<Button type="submit" disabled={pending} data-testid="category-form-submit">
					{pending ? (
						<>
							<Loader2 className="animate-spin" />
							Saving…
						</>
					) : (
						confirmLabel
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}
