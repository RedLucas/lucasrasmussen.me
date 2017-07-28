<template>
  <div class="start">
     <start-button></start-button>
  </div>
</template>

<script>
import StartButton from './StartButton';

export default {
  name: 'start-menu',
  components: {
    'start-button': StartButton,
  },
  data() {
    return {
      msg: 'Welcome to Your Vue.js App',
    };
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.start {
  position: fixed;
  height: 37px;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to bottom, rgb(47, 47, 47)  0%,#000000 100%);
  display: flex;

}
</style>
