import type { ImageData, Tag, ApiSuccessResponse, ApiErrorResponse, ApiResponse } from '../types';

const API_BASE_URL = '/api';

export default {
    async fetchImages(): Promise<ImageData[]> {
        const response = await fetch(API_BASE_URL + '/images');
        if (!response.ok) {
          throw new Error('Failed to fetch images');
        }
        const data = await response.json();
        return data.object_list;
    },

    async searchImages(query: string): Promise<ImageData[]> {
        if (query === '') {
            return this.fetchImages();
        }
        const response = await fetch('/api/images', {
            method: 'POST',
            body: query,
        });
        if (!response.ok) {
            throw new Error('Failed to fetch images');
        }
        const data = await response.json();
        return data.object_list;
    },

    async uploadImage(formData: FormData): Promise<ApiResponse> {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.status == 201) {
            const data = await response.json()
            return data as ApiSuccessResponse;
        } else if (response.status < 500) {
            const data = await response.json()
            return data as ApiErrorResponse;
        } else {
          throw new Error('Upload failed');
        }
    },

    async fetchTags(): Promise<Tag[]> {
        const response = await fetch(API_BASE_URL + '/tags');
        if (!response.ok) {
          throw new Error('Failed to fetch tags');
        }
        const data = await response.json();
        return data.object_list;
    },
}
