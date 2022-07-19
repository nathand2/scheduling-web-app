import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import SessionSelectRangeModal from "./SessionSelectRangeModal";
const util = require("../js/util");


const SessionChart = ({ timeRanges, session }) => {
  const canvas = useRef(null);
  const [barTimeRanges, setBarTimeRanges] = useState([])
  const [showSelectRangeModal, setShowSelectRangeModal] = useState(false);
  const [focusRange, setFocusRange] = useState(undefined)

  const handleCloseSelect = () => setShowSelectRangeModal(false);

  // Abritrary scale for chart and barTimeRanges
  const chartScale = 5;

  const showHoverInfo = false;

  let doOnce = true;

  useEffect(() => {
    if (doOnce) {
      const setUpChart =  async () => {
        doOnce = false;
        await generateChart();
      }
      setUpChart();
    }
  }, [timeRanges]); // Will update chart if timeRanges changes

  const generateChart = async () => {
    const ranges = await processTimeRanges();
    console.log("BarTimeRanges:", barTimeRanges)
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
    const barColors = {'maybe': 'orange', 'going': 'LightSkyBlue'}
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


    const setUpAxis = () => {
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

    }

    const setUpRects = () => {
      // Draw rects
      svgCanvas
        .append("g")
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("fill", (datapoint, iteration) => barColors[datapoint.status] ? barColors[datapoint.status] : "purple")
        .attr(
          "x",
          (datapoint, iteration) =>
            iteration * (barWidth + barGap) + margin.left + barGap
        )
        .attr("y", (datapoint) => datapoint.top + margin.top)
        .attr("width", barWidth)
        .attr("height", (datapoint) => datapoint.height)
        .attr("opacity", "1")
        // On bar mouseover, show info panel
        .on("mousemove", function (event, datapoint) {
          d3.select(this).transition().duration("50").attr("opacity", ".85");
          let pointer = d3.pointers(event)[0];
          svgCanvas
                .selectAll("text.rectinfo")
                .attr(
                  "x", 10 + pointer[0])
                .attr("y", 20 + pointer[1])
                .text(() => {
                  return `${datapoint.display_name}: ${datapoint.status}`
                })
  
          svgCanvas
            .selectAll("rect.rectinfo")
            .attr("x", pointer[0])
            .attr("y", pointer[1])
        })
        // On mouseout, hide info panel
        .on("mouseout", function (d, i) {
          d3.select(this).transition().duration("50").attr("opacity", "1");
          svgCanvas
          .selectAll("text.rectinfo")
          .attr("x", -popupDimenX)
          .attr("y", -popupDimenY)

          svgCanvas
            .selectAll("rect.rectinfo")
            .attr("x", -popupDimenX)
            .attr("y", -popupDimenY)
        })
        .on("click", function (event, datapoint) {
          console.log("Range clicked!")
          setFocusRange(datapoint)
          setShowSelectRangeModal(true)
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
      
      // Set up bar hover info elements
      svgCanvas
      .append("g")
      .attr("class", "rectinfo")

      // Info rect
      svgCanvas
          .selectAll("g.rectinfo")
          .append("rect")
          .attr("class", "rectinfo")
          .attr("width", popupDimenX)
          .attr("height", popupDimenY)
          .attr('fill', 'white')
          .attr('stroke', 'grey')
          .style("stroke-width", 1)
          .attr("rx", 6)
          .attr("ry", 6)
          .attr("x", -popupDimenX)
          .attr("y", -popupDimenX)
        // Info text
        svgCanvas
          .selectAll("g.rectinfo")
          .append("text")
          .attr("class", "rectinfo")
          .attr(
            "x", -infoOffsetX)
          .attr("y", -infoOffsetY)
          .attr("dy", "-0.35em")
          .attr("dx", -4)
          .text("Attending: 6  Maybe: 1")
          .attr("font-size", 12)
          .attr("text-anchor", "start")
    }

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
      };
    
    // Sets up line shown when mousing over chart
    const setUpHoverLine = () => {
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
            if (showHoverInfo) {

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
            }
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
    }
      
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

    setUpAxis();
    drawCurrentTimeLine();
    setUpHoverLine();
    setUpRects();
    setInterval(updateCurrentTimeLine, 1000 * 30); // Draw line every 30s
  };

  // const getCurrentAttendence = (timeStamp) => {
  //   let attendence = {
  //     going: 0,
  //     maybe: 0
  //   }

  //   // timeRanges.map((range) => {
  //   //   if (range.top < timeStamp < range.top + range.height) {
  //   //     attendence[range.status]++
  //   //   }
  //   // })
  //   console.log("Attendence in func", attendence)
  //   console.log("barTimeRanges in func", barTimeRanges)
  //   console.log("timeRanges in func", timeRanges)
  //   // return timeStamp
  //   return `Going: ?  Maybe: ?`
  // }

  const processTimeRanges = () => {
    let ranges = [];
    timeRanges.map((range) => {
      const dtRangeStart = range.dt_start;
      const dtRangeEnd = range.dt_end;

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
    setBarTimeRanges(ranges)
    return ranges;
  };

  return (
    <div>
      <SessionSelectRangeModal
        show={showSelectRangeModal}
        handleClose={handleCloseSelect}
        range={focusRange}
      />
      <div className="canvas-container" ref={canvas}></div>
    </div>
  );
};

export default SessionChart;
