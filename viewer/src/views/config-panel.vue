<template>
  <div class="config-panel">
    <div class="panel-title">
      Render configuration
    </div>
    <Config :config="appConfig"/>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import Config from '../components/conf/config.vue';
@Component({
  components:{
    Config
  }
})
export default class ConfigPanel extends Vue {
  @Prop() appConfig;
}
</script>

<style scoped lang="scss">
.panel-title{
  font-weight: bold;
  padding: 5px;
  font-size: 16px;
}

.config-panel{
  border: 1px solid #ddd;
}

</style>
