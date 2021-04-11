<template>
  <div class="mb-2">
    Display:
    <select @change="chosen($event)" v-model="range">
      <option v-for="range in ranges" :key="range.key" :value="range.key">
        {{range.title}}
      </option>
    </select>
    <select @change="chosen($event)" v-model="precision">
      <option v-for="precision in precisions" :key="precision.value" :value="precision.value">
        {{precision.title}}
      </option>
    </select>
  </div>
</template>

<script>
export default {

  props: ["ranges", "precisions"],
  emits: ['chosen'],

  data: function() {
    return {
      precision: this.precisions[0].value,
      range: this.ranges[0].key
    }
  },

  methods: {
    chosen: function(event) {
      const range = this.ranges.find(o => o.key === this.range)
      this.$emit('chosen', { ...range, buckets: this.precision })
    }
  }
}
</script>

<style scoped>
  .mb-2 {
    margin-bottom: 20px;
  }
</style>