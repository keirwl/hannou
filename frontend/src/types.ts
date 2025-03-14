export interface ImageData {
  image_file: string;
  updated_at: string;
  tags: string[];
}

export interface Tag {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

export type ApiSuccessResponse = {
    success: true;
    updated: boolean;
    image: ImageData;
}

export type ApiErrorResponse = {
    success: false;
    errors: string[];
}

export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;
