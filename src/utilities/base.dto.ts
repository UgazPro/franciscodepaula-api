export class DtoBaseResponse {
    message!: string;
    success!: boolean;
    data!: any;
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


