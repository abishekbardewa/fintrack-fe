import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { FileSpreadsheet, FileText, Loader2, Trash2, Upload } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { Category } from '@/features/categories/types';
import { buildCategoryTree } from '@/features/categories/utils';
import { useImportTransactionsMutation } from '@/features/transactions/hooks/use-transactions';
import { IMPORT_MAX_ROWS, parseImportFile } from '@/features/transactions/import-parse';
import {
	downloadImportTemplateCsv,
	downloadImportTemplateXlsx,
} from '@/features/transactions/import-template';
import {
	applyImportApiDetails,
	draftRowsToPayload,
	rawToDraftRow,
	rowHasErrors,
	sortImportRows,
	validateImportRows,
	type ImportDraftRow,
	type ImportFieldKey,
} from '@/features/transactions/import-validate';
import { getErrorMessage, toApiError } from '@/lib/api/errors';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import { cn } from '@/lib/utils';

interface TransactionImportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	categories: Category[];
	preferredCurrency: string;
}

function CellError({ message }: { message?: string }) {
	if (!message) return null;
	return <p className="mt-1 text-[10px] leading-tight text-destructive">{message}</p>;
}

const FIELD_CONTROL = 'h-8 rounded-lg';

function cellClass(hasError: boolean) {
	return cn(
		'px-2 py-2 align-middle',
		hasError && '[&_input]:border-destructive [&_button]:border-destructive',
	);
}

