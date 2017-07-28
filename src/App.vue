<template>
  <div id="app">
    <Unsplash-bg></Unsplash-bg>
    <img :class="{'wiggle': logo.wiggle}" src="./assets/img/lucasrasmussen-logo.svg">
    <router-view></router-view>
    <start-menu></start-menu>
  </div>
</template>

<script>
import StartMenu from './components/StartMenu';
import UnsplashBg from './components/UnsplashBg';

export default {
  name: 'app',
  components: {
    StartMenu,
    UnsplashBg,
  },
  methods: {
    wiggleOff() {
      this.logo.wiggle = false;
    },
    toggleWiggle() {
      const vm = this;
      function toggleWiggle() {
        vm.logo.wiggle = !vm.logo.wiggle;
        vm.$el.removeEventListener('animationend', toggleWiggle);
      }
      vm.$el.addEventListener('animationend', toggleWiggle);
      vm.logo.wiggle = !vm.logo.wiggle;
    },
  },
  data() {
    return {
      logo: {
        wiggle: false,
        pulse: false,
      },
    };
  },
};
</script>

<style lang="scss">
/* @import 'motion-ui/motion-ui.scss'; */
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  display: flex;
  align-content: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(to right, #e44d26, #f16529);
  > img {
    align-self: center;
    box-shadow: 0px 0px 42px 0px rgba(0,0,0,0.75), inset 0px 0px 5px 0px rgba(0,0,0,0.75);
    border-radius: 50%;
    background: white;
    position: relative;
    z-index: 1;
  }
}
</style>
