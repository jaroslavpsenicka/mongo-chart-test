<template>
  <div id="app">
    <RangeChooser @chosen="fetchData" :precisions="precisions" :ranges="ranges" />
    <Loader v-show="loading" />
    <Chart v-show="!loading" :values="values" />
  </div>
</template>

<script>

  import axios from "axios"; 
  import Chart from './Chart.vue';
  import RangeChooser from './RangeChooser.vue';
  import Loader from './Loader.vue';

  const calculateValues = (from, interval, values) => {
    return values.map((value, idx) => {
      return { timestamp: new Date((from + idx * interval) * 1000 / 2), value }
    });
  }

  export default {
    
    name: "app",
    components: {
      Chart, 
      RangeChooser,
      Loader
    },

    data() {
      return {
        loading: true,
        values: [],
        precisions: [{
          title: 'Low detail',
          value: 10
        }, {
          title: 'Standard detail',
          value: 60
        }, {
          title: 'High resolution',
          value: 200
        }],
        ranges: [{
          key: 'last-minutes',
          title: 'Last minutes',
          from: 1051123877,
          to: 1051124477
        }, {
          key: 'last-hour',
          title: 'Last hour',
          from: 1051120877,
          to: 1051124477
        }, {
          key: 'today',
          title: 'Today',
          from: 1051038077,
          to: 1051124477
        }, {
          key: 'this-week',
          title: 'This week',
          from: 1050519677,
          to: 1051124477
        }, {
          key: 'this-month',
          title: 'This month',
          from: 1048532477,
          to: 1051124477
        }, {
          key: 'this-year',
          title: 'This year',
          from: 1019588477,
          to: 1051124477
        }, {
          key: 'everything',
          title: 'Everything',
          from: 979675713,
          to: 1051124477
        }]
      }
    },

    created: function() {
      this.fetchData({ from: 1051123877, to: 1051124477, buckets: 10 });
    },

    methods: {
      fetchData: function({ from, to, buckets }) {
        console.log('Loading', buckets, 'records from', new Date(from * 1000), "to", new Date(to * 1000))
        this.loading = true
        axios.get(`/api/feed/from/${from}/to/${to}?buckets=${buckets}`)
          .then(response => {
            this.loading = false
            this.values = calculateValues(from, response.data.interval, response.data.values)
          }).catch(err => {
            console.log(err)
            this.loading = false
            this.error = err
          })
      }
    }
  }
</script>