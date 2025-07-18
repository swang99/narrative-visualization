import { createTextBlock, drawTrendLine } from './chartUtil.js';

// declare chart dimensions and margins
const width = 832, height = 400;
const marginTop = 20, marginRight = 20, marginBottom = 30, marginLeft = 40;

function startStory() {
	const section = d3.select(".header-text")
	const baseTime = 100, stepTime = 10, initDelay = 10, transDuration = 1000;
	const startDate = new Date("2007-12-01"), endDate = new Date("2008-10-20");
	
	// header
	createTextBlock({
		html: section,
		header: "h2",
		displayText: "A big financial decision awaits you...",
		transDuration: transDuration,
		numWaits: 0,
		color: "#d62828",
		opacityOff: true
	});

	createTextBlock({
		html: section,
		displayText: "It's October 2008, and you just received a $100K inheritance.",
		transDuration: transDuration,
		numWaits: 1,
		color: "#666666"
	});

	createTextBlock({
		html: section,
		displayText: "Stocks are falling like a knife. Recession chatter is everywhere.",
		transDuration: transDuration,
		numWaits: 2,
		color: "#666666"
	});

	// line chart
	const svg = section.append("svg")
    	.attr("id", "line-chart")
		.style("opacity", 0);

	d3.json("data/spy_prices.json").then(data => {
	    data.values.forEach(d => {
		  d.datetime = new Date(d.datetime);
		  d.close = +d.close;
		}
	)
	
	const filtered_spy = data.values.filter(d => (d.datetime <= endDate) & (d.datetime >= startDate));

	svg.transition()
		.delay(baseTime * (initDelay + stepTime * 4))
		.duration(transDuration)
		.on("end", () => {
			drawLineChart(filtered_spy);
		})
	
	// show action buttons
	const strategyButtons = d3.select(".strategy-buttons")
	strategyButtons.transition()
		.delay(baseTime * (initDelay + stepTime * 15))
		.duration(transDuration)
	 	.style("opacity", 1)
		.style("background-color", "#ffc107")
		.style("padding", "10px")
		.style("border-radius", "10px")
		.style("width", `${width}px`);
	});
}

function drawLineChart(data) {
	// define x and y scales
	const x = d3.scaleUtc(d3.extent(data, d => d.datetime), [marginLeft, width - marginRight]);
	const y = d3.scaleLinear([85, d3.max(data, d => d.close)], [height - marginBottom, marginTop]);

	// declare line generator
	const line = d3.line()
		.x(d => x(d.datetime))
		.y(d => y(d.close));

	// create SVG container and inject SPY data
	const svg = d3.select("svg")
	  .attr("width", width)
	  .attr("height", height)
	  .attr("viewBox", [0, 0, width, height])
	  .style("max-width", "100%")
	  .style("height", "auto")

	// add the x and y-axis
	svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

	svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(height / 40))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
          .attr("x2", width - marginLeft - marginRight)
          .attr("stroke-opacity", 0.1))
      .call(g => g.append("text")
          .attr("x", -marginLeft)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text("↑ Weekly close ($)"));

	svg.transition()
	   .duration(1000)
	   .style("opacity", 1);
	
	// append path for the line
	const path = svg.append("path")
		.datum(data)
		.attr("fill", "none")
		.attr("stroke", "#0077cc")
		.attr("stroke-width", 2)
		.attr("d", line);
	
	drawTrendLine(path, 5000);
	return svg.node();
}

startStory();
