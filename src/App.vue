<template>
  <div id="app">
    <Unsplash-bg></Unsplash-bg>
    <div :class="{'modal': true, 'logo': !resume, 'resume': resume}">
      <transition name="fade">
        <img v-if="!resumeUrl" :class="{'wiggle': logo.wiggle, 'pulser': logo.pulser}" src="./assets/img/lucasrasmussen-logo.svg">
      </transition>
      <transition name="fade">
        <iframe @load="showResume" v-if="resumeUrl" v-show="resumeReady" :src="resumeUrl + '?theme=flat'"></iframe>
      </transition>
    </div>
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
    showResume() {
      this.resumeReady = true;
    },
    wiggleOff() {
      this.logo.wiggle = false;
    },
    toggleWiggle() {
      const vm = this;
      function toggledWiggle() {
        vm.logo.wiggle = !vm.logo.wiggle;
        vm.$el.removeEventListener('animationend', toggledWiggle);
      }
      vm.$el.addEventListener('animationend', toggledWiggle);
      vm.logo.wiggle = !vm.logo.wiggle;
    },
    toggleResume() {
      const vm = this;
      function toggledResume() {
        vm.resumeUrl = vm.$parent.resumeUrl;
        vm.$el.removeEventListener('transitionend', toggledResume);
      }
      vm.$el.addEventListener('transitionend', toggledResume);
      this.resume = true;
    },
  },
  data() {
    return {
      logo: {
        wiggle: false,
        pulser: true,
      },
      resume: false,
      resumeUrl: false,
      resumeReady: false,
    };
  },
};
</script>

<style scoped lang="scss">
$popup-background: white;
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(to right, #e44d26, #f16529);
}
.modal {
  background: $popup-background;
  transition: all 0.5s linear;
  box-shadow: 0px 0px 42px 0px rgba(0,0,0,0.75), inset 0px 0px 5px 0px rgba(0,0,0,0.75);
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  iframe {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
  > img {
    border-radius: 50%;
  }
}
.logo {
  transition: background-color 0.5s linear;
  border-radius: 50%;
  width: 100px;
  height: 100px;
  > img {
    transition: background-color 0.5s linear;
    width: 100%;
    height: auto;
  }
}
.resume {
  border-radius: 15px;
  min-width: 80vw;
  max-width: 100%;
  min-height: 80vh;
}
.wiggle {
  animation-duration: 500ms;
  animation-name: wiggle-7deg;
}

.pulser {
  animation-name: pulser;
  animation-duration: 5000ms;
  animation-iteration-count: infinite;
}

.wiggle.pulser {
  animation: pulser 5000ms infinite, wiggle-7deg 500ms;
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

@keyframes pulser {
  0% {
    background-color: white;
  }
  55% {
    background-color: #FFE3A6;
  }
  100% {
    background-color: white;
  }
}
</style>
