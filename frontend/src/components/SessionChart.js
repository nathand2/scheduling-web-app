import { useEffect, useRef } from "react";
import * as d3 from "d3";
const util = require("../js/util");

const SessionChart = ({ timeRanges, session }) => {
  const canvas = useRef(null);

  // Abritrary scale for chart and bars
  const chartScale = 5;

  let doOnce = true;

  useEffect(() => {
    if (doOnce) {
      doOnce = false;
      generateChart();
    }
  }, [timeRanges]); // Will update chart if timeRanges changes

  const generateChart = () => {
    const ranges = processTimeRanges();
    drawBarChart(ranges);
  };
  const drawBarChart = (data) => {
    d3.select("svg").remove(); // Removes existing svg

    const sessionLengthInMinutes =
      ((session.dt_end - session.dt_start) / (1000 * 60)) * chartScale; // Session length in minutes
    console.log("sessionLengthInMinutes", sessionLengthInMinutes);
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const height = sessionLengthInMinutes + margin.top + margin.bottom;
    const width = 500 + margin.right;
    const barGap = 5;
    const barWidth = width / (data.length + 3) - barGap;
    const barColor = "lightgreen";
    const popupDimenX = 150
    const popupDimenY = 20
    const infoOffsetX = 10;
    const infoOffsetY = 10;        

    const svgCanvas = d3
      .select(canvas.current)
      .append("svg")
      .attr("class", "bar")
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid black");

    // Y-Axis Start
    // Create scale
    const yScale = d3
      .scaleTime()
      .domain([session.dt_start, session.dt_end])
      .range([margin.top, height - margin.bottom]); // This works kinda

    // Add scales to axis
    var yAxis = d3.axisLeft(yScale).ticks(20).tickSize(-width); // Lines across ticks

    // Add yAxis
    svgCanvas
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      //  .attr("transform", "translate(" + "0" + ",0)")
      .call(yAxis);

    svgCanvas.selectAll(".tick line").attr("stroke", "steelBlue");
    // Y-Axis End

    // Draw rects
    svgCanvas
      .append("g")
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
      .attr("opacity", "1")
      .on("mouseover", function (datapoint, i) {
        d3.select(this).transition().duration("50").attr("opacity", ".85");
      })
      .on("mouseout", function (d, i) {
        d3.select(this).transition().duration("50").attr("opacity", "1");
      });

    // Bar names
    svgCanvas
      .append("g")
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
      .text(function (d, i) {
        return d.display_name;
      })
      .attr("font-size", 12)
      .attr("text-anchor", "start")
      .attr("transform", function (d, i) {
        return "translate(" + 5 + ", " + 0 + ") " + "rotate(0)";
      });

      const drawCurrentTimeLine = () => {
        const currDate = new Date();
        if (session.dt_end < currDate || session.dt_start > currDate) {
          console.log("Not drawing currTime line");
          return;
        }
        console.log("Drawing currTime line");
        
        // Bar from top
        const minuteDifferenceFromNowToEnd =
          ((currDate - session.dt_start) / (1000 * 60)) * chartScale; // Get minute diff

        // Current time line
        svgCanvas
          .append("line")
          .attr("class", "currTime")
          .style("stroke", "red")
          .style("stroke-width", 1)
          .attr("x1", margin.left)
          .attr("y1", minuteDifferenceFromNowToEnd + margin.top)
          .attr("x2", width)
          .attr("y2", minuteDifferenceFromNowToEnd + margin.top);
  
        svgCanvas
          .append("line")
          .attr("class", "pointer")
          .style("stroke", "aqua")
          .style("stroke-width", 1)
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 0)
          .attr("y2", 0);

        svgCanvas
          .append("g")
          .attr("class", "info")
          .append("circle")
          .attr("class", "circle")
          .style('fill', 'red')
          .attr('r', 2)
          .attr("cx", 0 - 10)
          .attr("cy", 0 - 10)
        
          
        svgCanvas
          .selectAll("g.info")
          .append("rect")
          .attr("class", "info")
          .attr("width", popupDimenX)
          .attr("height", popupDimenY)
          .attr('fill', 'white')
          .attr('stroke', 'grey')
          .style("stroke-width", 1)
          .attr("rx", 6)
          .attr("ry", 6)
          .attr("x", -popupDimenX)
          .attr("y", -popupDimenY)

        svgCanvas
          .selectAll("g.info")
          .append("text")
          .attr("class", "info")
          .attr(
            "x", 0)
          .attr("y", 0)
          .attr("dy", "-0.35em")
          .attr("dx", -4)
          .text("Attending: 6  Maybe: 1")
          .attr("font-size", 12)
          .attr("text-anchor", "start")

          svgCanvas
          .on("mousemove", function(event){
            let pointer = d3.pointers(event);
            svgCanvas
              .selectAll("line.pointer")
              .attr("x1", margin.left)
              .attr("x2", width)
              .attr("y1", pointer[0][1])
              .attr("y2", pointer[0][1]);
            svgCanvas
              .selectAll("circle.circle")
              .attr("cx", pointer[0][0])
              .attr("cy", pointer[0][1])
            
            svgCanvas
              .selectAll("text.info")
              .attr("x", pointer[0][0] + infoOffsetX + 10)
              .attr("y", pointer[0][1] + infoOffsetY)
              .text(() => {
                return `Going: ?  Maybe: ?`
              })

            svgCanvas
              .selectAll("rect.info")
              .attr("x", pointer[0][0] + infoOffsetX)
              .attr("y", pointer[0][1] - 10 + infoOffsetY - popupDimenY / 2)
            
          })
          .on("mouseout", function(){  
            svgCanvas
              .selectAll("line.pointer")
              .attr("x1", 0)
              .attr("x2", 0)
              .attr("y1", 0)
              .attr("y2", 0);            

          })
          .on("mouseover", function(event){  
            let pointer = d3.pointers(event);
            svgCanvas
              .selectAll("line.pointer")
              .attr("x1", margin.left)
              .attr("x2", width)
              .attr("y1", pointer[0][1])
              .attr("y2", pointer[0][1]);
          })
      };
      
    const updateCurrentTimeLine = () => {
      const currDate = new Date();
      if (session.dt_end < currDate || session.dt_start > currDate) {
        console.log("Not drawing currTime line");
        return;
      }

      // Bar from top
      const minuteDifferenceFromNowToEnd =
        ((currDate - session.dt_start) / (1000 * 60)) * chartScale; // Get minute diff

      // Updates Current time line
      svgCanvas
        .selectAll("line.currTime")
        .style("stroke", "red")
        .attr("x1", margin.left)
        .attr("y1", minuteDifferenceFromNowToEnd + margin.top)
        .attr("x2", width)
        .attr("y2", minuteDifferenceFromNowToEnd + margin.top);
    };

    drawCurrentTimeLine();
    setInterval(updateCurrentTimeLine, 1000 * 30); // Draw line every 30s
  };

  // const getCurrentAttendence = (timeStamp) => {
  //   // console.log(timeStamp)
  //   let attendence = {
  //     going: 0,
  //     maybe: 0
  //   }
  //   for (let i = 0; i < timeRanges.length; i++) {
  //     let range = timeRanges[i]

  //     // if between to and height
  //     if (range.top < timeStamp < range.top + range.height) {
  //       attendence[range.status]++
  //     }
  //   }
  //   console.log(attendence)
  //   return timeStamp
  // }

  const processTimeRanges = () => {
    let ranges = [];
    timeRanges.map((range) => {
      const dtRangeStart = util.mySqlDtToJsDate(range.dt_start);
      const dtRangeEnd = util.mySqlDtToJsDate(range.dt_end);

      // Height of the bar
      const minuteRangeDifference = (dtRangeEnd - dtRangeStart) / (1000 * 60); // Get minute diff

      // Space from top of chart to top of bar
      const minuteStartDifference =
        (dtRangeStart - session.dt_start) / (1000 * 60); // Get minute diff from session start to dtrange start

      ranges.push({
        ...range,
        height: minuteRangeDifference * chartScale,
        top: minuteStartDifference * chartScale,
      });
    });
    console.log("Range stuff:", ranges);
    // setData(ranges)
    return ranges;
  };

  return (
    <div>
      <div className="canvas-container" ref={canvas}></div>
    </div>
  );
};

export default SessionChart;
