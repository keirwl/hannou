import type { ImageResponse, Tag, ApiSuccessResponse, ApiErrorResponse, ApiResponse } from '../types';

export default {
    async fetchImages(): Promise<ImageResponse[]> {
        const response = await fetch('/api/images');
        if (!response.ok) {
          throw new Error('Failed to fetch images');
        }
        const data = await response.json();
        return data.object_list;
    },

    async searchImages(query: string): Promise<ImageResponse[]> {
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

    async deleteImage(image_file: string): Promise<ApiSuccessResponse> {
        const url = '/api/images/' + image_file;
        const response = await fetch(url, {
          method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete image');
        }
        const data = await response.json()
        return data as ApiSuccessResponse;
    },

    async updateImage(image_file: string, tags: string): Promise<ApiSuccessResponse> {
        const url = '/api/images/' + image_file;
        const response = await fetch(url, {
          method: 'POST',
          body: tags,
        });
        if (!response.ok) {
            throw new Error('Failed to update image');
        }
        const data = await response.json()
        return data as ApiSuccessResponse;
    },

    async fetchTags(): Promise<Tag[]> {
        const response = await fetch('/api/tags');
        if (!response.ok) {
          throw new Error('Failed to fetch tags');
        }
        const data = await response.json();
        return data.object_list;
    },
}
