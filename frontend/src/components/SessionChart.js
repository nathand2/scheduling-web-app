import { useEffect, useState, useRef } from "react";
import Button from "react-bootstrap/Button";
import * as d3 from "d3";
const util = require("../js/util");

const SessionChart = ({ timeRanges, session }) => {
  const canvas = useRef(null);

  const chartScale = 5;

  // const [onEffectOnce, setOnEffectOnce] = useState(true)
  let stop = false;

  // useEffect(() => {
  //   if (!stop) {
  //     stop = true
  //     const ranges = processTimeRanges()
  //     drawBarChart(ranges)
  //   }
  // }, [timeRanges])

  const generateDateTicks = () => {
    let ticks = []
    // timeRanges.map((range) => {

    // })
    let currentDate;
    for (let i = 0; i < timeRanges.length; i++) {
      if (!currentDate) {
        ticks.push(currentDatetoLocaleDateString(undefined, options))
      }
    }
  }

  const generateChart = () => {
    const ranges = processTimeRanges();
    drawBarChart(ranges);
  };

  const drawBarChart = (data) => {
    const sessionLengthInMinutes =
      ((session.dt_end - session.dt_start) / (1000 * 60)) * chartScale; // Session length in minutes
    console.log("sessionLengthInMinutes", sessionLengthInMinutes);
    const canvasMargin = { top: 20, right: 30, bottom: 30, left: 40 };
    const canvasHeight =
      sessionLengthInMinutes + canvasMargin.top + canvasMargin.bottom;
    const canvasWidth = 500;
    const barWidth = 80;
    const barGap = 5;
    const barColor = "lightblue";
    const svgCanvas = d3
      .select(canvas.current)
      .append("svg")
      .attr("class", "bar")
      .attr("width", canvasWidth)
      .attr("height", canvasHeight)
      .style("border", "1px solid black");

    // Y-Axis Start
    // Create scale
    var yScale = d3
      .scaleLinear()
      .domain([0, sessionLengthInMinutes])
      .range([canvasMargin.top, canvasHeight - canvasMargin.bottom]); // This works kinda

    // Add scales to axis
    var yAxis = d3.axisLeft().scale(yScale).tickSize(-canvasWidth); // Lines across ticks
    
    svgCanvas
      .append("g")
      .attr("transform", `translate(${canvasMargin.left}, 0)`)
      //  .attr("transform", "translate(" + "0" + ",0)")
      .call(yAxis)
    
    svgCanvas.selectAll(".tick line")
      .attr("stroke","steelBlue");
    // Y-Axis End

    // Draw rects
    svgCanvas
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("width", barWidth)
      .attr("height", (datapoint) => datapoint.height)
      .attr("fill", barColor)
      .attr(
        "x",
        (datapoint, iteration) =>
          iteration * (barWidth + barGap) + canvasMargin.left
      )
      .attr("y", (datapoint) => datapoint.top);

    
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
        height: Math.trunc(minuteRangeDifference) * chartScale,
        top: Math.trunc(minuteStartDifference) * chartScale,
      });
    });
    console.log("Range stuff:", ranges);
    // setData(ranges)
    return ranges;
  };

  return (
    <div>
      <Button onClick={generateChart}>Draw chart</Button>
      <div className="canvas-container" ref={canvas}></div>
    </div>
  );
};

export default SessionChart;
