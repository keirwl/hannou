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
