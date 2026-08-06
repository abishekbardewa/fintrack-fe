export interface ApiValidationDetail {
	field: string;
	message: string;
}

export interface ApiSuccessResponse<T> {
	success: true;
	statusCode: number;
	message: string;
	data: T;
}

export interface ApiErrorResponse {
	success: false;
	statusCode: number;
	message: string;
	details?: ApiValidationDetail[];
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
