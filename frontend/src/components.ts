import { defineComponent, type PropType } from 'vue';
import api from './services/api';
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
            image_file: this.image.image_url.split('/').pop() ?? '',
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
            try {
                await api.deleteImage(this.image_file);
                this.image.image_url = '';
                this.image.tags = ['deleted'];
            } catch (e) {
                console.error(e);
            }
        },
        async sendTags() {
            if (this.image.image_url === '') {
                // image already deleted
                return;
            }
            const elem = this.$refs.tags as HTMLDivElement;
            const tags = elem.innerText;
            try {
                await api.updateImage(this.image_file, tags);
            } catch (e) {
                console.error(e);
            }
            elem.blur();
        }
    },
    template: `
     <div class="image-item box">
        <img :src="image.image_url" :alt="image.tags.join(' ')" loading="lazy">
        <div ref="tags" class="image-tags" contenteditable="plaintext-only" @keydown.enter.prevent="sendTags">{{ image.tags.join(' ') }}</div>
        <div class="image-buttons">
            <div @click="imageCopy" class="image-copy box">⎘</div>
            <div @click="imageDelete" class="image-del box">ⓧ</div>
        </div>
     </div>
   `
})
