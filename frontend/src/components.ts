import { defineComponent, type PropType } from 'vue';
import type { ImageResponse } from './types';
import './components.css'

export const ImageItem = defineComponent({
    props: {
        image: {
            type: Object as PropType<ImageResponse>,
            required: true,
        }
    },
    data: function() {
        return {
            image_file: this.image.image_url.split("/")[2],
        }
    },
    methods: {
        imageCopy() {
            // browser only allows copying png to clipboard
            // have to write image to canvas to convert it.
            // will do this serverside later
            if (this.image.image_url === '') {
                // image already deleted
                return;
            }
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            img.onload = function() {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                ctx?.drawImage(img, 0, 0);
                canvas.toBlob(blob => {
                    if (blob == null) throw new Error('Error converting image to png');
                    navigator.clipboard.write([
                        new ClipboardItem({'image/png': blob})
                    ]);
                }, 'image/png')
            }
            img.src = this.image.image_url;
        },
        async imageDelete() {
            if (this.image.image_url === '') {
                // image already deleted
                return;
            }
            const url = '/api/images/' + this.image_file;
            const response = await fetch(url, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete image');
            }
            this.image.image_url = '';
            this.image.tags = ['deleted'];
        },
    },
    template: `
     <div class="image-item box">
        <img :src="image.image_url" :alt="image.tags.join(' ')" loading="lazy">
        <div class="image-tags">{{ image.tags.join(' ') }}</div>
        <div class="image-buttons">
            <div @click="imageCopy" class="image-copy box">⎘</div>
            <div @click="imageDelete" class="image-del box">ⓧ</div>
        </div>
     </div>
   `
})
