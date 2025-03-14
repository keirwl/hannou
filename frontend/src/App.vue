<template>
  <div class="app-container">
    <div class="upload-form">
      <form @submit.prevent="uploadImage">
        <input type="file" ref="imageInput" id="image_input" @change="handleFileChange">
        <!-- <label for="image_input"><button type="button">Select file</button></label> -->
        <canvas id="thumbnail" ref="thumbnail" height="30" width="30"></canvas>
        <input type="text" v-model="text" id="text_input" placeholder="Enter tags...">
        <button type="submit" :disabled="!selectedFile">Upload</button>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      </form>

      <div class="search-field">
        <input class="search-input" type="text" v-model="searchQuery" id="search_input" @input="searchImages" placeholder="Search...">
      </div>
    </div>

    <div class="image-gallery">
      <div v-for="image in images" :key="image.image_file" class="image-item">
        <img :src="image.image_file" :alt="image.tags.join(', ')">
        <div class="image-tags">{{ image.tags.join(', ') }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">

import { defineComponent } from 'vue';
import api from './services/api';
import type { ImageData } from './types';
import './style.css'

export default defineComponent({
   data() {
     return {
       images: [] as ImageData[],
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
        this.csrfToken = this.getCookie('csrftoken');
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
            this.errorMessage += `${errField}: ${data.errors[errField].join(', ')}\n`;
          }
        }

      } catch (e) {
        console.error(e);
        this.errorMessage = (e as Error).message;
      }
    },
    handlePaste(event: ClipboardEvent) {
      event.preventDefault();
      const clipboardData = event.clipboardData || (window as any).clipboardData;
      if (clipboardData.files && clipboardData.files.length > 0) {
        this.selectedFile = clipboardData.files[0];
        (this.$refs.imageInput as HTMLInputElement).files = clipboardData.files;
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
        reader.readAsDataURL(target.files[0]);
      }
    },
    getCookie(name: string): string {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
      return '';
    }
  },
})

</script>
