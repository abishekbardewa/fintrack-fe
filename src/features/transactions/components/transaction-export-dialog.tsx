import { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { exportTransactions } from '@/features/transactions/transaction.service';
import type {
	TransactionExportFormat,
	TransactionExportPreset,
} from '@/features/transactions/types';
import {
	EXPORT_MAX_RANGE_DAYS,
	describeActiveFilters,
	exportFilteredRangeError,
	exportPresetRangeLabel,
	filtersToExportParams,
	formatDateInput,
	triggerFileDownload,
	type TransactionFilterDraft,
} from '@/features/transactions/utils';
import { getErrorMessage } from '@/lib/api/errors';

export type TransactionExportSelection =
	| { kind: 'preset'; preset: TransactionExportPreset }
	| { kind: 'filtered' };

interface TransactionExportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selection: TransactionExportSelection | null;
	filters: TransactionFilterDraft;
	categoryLabels: Map<string, string>;
}

function exportWindowBounds(now = new Date()) {
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const earliest = new Date(today);
	earliest.setDate(earliest.getDate() - (EXPORT_MAX_RANGE_DAYS - 1));
	return { today, earliest };
}

export function TransactionExportDialog({
	open,
	onOpenChange,
	selection,
	filters,
	categoryLabels,
}: TransactionExportDialogProps) {
	const [pendingFormat, setPendingFormat] = useState<TransactionExportFormat | null>(null);
	const [rangeFrom, setRangeFrom] = useState('');
	const [rangeTo, setRangeTo] = useState('');

	const isFiltered = selection?.kind === 'filtered';
	const { today, earliest } = useMemo(() => exportWindowBounds(), []);

	useEffect(() => {
		if (!open) {
			setPendingFormat(null);
			return;
		}
		if (selection?.kind === 'filtered') {
			setRangeFrom(filters.from);
			setRangeTo(filters.to);
		}
	}, [open, selection, filters.from, filters.to]);

	const rangeDraft = useMemo(
		() => ({ ...filters, from: rangeFrom, to: rangeTo }),
		[filters, rangeFrom, rangeTo],
	);

	const filterLines = useMemo(() => {
		if (!isFiltered) return '';
		const withoutDates = { ...filters, from: '', to: '' };
		return describeActiveFilters(withoutDates, categoryLabels).replace(/^Showing\s+/, '');
	}, [isFiltered, filters, categoryLabels]);

	const rangeError = isFiltered ? exportFilteredRangeError(rangeDraft) : null;
	const canExport = selection != null && rangeError == null && pendingFormat == null;

	const phrase = useMemo(() => {
		if (selection?.kind === 'preset') {
			return `You're exporting transactions for ${exportPresetRangeLabel(selection.preset)}.`;
		}
		if (selection?.kind === 'filtered') {
			const datePart =
				rangeFrom && rangeTo
					? `${formatDateInput(rangeFrom)} – ${formatDateInput(rangeTo)}`
					: null;
			if (filterLines && datePart) {
				return `You're exporting transactions for ${filterLines} (${datePart}).`;
			}
			if (filterLines) {
				return `You're exporting transactions for ${filterLines}.`;
			}
			if (datePart) {
				return `You're exporting transactions for ${datePart}.`;
			}
			return "You're exporting filtered transactions.";
		}
		return '';
	}, [selection, filterLines, rangeFrom, rangeTo]);

	const handleExport = async (format: TransactionExportFormat) => {
		if (!selection || rangeError) return;
		setPendingFormat(format);
		try {
			const params =
				selection.kind === 'preset'
					? { format, preset: selection.preset }
					: filtersToExportParams(rangeDraft, format);
			const file = await exportTransactions(params);
			triggerFileDownload(file.blob, file.filename);
			toast.success(format === 'xlsx' ? 'Excel downloaded' : 'CSV downloaded');
			onOpenChange(false);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not export transactions.'));
		} finally {
			setPendingFormat(null);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md" data-testid="transaction-export-dialog">
				<DialogHeader>
					<DialogTitle>Export</DialogTitle>
					<DialogDescription className="sr-only">
						Download transactions as CSV or Excel.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 text-sm">
					{isFiltered ? (
						<div className="space-y-2">
							<p className="text-xs font-medium text-muted-foreground">Range</p>
							<div className="grid grid-cols-2 gap-2">
								<div className="space-y-1.5">
									<Label htmlFor="export-from">From</Label>
									<DatePicker
										id="export-from"
										value={rangeFrom}
										onChange={setRangeFrom}
										placeholder="Start"
										invalid={Boolean(rangeError)}
										aria-label="Export from date"
										minDate={earliest}
										maxDate={today}
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="export-to">To</Label>
									<DatePicker
										id="export-to"
										value={rangeTo}
										onChange={setRangeTo}
										placeholder="End"
										invalid={Boolean(rangeError)}
										aria-label="Export to date"
										minDate={earliest}
										maxDate={today}
									/>
								</div>
							</div>
							{rangeError ? (
								<p className="text-[10px] leading-tight text-destructive" data-testid="transaction-export-error">
									{rangeError}
								</p>
							) : null}
						</div>
					) : null}

					{phrase ? <p className="text-foreground">{phrase}</p> : null}
				</div>

				<DialogFooter className="gap-2 sm:justify-end">
					<Button
						type="button"
						variant="outline"
						className="min-w-28"
						disabled={!canExport}
						onClick={() => void handleExport('csv')}
						data-testid="transaction-export-csv"
					>
						{pendingFormat === 'csv' ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<FileText className="size-4" />
						)}
						CSV
					</Button>
					<Button
						type="button"
						className="min-w-28"
						disabled={!canExport}
						onClick={() => void handleExport('xlsx')}
						data-testid="transaction-export-xlsx"
					>
						{pendingFormat === 'xlsx' ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<FileSpreadsheet className="size-4" />
						)}
						Excel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
