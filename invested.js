import { 
	investDateAnnotate, drawTrendLine,
	getDcaDetails, getLsDetails, createTextBlock, 
	formatValue, formatDate
} from './chartUtil.js';

// dates + data for frame 2
const INVESTMENT = 100000;
const lsInvestDate = new Date("2008-10-20");
const altDate = new Date("2022-10-03");
const waitInvestDate = new Date("2010-10-25")

// declare chart dimensions and margins
const width = 1000;
const height = 300;
const marginTop = 20;
const marginRight = 100;
const marginBottom = 30;
const marginLeft = 50;

function finalValueDot(svg, x, y, color, investDetails, finalDate, highlight) {
	// get final data point
	const finalX = x(finalDate);
	const finalY = y(investDetails[0]);

	// Add a small circle at the end of the line
	svg.append("circle")
		.attr("cx", finalX)
		.attr("cy", finalY)
		.attr("r", 3)
		.attr("fill", color)
		.attr("opacity", highlight ? 1 : 0.6);

	// Label with final value
	svg.append("text")
		.attr("x", finalX + 6)
		.attr("y", finalY - 6)
		.attr("fill", color)
		.attr("font-size", "12px")
		.attr("font-weight", "bold")
		.text(`${formatValue(investDetails[0])}`)
		.attr("opacity", highlight ? 1 : 0.6);
}

function startFrame() {
	const section = d3.select(".header-text")
	const section2 = d3.select(".header-text-2")
	const section3 = d3.select(".header-text-3")
	const params = new URLSearchParams(window.location.search);
	const strategy = params.get("strategy");  // "lump", "dca"

	const baseTime = 100;
	const stepTime = 10;
	const initDelay = 10;
	const transDuration = 1000;

	// header
	createTextBlock({
		html: section,
		displayText: "Fast forward to July 2025, here's how that investment progressed.",
		transDuration: transDuration,
		numWaits: 1,
		color: "#0077cc",
		highlight: false
	});

	createTextBlock({
		html: section,
		header: "p",
		displayText: "The two strategies follow each other very closely, but lump sum outperforms DCA by ~2.3%",
		transDuration: transDuration,
		numWaits: 1,
		color: "#666666",
		highlight: false
	});

	// line chart
	d3.json("data/spy_prices.json").then(data => {
	    data.values.forEach(d => {
		  d.datetime = new Date(d.datetime);
		  d.close = +d.close;
		})

		// classic lump sum
		const postInvest = data.values.filter(d => d.datetime >= lsInvestDate);
		postInvest.sort((a, b) => a.datetime - b.datetime);
		const altPostInvest = postInvest.filter(d => d.datetime >= altDate);
		const lsDetails = getLsDetails(postInvest, INVESTMENT);
		
		// DCA over a year
		const dcaDates = [
			new Date("2008-10-20"), new Date("2008-11-17"), 
			new Date("2008-12-15"), new Date("2009-01-12"),
			new Date("2009-02-09"), new Date("2009-03-09"), 
			new Date("2009-04-06"), new Date("2009-05-04"), 
			new Date("2009-06-01"), new Date("2009-07-27"), 
			new Date("2009-08-24"), new Date("2009-09-21")
		]
		const dcaInvest = data.values.filter(d => d.datetime >= dcaDates[dcaDates.length - 1]);
		dcaInvest.sort((a, b) => a.datetime - b.datetime);
		const altDcaInvest = dcaInvest.filter(d => d.datetime >= altDate);
		const dcaDetails = getDcaDetails(postInvest, dcaDates, INVESTMENT)

		// add svg + text blocks
		const svg = section.append("svg")
			.attr("id", "line-chart")
			.style("opacity", 0);

		svg.transition()
			.delay(baseTime * (initDelay + stepTime * 2))
			.duration(transDuration)
			.on("end", () => {
				drawLineChart(altPostInvest, lsDetails, altDcaInvest, 
					          dcaDetails, strategy);
			})

		createTextBlock({
			html: section3,
			displayText: `💰 Lump Sum (All In): ${formatValue(INVESTMENT)} 
			              ➡️ ${formatValue(lsDetails[0])}.`,
			transDuration: 1000,
			numWaits: 10,
			color: "#00b26f",
			highlight: strategy === 'lump'
		});

		createTextBlock({
			html: section3,
			displayText: `📆 DCA (Spread Over 12 Months): ${formatValue(INVESTMENT)} 
			              ➡️ ${formatValue(dcaDetails[0])}.`,
			transDuration: 1000,
			numWaits: 10,
			color: "#0077cc",
			highlight: strategy === 'dca'
		});

		createTextBlock({
			html: section3,
			header: "p",
			displayText: `Returns may differ based on lucky timing, so how do these strategies really compare across a 30-year period? Find out more ⬇️`,
			transDuration: 1000,
			numWaits: 10,
			color: "#666666",
			highlight: false
		});
	});
	
	const frameButtons = d3.select(".frame-toggle")
	frameButtons.transition()
		.delay(baseTime * (initDelay + stepTime * 10))
		.duration(transDuration)
		.style("opacity", 1)
		.style("padding", "10px")
		.style("border-radius", "10px");
}


