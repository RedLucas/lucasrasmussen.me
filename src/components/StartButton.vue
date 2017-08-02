<template>
  <div v-if="logo" class="startmenu__button logo" @click="fire" v-tooltip.top-end="'Click Here!'">
    <transition name="wiggle"
    enter-active-class="wiggle in"
    leave-active-class="wiggle out">
    <img src="../assets/img/lucasrasmussen-logo.svg">
  </transition>
  </div>
</template>

<script>
export default {
  name: 'start-button',
  data() {
    return {
      logo: 'true',
    };
  },
  methods: {
    fire() {
      this.$parent.$parent.toggleResume();
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style  lang="scss">
$box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.75);
.startmenu__button {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0px 10px;
  &.logo{
    img {
      height: auto;
      width: 27px;
      background-color: #FFE3A6;
      border-radius: 50%;
      transition: 0.25s box-shadow linear;
      box-shadow: $box-shadow;
      &:hover {
        box-shadow: inset 0px 0px 42px 0px rgba(0, 0, 0, 0.75);
      }
    }
  }
}

h1,
h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
$menu-background: linear-gradient(180deg, rgba(51, 51, 51, 0.52), rgba(0, 0, 0, 0.85));
.tooltip {
  display: block !important;
  padding: 4px;
  z-index: 10000;
  font-family: 'Lato';

  .tooltip-inner {
    background-image: $menu-background;;
    color: white;
    border-radius: 15px;
    padding: 5px 10px 4px;
    box-shadow: $box-shadow;
  }

  .tooltip-arrow {
    display: none;
  }

  &[aria-hidden='true'] {
    visibility: hidden;
    opacity: 0;
    transition: opacity .15s, visibility .15s;
  }

  &[aria-hidden='false'] {
    visibility: visible;
    opacity: 1;
    transition: opacity .15s;
  }
}

</style>
