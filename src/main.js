// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import VueResource from 'vue-resource';
import VTooltip from 'v-tooltip';
import App from './App';
import router from './router';

Vue.use(VTooltip);
Vue.use(VueResource);

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App },
  data() {
    return {
      resume: {},
      resumeUrl: '//registry.jsonresume.org/redlucas',
    };
  },
  mounted() {
    let resume = JSON.parse(window.localStorage.getItem('lucas-resume'));
    if (resume) {
      this.resume = resume;
      return;
    }
    resume = this.$resource(`${this.resumeUrl}.json`);
    resume.get().then((response) => {
      this.resume = response.body;
      window.localStorage.setItem('lucas-resume', JSON.stringify(response.body));
    });
  },
});
