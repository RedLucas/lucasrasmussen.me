<template>
  <div v-if="imgSrc" :style="{backgroundImage: imgSrc}" class="unsplash-bg"></div>
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
      imgSrc: false,
    };
  },
  mounted() {
    const vm = this;
    this.unsplash.photos.getRandomPhoto().then(function (response) {
      vm.imgSrc = response.url;
    });
    /* eslint-disable */
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
</style>
