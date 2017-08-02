<template>
  <div class="start">
     <start-button></start-button>
     <start-actions></start-actions>
  </div>
</template>

<script>
import StartButton from './StartButton';
import StartActions from './StartActions';

export default {
  name: 'start-menu',
  components: {
    'start-button': StartButton,
    'start-actions': StartActions,
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
$menu-background: linear-gradient(180deg, rgba(51, 51, 51, 0.52), rgba(0, 0, 0, 0.85));
.start {
  position: fixed;
  height: 37px;
  bottom: 0;
  left: 0;
  right: 0;
  background-image: $menu-background;
  display: flex;
  justify-content: space-between;
}
</style>
