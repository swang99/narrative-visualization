import { investDateAnnotate, drawTrendLine,
		 getDcaDetails, createTextBlock, 
		 getLsDetails
} from './chartUtil.js';

// dates + data for frame 2
const INVESTMENT = 100000;
const lsInvestDate = new Date("2008-10-20");
const waitInvestDate = new Date("2010-10-25")

// declare chart dimensions and margins
const width = 1000;
const height = 400;
const marginTop = 20;
const marginRight = 100;
const marginBottom = 30;
const marginLeft = 50;

function finalValueDot(svg, x, y, color, investDetails, finalDate) {
	// get final data point
	const finalX = x(finalDate);
	const finalY = y(investDetails[0]);

	// Add a small circle at the end of the line
	svg.append("circle")
		.attr("cx", finalX)
		.attr("cy", finalY)
		.attr("r", 3)
		.attr("fill", color);

	// Label with final value
	svg.append("text")
		.attr("x", finalX + 6)
		.attr("y", finalY - 6)
		.attr("fill", color)
		.attr("font-size", "12px")
		.attr("font-weight", "bold")
		.text(`$${(investDetails[0]).toFixed(0)}`);
}

function startFrame() {
	const section = d3.select(".header-text")
	const section2 = d3.select(".header-text-2")

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
		color: "#0077cc"
	});

	// line chart
	d3.json("data/spy_prices.json").then(data => {
	    data.values.forEach(d => {
		  d.datetime = new Date(d.datetime);
		  d.close = +d.close;
		})

		// classic lump sum
		const postInvest = data.values.filter(d => d.datetime >= lsInvestDate);
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
		const dcaDetails = getDcaDetails(postInvest, dcaDates, INVESTMENT)

		// wait lump sum
		const waitInvest = data.values.filter(d => d.datetime >= waitInvestDate);
		const waitDetails = getLsDetails(waitInvest, INVESTMENT);

		// add svg + text blocks
		const svg = section.append("svg")
		.attr("id", "line-chart")
		.style("opacity", 0);

		svg.transition()
			.delay(baseTime * (initDelay + stepTime * 4))
			.duration(transDuration)
			.on("end", () => {
				drawLineChart(postInvest, lsDetails, dcaInvest, 
					          dcaDetails, waitInvest, waitDetails);
			})

		createTextBlock({
			html: section2,
			displayText: `Your $${INVESTMENT.toLocaleString()} inheritance is now: 
						  $${lsDetails[0]}. Amazing conviction!`,
			transDuration: 1000,
			numWaits: 15,
			color: "#00b26f"
		});

		createTextBlock({
			html: section2,
			displayText: `If you had spread out investments over a year, 
			              you would instead have: $${dcaDetails[0]}`,
			transDuration: 1000,
			numWaits: 15,
			color: "#666666"
		});

		createTextBlock({
			html: section2,
			displayText: `If you were hesistant about investing and waited two years before 
			              going all in on the market, your $${INVESTMENT.toLocaleString()} inheritance is now: $${waitDetails[0]}.`,
			transDuration: 1000,
			numWaits: 15,
			color: "#666666"
		});
	});
	
	const frameButtons = d3.select(".frame-toggle")
	frameButtons.transition()
		.delay(baseTime * (initDelay + stepTime * 15))
		.duration(transDuration)
		.style("opacity", 1)
		.style("padding", "10px")
		.style("border-radius", "10px")
		.style("width", `${width - marginRight}px`);
}

function drawLineChart(postInvest, lsDetails, dcaInvest, dcaDetails, waitInvest, waitDetails) {
	// define x scale
	const x = d3.scaleUtc(
		d3.extent([...postInvest], d => d.datetime), 
	    [marginLeft, width - marginRight]
	);

	// define y scale
	const y = d3.scaleLinear(
		[0, d3.max(postInvest, d => d.close * lsDetails[1] + INVESTMENT)], 
		[height - marginBottom, marginTop]
	);

	// declare line generator
	const lumpSumLine = d3.line()
		.x(d => x(d.datetime))
		.y(d => y(d.close * lsDetails[1]));

	const dcaLine = d3.line()
		.x(d => x(d.datetime))
		.y(d => y(d.close * dcaDetails[1]));

	const waitLine = d3.line()
		.x(d => x(d.datetime))
		.y(d => y(d.close * waitDetails[1]));

	// create SVG container and inject SPY data
	const svg = d3.select("svg")
	  .attr("width", width)
	  .attr("height", height)
	  .attr("viewBox", [0, 0, width, height])
	  .style("max-width", "100%")
	  .style("height", "auto")

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

	svg.transition()
	   .duration(1000)
	   .style("opacity", 1);

	// append paths to draw lines pre and post-investment
	const lsPostPath = svg.append("path")
		.datum(postInvest)
		.attr("fill", "none")
		.attr("stroke", "#00b26f")
		.attr("stroke-width", 2)
		.attr("d", lumpSumLine);

	const dcaPath = svg.append("path")
		.datum(dcaInvest)
		.attr("fill", "none")
		.attr("stroke", "#ffc107")
		.attr("stroke-width", 2)
		.attr("d", dcaLine);

	// error part 2
	const waitPostPath = svg.append("path")
		.datum(waitInvest)
		.attr("fill", "none")
		.attr("stroke", "#666666")
		.attr("stroke-width", 2)
		.attr("d", waitLine);

	drawTrendLine(lsPostPath, 8000);
	drawTrendLine(dcaPath, 8000);
	drawTrendLine(waitPostPath, 8000);

	// annotations
	investDateAnnotate(svg, x, marginTop, marginBottom, 
		               height, lsInvestDate, 
					   `📅 Invested: $${INVESTMENT}`);
	finalValueDot(svg, x, y, "#00b26f", lsDetails, postInvest[0].datetime);
	finalValueDot(svg, x, y, "#ffc107", dcaDetails, dcaInvest[0].datetime);
	finalValueDot(svg, x, y, "#666666", waitDetails, waitInvest[0].datetime);
	
	return svg.node();
}

startFrame();
