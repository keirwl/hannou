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
    template: `
     <div class="image-item box">
        <img :src="image.image_file" :alt="image.tags.join(' ')" loading="lazy">
        <div class="image-tags">{{ image.tags.join(' ') }}</div>
        <div class="image-buttons">
            <div class="image-copy box">⎘</div>
            <div class="image-del box">ⓧ</div>
        </div>
     </div>
   `
})
