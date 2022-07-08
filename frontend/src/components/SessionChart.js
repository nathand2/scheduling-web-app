import { useEffect, useState, useRef } from 'react'
import * as d3 from 'd3'

const SessionChart = () => {

  const [data, setData] = useState([ 2, 4, 2, 6, 8 ])
  const canvas = useRef(null)

  // const [onEffectOnce, setOnEffectOnce] = useState(true)
  let stop = false

  useEffect(() => {
    if (!stop) {
      stop = true
      drawBarChart(data)
    }
  }, [])

  const drawBarChart = (data) => {
    const canvasHeight = 400
    const canvasWidth = 500
    const scale = 20
    const svgCanvas = d3.select(canvas.current)
      .append('svg')
      .attr("class", "bar")
      .attr('width', canvasWidth)
      .attr('height', canvasHeight)
      .style('border', '1px solid black')
    svgCanvas.selectAll('rect')
      .data(data).enter()
      .append('rect')
      .attr('width', 40)
      .attr('height', (datapoint) => datapoint * scale)
      .attr('fill', 'orange')
      .attr('x', (datapoint, iteration) => iteration * 45)
      .attr('y', (datapoint) => 0)

    svgCanvas.selectAll('text')
    .data(data).enter()
        .append('text')
        .attr('x', (dataPoint, i) => i * 45 + 10)
        .attr('y', (dataPoint, i) => canvasHeight - dataPoint * scale - 10)
        .text(dataPoint => dataPoint)
  }

  return (
    <div>
      <div className="canvas-container" ref={canvas}></div>
    </div>
  )
}

export default SessionChart