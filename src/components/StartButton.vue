<template>
  <div v-if="logo" class="startmenu__button logo" @click="fire">
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
      this.$parent.$parent.toggleWiggle();
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style  lang="scss">
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
      box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.75);
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

</style>
