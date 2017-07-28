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
.startmenu__button.logo {
  display: flex;
  flex-direction: column;
  justify-content: center;
  img {
    height: auto;
    width: 30px;
    background-color: white;
    border-radius: 50%;
    box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.75);
    &:hover {
      box-shadow: inset 0px 0px 42px 0px rgba(0, 0, 0, 0.75);
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

.wiggle {
  animation-duration: 500ms;
  animation-name: wiggle-7deg;
}

@-webkit-keyframes wiggle-7deg {
  40%,
  50%,
  60% {
    -webkit-transform: rotate(7deg);
    transform: rotate(7deg);
  }
  35%,
  45%,
  55%,
  65% {
    -webkit-transform: rotate(-7deg);
    transform: rotate(-7deg);
  }
  0%,
  30%,
  70%,
  100% {
    -webkit-transform: rotate(0);
    transform: rotate(0);
  }
}

@keyframes wiggle-7deg {
  40%,
  50%,
  60% {
    -webkit-transform: rotate(7deg);
    transform: rotate(7deg);
  }
  35%,
  45%,
  55%,
  65% {
    -webkit-transform: rotate(-7deg);
    transform: rotate(-7deg);
  }
  0%,
  30%,
  70%,
  100% {
    -webkit-transform: rotate(0);
    transform: rotate(0);
  }
}

</style>