export function TransactionImportDialog({
	open,
	onOpenChange,
	categories,
	preferredCurrency,
}: TransactionImportDialogProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const importMutation = useImportTransactionsMutation();

	const [rows, setRows] = useState<ImportDraftRow[]>([]);
	const [truncated, setTruncated] = useState(0);
	const [fileName, setFileName] = useState('');
	const [parseError, setParseError] = useState<string | null>(null);
	const [dragOver, setDragOver] = useState(false);
	const [parsing, setParsing] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const tree = useMemo(() => buildCategoryTree(categories), [categories]);

	const reset = useCallback(() => {
		setRows([]);
		setTruncated(0);
		setFileName('');
		setParseError(null);
		setDragOver(false);
		setParsing(false);
		setSubmitError(null);
		if (fileInputRef.current) fileInputRef.current.value = '';
	}, []);

	useEffect(() => {
		if (!open) reset();
	}, [open, reset]);

	useEffect(() => {
		if (!open) return;
		setRows((prev) => {
			if (prev.length === 0) return prev;
			return sortImportRows(validateImportRows(prev, categories, preferredCurrency));
		});
	}, [categories, preferredCurrency, open]);

	const errorCount = useMemo(() => rows.filter(rowHasErrors).length, [rows]);
	const canImport =
		rows.length > 0 && errorCount === 0 && !importMutation.isPending && !parsing;

	const loadFile = async (file: File | undefined) => {
		if (!file) return;
		setParsing(true);
		setParseError(null);
		setSubmitError(null);
		try {
			const result = await parseImportFile(file);
			if (result.error) {
				setRows([]);
				setTruncated(0);
				setFileName('');
				setParseError(result.error);
				return;
			}
			const drafts = sortImportRows(
				validateImportRows(
					result.rows.map((raw) => rawToDraftRow(raw, preferredCurrency)),
					categories,
					preferredCurrency,
				),
			);
			setRows(drafts);
			setTruncated(result.truncated);
			setFileName(file.name);
		} finally {
			setParsing(false);
		}
	};

	const onFileChange = (fileList: FileList | null) => {
		void loadFile(fileList?.[0]);
	};

	const onDrop = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setDragOver(false);
		void loadFile(event.dataTransfer.files?.[0]);
	};

	const updateRow = (id: string, patch: Partial<ImportDraftRow>) => {
		setRows((prev) => {
			const next = prev.map((row) => {
				if (row.id !== id) return row;
				const merged = { ...row, ...patch };
				if (patch.categoryId != null && patch.categoryId !== row.categoryId) {
					merged.subcategoryId = '';
					merged.subcategory = '';
				}
				if (patch.type != null && patch.type !== row.type) {
					merged.categoryId = '';
					merged.category = '';
					merged.subcategoryId = '';
					merged.subcategory = '';
				}
				return merged;
			});
			return sortImportRows(validateImportRows(next, categories, preferredCurrency));
		});
		setSubmitError(null);
	};

	const removeRow = (id: string) => {
		setRows((prev) => prev.filter((row) => row.id !== id));
		setSubmitError(null);
	};

	const handleImport = async () => {
		if (!canImport) return;
		setSubmitError(null);
		const ordered = sortImportRows(rows);
		try {
			const data = await importMutation.mutateAsync({
				transactions: draftRowsToPayload(ordered),
			});
			toast.success(
				data.imported === 1
					? '1 transaction imported'
					: `${data.imported} transactions imported`,
			);
			onOpenChange(false);
		} catch (error) {
			const apiError = toApiError(error);
			if (apiError.details?.length) {
				setRows(sortImportRows(applyImportApiDetails(ordered, apiError.details)));
			}
			setSubmitError(getErrorMessage(error, 'Could not import transactions.'));
		}
	};

	const mainsForType = (type: string) =>
		tree.filter((m) => m.kind === type || (type !== 'expense' && type !== 'income'));

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="flex max-h-[90vh] flex-col gap-0 overflow-hidden sm:max-w-5xl"
				data-testid="transaction-import-dialog"
			>
				<DialogHeader className="shrink-0">
					<DialogTitle>Import</DialogTitle>
					<DialogDescription>Bring transactions in from a file.</DialogDescription>
				</DialogHeader>

				<div className="flex min-h-0 flex-1 flex-col gap-4 py-2">
					<div className="shrink-0 space-y-4">
						<div
							role="button"
							tabIndex={0}
							onKeyDown={(event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault();
									fileInputRef.current?.click();
								}
							}}
							onDragOver={(event) => {
								event.preventDefault();
								setDragOver(true);
							}}
							onDragLeave={() => setDragOver(false)}
							onDrop={onDrop}
							onClick={() => fileInputRef.current?.click()}
							className={cn(
								'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors',
								dragOver
									? 'border-primary bg-primary/5'
									: 'border-border bg-muted/30 hover:bg-muted/50',
							)}
							data-testid="transaction-import-dropzone"
						>
							{parsing ? (
								<Loader2 className="size-6 animate-spin text-muted-foreground" />
							) : (
								<Upload className="size-6 text-muted-foreground" />
							)}
							<div className="space-y-1">
								<p className="text-sm font-medium">
									{fileName ? fileName : 'Drop CSV or Excel here, or click to browse'}
								</p>
								<p className="text-xs text-muted-foreground">
									Up to {IMPORT_MAX_ROWS} rows per import
								</p>
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
								className="hidden"
								onChange={(event) => onFileChange(event.target.files)}
								data-testid="transaction-import-file"
							/>
						</div>

						{parseError ? (
							<p
								className="text-[10px] leading-tight text-destructive"
								data-testid="transaction-import-parse-error"
							>
								{parseError}
							</p>
						) : null}

						{truncated > 0 ? (
							<p
								className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground"
								data-testid="transaction-import-truncated"
							>
								Only the first {IMPORT_MAX_ROWS} rows are included ({truncated} skipped). Import
								again for the rest.
							</p>
						) : null}

						{rows.length > 0 ? (
							<div className="flex flex-wrap items-center justify-between gap-2 text-sm">
								<p className="text-muted-foreground">
									{rows.length} row{rows.length === 1 ? '' : 's'}
									{errorCount > 0 ? ` · ${errorCount} with errors` : ' · ready'}
								</p>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={reset}
									data-testid="transaction-import-clear"
								>
									Clear file
								</Button>
							</div>
						) : null}

						{submitError ? (
							<p className="text-[10px] leading-tight text-destructive" data-testid="transaction-import-error">
								{submitError}
							</p>
						) : null}
					</div>

					{rows.length > 0 ? (
						<div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border">
							<table className="w-full min-w-4xl border-collapse text-sm">
								<thead className="sticky top-0 z-10">
									<tr className="border-b border-border bg-muted text-left text-xs text-muted-foreground">
										<th className="px-2 py-2 font-medium" />
										<th className="px-2 py-2 text-center font-medium">#</th>
										<th className="px-2 py-2 font-medium">Date</th>
										<th className="px-2 py-2 font-medium">Type</th>
										<th className="px-2 py-2 font-medium">Category</th>
										<th className="px-2 py-2 font-medium">Subcategory</th>
										<th className="px-2 py-2 font-medium">Amount</th>
										<th className="px-2 py-2 font-medium">Currency</th>
										<th className="px-2 py-2 font-medium">Description</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((row) => {
										const mains = mainsForType(row.type);
										const selectedMain = mains.find((m) => m.id === row.categoryId);
										const subs = selectedMain?.children ?? [];
										const err = (field: ImportFieldKey) => Boolean(row.errors[field]);

										return (
											<tr
												key={row.id}
												className={cn(
													'border-b border-border',
													rowHasErrors(row) && 'bg-destructive/5',
												)}
												data-testid={`transaction-import-row-${row.sourceIndex}`}
											>
												<td className="px-2 py-2 text-center align-middle">
													<Button
														type="button"
														variant="ghost"
														size="icon-sm"
														className="text-muted-foreground hover:text-destructive"
														onClick={() => removeRow(row.id)}
														aria-label={`Remove row ${row.sourceIndex}`}
														data-testid={`transaction-import-delete-${row.sourceIndex}`}
													>
														<Trash2 className="size-4" />
													</Button>
												</td>
												<td className="px-2 py-2 text-center align-middle tabular-nums text-muted-foreground">
													{row.sourceIndex}
												</td>
												<td className={cn(cellClass(err('date')), 'min-w-36')}>
													<DatePicker
														value={row.date}
														onChange={(value) => updateRow(row.id, { date: value })}
														placeholder="Date"
														invalid={err('date')}
														aria-label={`Date for row ${row.sourceIndex}`}
														className={cn(
															FIELD_CONTROL,
															'min-w-36 border-input/20 bg-muted shadow-xs hover:bg-muted',
														)}
													/>
													<CellError message={row.errors.date} />
												</td>
												<td className={cn(cellClass(err('type')), 'min-w-30')}>
													<Select
														value={
															row.type === 'expense' || row.type === 'income' ? row.type : ''
														}
														onValueChange={(value) => updateRow(row.id, { type: value })}
													>
														<SelectTrigger
															size="sm"
															className="w-30"
															aria-invalid={err('type')}
														>
															<SelectValue placeholder="Type" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="expense">Expense</SelectItem>
															<SelectItem value="income">Income</SelectItem>
														</SelectContent>
													</Select>
													<CellError message={row.errors.type} />
												</td>
												<td className={cn(cellClass(err('category')), 'min-w-32')}>
													<Select
														value={row.categoryId || undefined}
														onValueChange={(value) => {
															const main = mains.find((m) => m.id === value);
															updateRow(row.id, {
																categoryId: value,
																category: main?.name ?? '',
															});
														}}
													>
														<SelectTrigger
															size="sm"
															className="min-w-32"
															aria-invalid={err('category')}
														>
															<SelectValue placeholder={row.category || 'Category'} />
														</SelectTrigger>
														<SelectContent>
															{mains.map((main) => (
																<SelectItem key={main.id} value={main.id}>
																	{main.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<CellError message={row.errors.category} />
												</td>
												<td className={cn(cellClass(err('subcategory')), 'min-w-32')}>
													<Select
														value={row.subcategoryId || '__none__'}
														onValueChange={(value) => {
															if (value === '__none__') {
																updateRow(row.id, {
																	subcategoryId: '',
																	subcategory: '',
																});
																return;
															}
															const sub = subs.find((s) => s.id === value);
															updateRow(row.id, {
																subcategoryId: value,
																subcategory: sub?.name ?? '',
															});
														}}
														disabled={!row.categoryId}
													>
														<SelectTrigger
															size="sm"
															className="min-w-32"
															aria-invalid={err('subcategory')}
														>
															<SelectValue placeholder={row.subcategory || 'None'} />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="__none__">None</SelectItem>
															{subs.map((sub) => (
																<SelectItem key={sub.id} value={sub.id}>
																	{sub.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<CellError message={row.errors.subcategory} />
												</td>
												<td className={cn(cellClass(err('amount')), 'min-w-28')}>
													<Input
														value={row.amount}
														onChange={(event) =>
															updateRow(row.id, { amount: event.target.value })
														}
														aria-invalid={err('amount')}
														className={FIELD_CONTROL}
														inputMode="decimal"
													/>
													<CellError message={row.errors.amount} />
												</td>
												<td className={cn(cellClass(err('currency')), 'min-w-22')}>
													<Select
														value={row.currency || preferredCurrency}
														onValueChange={(value) =>
															updateRow(row.id, { currency: value })
														}
													>
														<SelectTrigger
															size="sm"
															className="w-22"
															aria-invalid={err('currency')}
														>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															{SUPPORTED_CURRENCIES.map((currency) => (
																<SelectItem key={currency.code} value={currency.code}>
																	{currency.code}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<CellError message={row.errors.currency} />
												</td>
												<td className={cn(cellClass(err('description')), 'min-w-40')}>
													<Input
														value={row.description}
														onChange={(event) =>
															updateRow(row.id, { description: event.target.value })
														}
														aria-invalid={err('description')}
														className={cn(FIELD_CONTROL, 'min-w-40')}
													/>
													<CellError message={row.errors.description} />
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					) : null}
				</div>

				<DialogFooter className="mt-4 shrink-0 flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={downloadImportTemplateCsv}
							data-testid="transaction-import-template-csv"
						>
							<FileText className="size-4" />
							CSV template
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={downloadImportTemplateXlsx}
							data-testid="transaction-import-template-xlsx"
						>
							<FileSpreadsheet className="size-4" />
							Excel template
						</Button>
					</div>
					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<Button
							type="button"
							disabled={!canImport}
							onClick={() => void handleImport()}
							data-testid="transaction-import-submit"
						>
							{importMutation.isPending ? (
								<>
									<Loader2 className="size-4 animate-spin" />
									Importing…
								</>
							) : (
								`Import${rows.length > 0 ? ` ${rows.length}` : ''}`
							)}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

