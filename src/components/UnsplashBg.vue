<template>
  <transition name="fade">
  <div v-if="imgSrc" v-bind:style="{backgroundImage: 'url(' + imgSrc + ')'}" class="unsplash-bg"></div>
  </transition>
</template>

<script>
import Unsplash from 'unsplash-js';

const unsplash = new Unsplash({
  applicationId: '5fda81bc223a576f33934dd4dee20cf2217f2777f798c4c0f1e00e377cba5bcc',
  secret: '393006023f1cb2e62a723a43b018717cb98fdd396367cda6cf161d8228e3d80',
  callbackUrl: 'urn:ietf:wg:oauth:2.0:oob',
});
/* eslint-disable */
export default {
  name: 'UnsplashBg',
  data() {
    return {
      msg: 'Welcome to Your Vue.js App',
      unsplash,
      imgSrc: '',
    };
  },
  mounted() {
    const vm = this;
    let imgCache = window.localStorage.getItem('lucas-unsplash');
    if (imgCache) {
      this.imgSrc = imgCache;
      return;
    }
    let promise = this.unsplash.photos.getRandomPhoto();
    promise
      .then(res => res.json())
      .then(function(value){
        let image = new Image();
        let url = value.urls.full;
        image.onload = () => {
          window.localStorage.setItem('lucas-unsplash', url);
          vm.imgSrc = url;
        }
        image.src = url;
      });
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .unsplash-bg {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-size: cover;
  }
  .fade-enter-active, .fade-leave-active {
    transition: opacity 1.5s
  }
  .fade-enter, .fade-leave-to {
    opacity: 0
  }
</style>
