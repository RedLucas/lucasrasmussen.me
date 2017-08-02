<template>
  <div v-if="logo" class="startmenu__actions" >
    <i v-for="action in actions" v-if="action.icon" :key="action.name" @click="action.action" :class="[action.icon, 'fa']"  v-tooltip.top-start="action.tooltip"></i>
  </div>
</template>

<script>
export default {
  name: 'start-button',
  data() {
    return {
      logo: 'true',
      actions: [
        {
          name: 'Clear Cache',
          action: this.clearCache,
          icon: 'fa-shower',
          tooltip: 'Clean Caches',
        },
      ],
    };
  },
  methods: {
    fire() {
      this.$parent.$parent.toggleResume();
    },
    clearCache() {
      window.localStorage.clear();
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style  lang="scss">
.startmenu__actions {
  display: flex;
  align-items: center;
  padding-right: 1rem;
  > i {
    color: white;
    font-size: 1.5rem;
  }
}
</style>
