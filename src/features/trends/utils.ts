export function trendsMonthName(month: number) {
	return new Intl.DateTimeFormat(undefined, { month: 'short' }).format(
		new Date(Date.UTC(2000, month - 1, 1)),
	);
}
