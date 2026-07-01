export class DtoBaseResponse {
    message!: string;
    success!: boolean;
    data!: unknown;
}

export const baseResponse: DtoBaseResponse = {
    message: '',
    success: true,
    data: null
}

export const badResponse: DtoBaseResponse = {
    message: 'Ha ocurrido un error: ',
    success: false,
    data: null
}

export interface PaginationMeta {
    page: number;
    take: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface PaginatedResult<T> {
    data: T[];
    meta: PaginationMeta;
}

export interface PaginationParams {
    page?: number;
    take?: number;
}


