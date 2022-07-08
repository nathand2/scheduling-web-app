import { useEffect, useState, useRef } from 'react'
import Button from "react-bootstrap/Button";
import * as d3 from 'd3'
const util = require("../js/util");

const SessionChart = ({ timeRanges, session }) => {

  // const [data, setData] = useState([])
  const canvas = useRef(null)

  const chartScale = 5;

  // const [onEffectOnce, setOnEffectOnce] = useState(true)
  let stop = false

  useEffect(() => {
    if (!stop) {
      stop = true
      // processTimeRanges(timeRanges)
      // drawBarChart(data)
    }
  }, [])

  const generateChart = () => {
    const ranges = processTimeRanges()
    drawBarChart(ranges)
  }

  const drawBarChart = (data) => {
    const sessionLengthInMinutes = (session.dt_end - session.dt_start) / (1000 * 60) * chartScale // Session length in minutes
    console.log("sessionLengthInMinutes", sessionLengthInMinutes)
    const canvasHeight = sessionLengthInMinutes
    const canvasWidth = 500
    const barWidth = 80
    const barGap = 5
    const barColor = 'lightblue'
    const svgCanvas = d3.select(canvas.current)
      .append('svg')
      .attr("class", "bar")
      .attr('width', canvasWidth)
      .attr('height', canvasHeight)
      .style('border', '1px solid black')
    svgCanvas.selectAll('rect')
      .data(data).enter()
      .append('rect')
      .attr('width', barWidth)
      .attr('height', (datapoint) => datapoint.height)
      .attr('fill', barColor)
      .attr('x', (datapoint, iteration) => iteration * (barWidth + barGap))
      .attr('y', (datapoint) => datapoint.top)

    // svgCanvas.selectAll('text')
    // .data(data).enter()
    //     .append('text')
    //     .attr('x', (dataPoint, i) => i * 45 + 10)
    //     .attr('y', (dataPoint, i) => canvasHeight - dataPoint * scale - 10)
    //     .text(dataPoint => dataPoint)
  }

  const processTimeRanges = () => {
    console.log("Session:", session)
    let ranges = []
    timeRanges.map((range) => {
      const dtRangeStart = util.mySqlDtToJsDate(range.dt_start)
      const dtRangeEnd = util.mySqlDtToJsDate(range.dt_end)

      // Height of the bar
      const minuteRangeDifference = (dtRangeEnd - dtRangeStart) / (1000 * 60)  // Get minute diff
      
      // Space from top of chart to top of bar
      const minuteStartDifference = (dtRangeStart - session.dt_start) / (1000 * 60)  // Get minute diff
      console.log("minuteRangeDifference:", minuteRangeDifference)
      console.log("minuteStartDifference:", minuteStartDifference)

      ranges.push({height: Math.trunc(minuteRangeDifference) * chartScale, top: Math.trunc(minuteStartDifference) * chartScale})
    })
    console.log("Range stuff:", ranges)
    // setData(ranges)
    return ranges
  }

  return (
    <div>
      <Button onClick={generateChart} >Draw chart</Button>
      <div className="canvas-container" ref={canvas}></div>
    </div>
  )
}

export default SessionChart