function drawLineChart(postInvest, lsDetails, dcaInvest, dcaDetails, strategy) {
	// define x scale
	const x = d3.scaleUtc(
		d3.extent([...postInvest], d => d.datetime), 
	    [marginLeft, width - marginRight]
	);

	// define y scale
	const y = d3.scaleLinear([350000, 750000], [height - marginBottom, marginTop]);

	// declare line generator
	const lumpSumLine = d3.line()
		.x(d => x(d.datetime))
		.y(d => y(d.close * lsDetails[1]));

	const dcaLine = d3.line()
		.x(d => x(d.datetime))
		.y(d => y(d.close * dcaDetails[1]));

	// create SVG container and inject SPY data
	const svg = d3.select(".header-text").select("svg")
	  .attr("width", width)
	  .attr("height", height)
	  .attr("viewBox", [0, 0, width, height])
	  .style("max-width", "100%")
	  .style("height", "auto")
	  .on("pointerenter pointermove", pointermoved)
	  .on("pointerleave", pointerleft)
	  .on("touchstart", event => event.preventDefault());

	// add the x-axis
	svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

	// add the y-axis
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

    // fade in 
	svg.transition()
	   .duration(1000)
	   .style("opacity", 1);

	// append paths to draw lines pre and post-investment
	const lsPostPath = svg.append("path")
		.datum(postInvest)
		.attr("fill", "none")
		.attr("stroke", "#00b26f")
		.attr("stroke-width", 2)
		.attr("opacity", strategy === 'lump' ? 1 : 0.3)
		.attr("d", lumpSumLine);

	const dcaPath = svg.append("path")
		.datum(dcaInvest)
		.attr("fill", "none")
		.attr("stroke", "#0077cc")
		.attr("stroke-width", 2)
		.attr("opacity", strategy === 'dca' ? 1 : 0.3)
		.attr("d", dcaLine);

	// create the tooltip container.
	const tooltip = svg.append("g");

	// Add the event listeners that show or hide the tooltip.
	function pointermoved(event) {
		svg.selectAll(".hover-annotation").remove();

		const hoveredDate = x.invert(d3.pointer(event)[0]);
		const bisect = d3.bisector(d => d.datetime).center;
		const iLump = bisect(postInvest, hoveredDate);
		const iDca = bisect(dcaInvest, hoveredDate);
		const currDate = postInvest[iLump]?.datetime || hoveredDate;
		const lumpVal = postInvest[iLump]?.close * lsDetails[1];
		const dcaVal = dcaInvest[iDca].datetime === currDate ? dcaInvest[iDca]?.close * dcaDetails[1] : 0;
		
		tooltip.style("display", null);
		tooltip.attr("transform", `translate(130, 25)`);

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
					`💰 Lump: ${lumpVal ? formatValue(lumpVal) : '–'}`,
					`📆 DCA: ${dcaVal ? formatValue(dcaVal) : '–'}`,
					`Diff: ${dcaVal ? "+" + ((lumpVal - dcaVal) * 100 / dcaVal).toFixed(2) + "% Lump": "-"}`
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

	drawTrendLine(lsPostPath, 7000);
	drawTrendLine(dcaPath, 7000);

	// annotations
	finalValueDot(svg, x, y, "#00b26f", lsDetails, postInvest[postInvest.length - 1].datetime, strategy === 'lump');
	finalValueDot(svg, x, y, "#0077cc", dcaDetails, dcaInvest[dcaInvest.length - 1].datetime, strategy === 'dca');
	
	return svg.node();
}

// start next frame of story
startFrame();

// fade out on any link click
d3.selectAll("a").on("click", function(event) {
	event.preventDefault();
	const target = d3.select(this).attr("href");

	d3.select("body")
		.transition()
		.duration(500)
		.style("opacity", 0)
		.on("end", () => {
			window.location.href = target;
		});
});
