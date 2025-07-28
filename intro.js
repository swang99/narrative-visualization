import { 
	createTextBlock, drawTrendLine, 
	linkFadeOut, investDateAnnotate, 
	formatDate, formatValue
} from './chartUtil.js';

// declare chart dimensions and margins
const width = 832, height = 300;
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
		highlight: false,
		color: "#0077cc",
		opacityOff: true
	});

	createTextBlock({
		html: section,
		displayText: "It's October 2008, and you just received a $100K inheritance.",
		transDuration: transDuration,
		numWaits: 2,
		highlight: false,
		color: "#666666"
	});

	createTextBlock({
		html: section,
		displayText: "Stocks are falling like a knife. Recession chatter is everywhere.",
		transDuration: transDuration,
		numWaits: 2,
		highlight: false,
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
		})
	
		const filtered_spy = data.values.filter(d => (d.datetime <= endDate) & (d.datetime >= startDate));
		filtered_spy.sort((a, b) => a.datetime - b.datetime);

		svg.transition()
			.delay(baseTime * (initDelay + stepTime * 4))
			.duration(transDuration)
			.on("end", () => {
				drawLineChart(filtered_spy);
			})
		
		// show action buttons
		const strategyButtons = d3.select(".strategy-buttons")
			.style("opacity", 0)

		strategyButtons.transition()
			.delay(baseTime * (initDelay + stepTime * 5))
			.duration(transDuration)
			.style("opacity", 0.8)
			.style("background-color", "#bae2ffff")
			.style("padding", "10px")
			.style("border-radius", "10px")
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
	  .on("pointerenter pointermove", pointermoved)
	  .on("pointerleave", pointerleft)
	  .on("touchstart", event => event.preventDefault());

	// add the x and y-axis
	svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))

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
          .text("↑ Weekly close ($)"))

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

	// create the tooltip container.
	const tooltip = svg.append("g");
	
	// Add the event listeners that show or hide the tooltip.
	function pointermoved(event) {
		svg.selectAll(".hover-annotation").remove();

		const hoveredDate = x.invert(d3.pointer(event)[0]);
		const bisect = d3.bisector(d => d.datetime).center;
		const iLump = bisect(data, hoveredDate);
		const currDate = data[iLump]?.datetime || hoveredDate;
		
		tooltip.style("display", null);
		tooltip.attr("transform", `translate(130, 130)`);

		investDateAnnotate(svg, x, marginTop, marginBottom, height, currDate, null);

		const path = tooltip.selectAll("path")
		.data([,])
		.join("path")
			.attr("fill", "white")
			.attr("stroke", "black");

		

		const text = tooltip.selectAll("text")
			.data([,])
			.join("text")
			.style("font-size", "12px")
			.style("opacity", 0.9)
			.call(text => text
				.selectAll("tspan")
				.data([
					formatDate(currDate),
					`Price: $${data[iLump].close ? data[iLump].close.toFixed(2) : '–'}`
				])
				.join("tspan")
				.attr("x", 0)
				.attr("y", (_, i) => `${i * 1.1}em`)
				.attr("font-weight", (_, i) => i ? null : "bold")
				.text(d => d));

		size(text, path);
		tooltip.raise();
	}

	function pointerleft() { return; }

	// Wraps the text with a callout path of the correct size, as measured in the page.
	function size(text, path) {
		const {x, y, width: w, height: h} = text.node().getBBox();
		text.attr("transform", `translate(${-w / 2},${15 - y})`);
		path.attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
	}
	
	drawTrendLine(path, 4000);
	return svg.node();
}

startStory();
linkFadeOut();