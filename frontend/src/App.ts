import { defineComponent } from 'vue';
import { ImageItem } from './components';
import api from './services/api';
import type { ImageResponse } from './types';
import './style.css'
import template from './App.template.html?raw';

export default defineComponent({
    template: template,
    components: {
        ImageItem,
    },
    data() {
        return {
            images: [] as ImageResponse[],
            text: '',
            selectedFile: null as File | null,
            csrfToken: '',
            errorMessage: '',
            searchQuery: '',
        }
    },

    mounted() {
        this.fetchImages();
        document.addEventListener('paste', this.handlePaste);
    },

    beforeUnmount() {
        document.removeEventListener('paste', this.handlePaste);
    },

    methods: {
        async fetchImages() {
            try {
                this.images = await api.fetchImages();
            } catch (e) {
                console.error(e);
                this.errorMessage = (e as Error).message;
            }
        },
        async searchImages() {
            try {
                this.images = await api.searchImages(this.searchQuery);
                this.errorMessage = '';
            } catch (e) {
                console.error(e);
                this.errorMessage = (e as Error).message;
            }
        },

        async uploadImage() {
            if (!this.selectedFile) {
                this.errorMessage = 'Please select or paste an image to upload';
                return;
            }

            try {
                const formData = new FormData();
                formData.append('image', this.selectedFile);
                formData.append('text', this.text);

                const data = await api.uploadImage(formData);
                if (data.success) {
                    this.images.unshift(data.image);
                    this.selectedFile = null;
                    this.text = '';
                    (this.$refs.imageInput as HTMLInputElement).value = '';
                    this.errorMessage = '';
                    const canvas = (this.$refs.thumbnail as HTMLCanvasElement);
                    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
                } else {
                    for (var errField in data.errors) {
                        this.errorMessage += `${errField}: ${data.errors[errField]}\n`;
                    }
                }

            } catch (e) {
                console.error(e);
                this.errorMessage = (e as Error).message;
            }
        },
        canvasThumbnail(file: File) {
            const canvas = (this.$refs.thumbnail as HTMLCanvasElement);
            var reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => {
                var img = new Image();
                img.onload = () => {
                    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
                }
                if (event.target && event.target.result) {
                    if (typeof event.target.result === 'string') {
                        img.src = event.target.result;
                    } else {
                        console.error('Expected string result from FileReader')
                    }
                }
            }
            reader.readAsDataURL(file);
        },
        handlePaste(event: ClipboardEvent) {
            event.preventDefault();
            const clipboardData = event.clipboardData || (window as any).clipboardData;
            if (clipboardData.files && clipboardData.files.length > 0) {
                this.selectedFile = clipboardData.files[0];
                (this.$refs.imageInput as HTMLInputElement).files = clipboardData.files;
                this.canvasThumbnail(clipboardData.files[0]);
            } else {
                const text = clipboardData.getData('Text');
                if (text) {
                    this.text = text;
                }
            }
        },
        handleFileChange(event: Event) {
            const target = event.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
                this.selectedFile = target.files[0];
                this.canvasThumbnail(target.files[0]);
            }
        },
        triggerFileInput() {
            (this.$refs.imageInput as HTMLInputElement).click();
        }
    },
})
