<template>
  <div id="app">
    <Unsplash-bg></Unsplash-bg>
    <img src="./assets/logo.png">
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
};
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
