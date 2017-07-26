<template>
  <div class="grid">
    <div v-for="theme in themes" :key="theme.name">{{theme.name}}</div>
  </div>
</template>

<script>
export default {
  name: 'grid',
  data() {
    return {
      themes: [
        {
          name: 'this',
        },
        {
          name: 'this2',
        },
        {
          name: 'this3',
        },
      ],
    };
  },
};

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  .grid {
    justify-content: center;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr;
    grid-gap: 15px;
  }
</style>
