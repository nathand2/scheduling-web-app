import { useEffect, useRef } from "react";
import * as d3 from "d3";
const util = require("../js/util");

const SessionChart = ({ timeRanges, session }) => {
  const canvas = useRef(null);

  // Abritrary scale for chart and bars
  const chartScale = 5;

  useEffect(() => {
    console.log("useEffect")
    generateChart()
  }, [timeRanges])  // Will update chart if timeRanges changes

  const generateChart = () => {
    const ranges = processTimeRanges();
    drawBarChart(ranges);
  };
  const drawBarChart = (data) => {

    d3.select("svg").remove();  // Removes existing svg

    const sessionLengthInMinutes =
      ((session.dt_end - session.dt_start) / (1000 * 60)) * chartScale; // Session length in minutes
    console.log("sessionLengthInMinutes", sessionLengthInMinutes);
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const height =
      sessionLengthInMinutes + margin.top + margin.bottom;
    const width = 500;
    const barWidth = 80;
    const barGap = 5;
    const barColor = "lightgreen";
    const svgCanvas = d3
      .select(canvas.current)
      .append("svg")
      .attr("class", "bar")
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid black");

    // Y-Axis Start
    // Create scale
    const yScale = d3.scaleTime()
      .domain([session.dt_start, session.dt_end])
      .range([margin.top, height - margin.bottom]); // This works kinda

    // Add scales to axis
    var yAxis = d3.axisLeft(yScale).ticks(20).tickSize(-width); // Lines across ticks
    
    // Add yAxis
    svgCanvas
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      //  .attr("transform", "translate(" + "0" + ",0)")
      .call(yAxis)
    
    svgCanvas.selectAll(".tick line")
      .attr("stroke","steelBlue");
    // Y-Axis End

    // Draw rects
    svgCanvas.append("g")
      .attr("fill", barColor)
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr(
        "x",
        (datapoint, iteration) =>
          iteration * (barWidth + barGap) + margin.left + barGap
      )
      .attr("y", (datapoint) => datapoint.top + margin.top)
      .attr("width", barWidth)
      .attr("height", (datapoint) => datapoint.height)
      .attr('opacity', '1')
      .on('mouseover', function (datapoint, i) {
        d3.select(this).transition()
             .duration('50')
             .attr('opacity', '.85');
      })
      .on('mouseout', function (d, i) {
        d3.select(this).transition()
             .duration('50')
             .attr('opacity', '1');
      })

    // svgCanvas
    //   .selectAll("rect")
    //   .data(data)
    //   .enter()
    //   .append("rect")
    //   .attr("width", barWidth)
    //   .attr("height", (datapoint) => datapoint.height)
    //   .attr("rx", 5)
    //   .attr("ry", 5)
    //   .attr("fill", barColor)
    //   .attr(
    //     "x",
    //     (datapoint, iteration) =>
    //       iteration * (barWidth + barGap) + margin.left + barGap
    //   )
    //   .attr("y", (datapoint) => datapoint.top + margin.top)
    //   .on('mouseover', function (datapoint, i) {
    //     d3.select(this).transition()
    //          .duration('50')
    //          .attr('opacity', '.85');
    //   })
    //   .on('mouseout', function (d, i) {
    //     d3.select(this).transition()
    //          .duration('50')
    //          .attr('opacity', '1');
    //   })

    console.log("THE DATA:", data)

    svgCanvas.append("g")
      .attr("fill", "black")
      .attr("text-anchor", "end")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
    .selectAll("text")
    .data(data)
    .join("text")
      .attr(
        "x",
        (datapoint, iteration) =>
          iteration * (barWidth + barGap) + margin.left + barGap
      )
      .attr("y", (datapoint) => margin.top + 10 + datapoint.top)
      .attr("dy", "0.35em")
      .attr("dx", -4)
      .text(function(d, i) { return d.display_name; })
      .attr('font-size', 12)
      .attr('text-anchor', 'start')
      .attr("transform",function(d,i){ 
        return "translate(" + 5 + ", " + 0 + ") " + "rotate(0)"})
      ;
  };

  const processTimeRanges = () => {
    console.log("Session:", session);
    let ranges = [];
    timeRanges.map((range) => {
      const dtRangeStart = util.mySqlDtToJsDate(range.dt_start);
      const dtRangeEnd = util.mySqlDtToJsDate(range.dt_end);

      // Height of the bar
      const minuteRangeDifference = (dtRangeEnd - dtRangeStart) / (1000 * 60); // Get minute diff

      // Space from top of chart to top of bar
      const minuteStartDifference =
        (dtRangeStart - session.dt_start) / (1000 * 60); // Get minute diff
      console.log("minuteRangeDifference:", minuteRangeDifference);
      console.log("minuteStartDifference:", minuteStartDifference);

      ranges.push({
        ...range,
        height: (minuteRangeDifference) * chartScale,
        top: (minuteStartDifference) * chartScale
      });
    });
    console.log("Range stuff:", ranges);
    // setData(ranges)
    return ranges;
  };

  return (
    <div>
      {/* <Button onClick={generateChart}>Draw chart</Button> */}
      {/* <Button onClick={generateGanttChart}>Draw Gantt chart</Button> */}
      <div className="canvas-container" ref={canvas}></div>
    </div>
  );
};

export default SessionChart;
