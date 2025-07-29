import { 
	createTextBlock, drawTrendLine, 
	linkFadeOut, investDateAnnotate, 
	formatDate,
	fadeIn
} from './chartUtil.js';

// declare chart configurations
const chartConfig = {
	width: 832,
	height: 300,
	margin: { top: 20, right: 20, bottom: 30, left: 40 },
	time: { base: 100, step: 10, initDelay: 10, duration: 1000 },
	startDate: new Date("2008-08-11"),
	endDate: new Date("2008-10-20")
};

function startStory() {
	// header
	const section = d3.select(".header-text")
	const introTextBlocks = [
		{
			header: "h2",
			displayText: "A big financial decision awaits you...",
			numWaits: 0,
			highlight: false
		},
		{
			displayText: "It's October 2008, and you just received a $100K inheritance.",
			numWaits: 2,
			highlight: false
		},
		{
			displayText:  "Stocks are falling like a knife. Recession chatter is everywhere.",
			color: "#666666",
			numWaits: 2,
			highlight: false
		}
	]
	
	introTextBlocks.forEach((block) => {
		createTextBlock({
			html: section,
			header: block.header,
			displayText: block.displayText,
			color: block.color,
			transDuration: chartConfig.time.duration,
			numWaits: block.numWaits,
			highlight: block.highlight
		});
	})

	// line chart
	const svg = section.append("svg")
    	.attr("id", "line-chart")
		.style("opacity", 0);

	d3.json("data/spy_prices.json").then(data => {
	    data.values.forEach(d => {
		  d.datetime = new Date(d.datetime);
		  d.close = +d.close;
		})
	
		const filtered_spy = data.values.filter(
			d => (d.datetime <= chartConfig.endDate) 
			& (d.datetime >= chartConfig.startDate)
		);
		filtered_spy.sort((a, b) => a.datetime - b.datetime);
		fadeIn(svg, 4, 1, chartConfig.time);
		drawLineChart(filtered_spy);
		
		// show action buttons
		const strategyButtons = d3.select(".strategy-buttons")
			.style("opacity", 0);
		fadeIn(strategyButtons, 7, 0.8, chartConfig.time);
			
		strategyButtons
			.style("background-color", "#bae2ffff")
			.style("padding", "10px")
			.style("border-radius", "10px")
			.selectAll("a").style("pointer-events", "auto");
	});
}

function drawLineChart(data) {
	// define x and y scales
	const x = d3.scaleUtc(
		d3.extent(data, d => d.datetime), 
		[chartConfig.margin.left, chartConfig.width - chartConfig.margin.right]
	);
	
	const y = d3.scaleLinear(
		[85, 145], 
		[chartConfig.height - chartConfig.margin.bottom, chartConfig.margin.top]
	);

	// declare line generator
	const line = d3.line()
		.x(d => x(d.datetime))
		.y(d => y(d.close));

	// create SVG container and inject SPY data
	const svg = d3.select("svg")
	  .attr("width", chartConfig.width)
	  .attr("height", chartConfig.height)
	  .attr("viewBox", [0, 0, chartConfig.width, chartConfig.height])
	  .style("max-width", "100%")
	  .style("height", "auto")
	  .on("pointerenter pointermove", pointermoved)
	  .on("pointerleave", pointerleft)
	  .on("touchstart", event => event.preventDefault());

	// add the x and y-axis
	svg.append("g")
      .attr("transform", `translate(0,${chartConfig.height - chartConfig.margin.bottom})`)
      .call(d3.axisBottom(x).ticks(chartConfig.width / 80).tickSizeOuter(0))

	svg.append("g")
      .attr("transform", `translate(${chartConfig.margin.left},0)`)
      .call(d3.axisLeft(y).ticks(chartConfig.height / 40))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
          .attr("x2", chartConfig.width - chartConfig.margin.left - chartConfig.margin.right)
          .attr("stroke-opacity", 0.1))
      .call(g => g.append("text")
          .attr("x", -chartConfig.margin.left)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text("↑ Weekly close ($)"))

	fadeIn(svg, 0, 1, chartConfig.time);
	
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

		investDateAnnotate(svg, x, chartConfig.margin.top, 
			chartConfig.margin.bottom, chartConfig.height, currDate, null);

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

	function pointerleft() { }

	// Wraps the text with a callout path of the correct size, as measured in the page.
	function size(text, path) {
		const {x, y, width: w, height: h} = text.node().getBBox();
		text.attr("transform", `translate(${-w / 2},${15 - y})`);
		path.attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
	}

	// add recession event annotations
	const recessionEvents = [
		{
			date: new Date("2008-09-07"),
			text: "Govt. takeover of Fannie Mae + Freddie Mac",
			dy: 50, dx: -35
		},
		{
			date: new Date("2008-09-15"),
			text: "Lehman Brothers collapse, AIG bailout",
			dy: -30, dx: -35
		},
		{
			date: new Date("2008-10-03"),
			text: "Troubled Asset Relief Program signed",
			dy: -70, dx: -34
		}
	];

	recessionEvents.forEach(({ date, text, dx, dy }) => {
		// find the closest data point for the given date
		const bisect = d3.bisector(d => d.datetime).center;
		const i = bisect(data, date);
		const datum = data[i];

		const xPos = x(datum.datetime);
		const yPos = y(datum.close);

		// draw annotation text
		const annotText = svg.append("text")
			.attr("class", "recession-annotation")
			.attr("x", xPos + dx)
			.attr("y", yPos + dy)
			.attr("fill", "#222")
			.attr("font-size", "9px")
			.attr("font-family", "sans-serif")
			.attr("font-weight", "bold")
			.text(text)
			.style("opacity", 0)
		
		fadeIn(annotText, 3, 1, chartConfig.time);

		const annotLine = svg.append("line")
			.attr("class", "recession-annotation")
			.attr("x1", xPos).attr("x2", xPos)
			.attr("y1", yPos).attr("y2", yPos + dy)
			.attr("stroke", "#999")
			.attr("stroke-dasharray", "2,2")
			.style("opacity", 0)
		
		fadeIn(annotLine, 3, 1, chartConfig.time);
	});
	
	drawTrendLine(path, 6000);
	return svg.node();
}

startStory();
linkFadeOut();