import { defineComponent, type PropType } from 'vue';
import type { ImageResponse } from './types';

export const ImageItem = defineComponent({
    props: {
        image: {
            type: Object as PropType<ImageResponse>,
            required: true,
        }
    },
    template: `
     <div class="image-item">
        <img :src="image.image_file" :alt="image.tags.join(' ')" loading="lazy">
        <div class="image-tags">{{ image.tags.join(' ') }}</div>
        <div class="image-buttons">
            <div class="image-copy">⎘</div>
            <div class="image-del">ⓧ</div>
        </div>
     </div>
   `
})
