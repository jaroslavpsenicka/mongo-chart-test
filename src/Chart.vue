<template>
  <div>
    <svg></svg>
  </div>
</template>

<script>
import * as d3 from "d3";
import _ from "lodash";

export default {

  props: ["values"],
  
  data() {
    return {
      chart: null
    };
  },

  watch: {
    values(val) {
      if (this.chart != null) {
        d3.selectAll("g").remove();
        d3.selectAll("path").remove();
        this.chart.remove();
      }
      this.renderChart(val);
    }
  },

  methods: {
    renderChart(data) {
      const margin = 60;
      const svg_width = 1000;
      const svg_height = 600;
      const width = 1000 - 2 * margin;
      const height = 600 - 2 * margin;

      const svg = d3
        .select("svg")
        .attr("style", "display: block; margin: 0 auto;")
        .attr("width", svg_width)
        .attr("height", svg_height);

      this.chart = svg
        .append("g")
        .attr("transform", `translate(${margin}, ${margin})`);

      // X axis
      var x = d3.scaleTime()
        .domain(d3.extent(data, function(d) { return d.timestamp }))
        .range([ 0, width ]);
      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%Y-%m-%d %H:%M:%S")));

      // Y axis
      var y = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return +d.value; })])
        .range([ height, 0 ])
      svg.append("g")
        .call(d3.axisLeft(y).ticks(10));

      // Values
      svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "gray")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
          .x(function(d) { return x(d.timestamp) })
          .y(function(d) { return y(d.value) })
        )
    }
  }
}
</script>
