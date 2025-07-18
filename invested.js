import { investDateAnnotate, drawTrendLine, 
	     lumpSumCalc, dcaCalc, createTextBlock } from './chartUtil.js';

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

function finalValueDot(svg, x, y, color, postInvest) {
	// Get final data point
	const finalPoint = postInvest[0];
	const finalX = x(finalPoint.datetime);
	const finalY = y(finalPoint.close * (INVESTMENT / postInvest[postInvest.length - 1].close));

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
		.text(`$${(finalPoint.close * (INVESTMENT / postInvest[postInvest.length - 1].close)).toFixed(0)}`);
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

		const postInvest = data.values.filter(d => d.datetime >= lsInvestDate);
		const lsInvestPrice = postInvest[postInvest.length - 1].close;
		const finalPrice = postInvest[0].close;
		
		const dcaDates = [new Date("2008-10-20"), new Date("2008-11-17"), new Date("2008-12-15"), new Date("2009-01-12"), new Date("2009-02-09"), new Date("2009-03-09"), new Date("2009-04-06"), new Date("2009-05-04"), new Date("2009-06-01"), new Date("2009-07-27"), new Date("2009-08-24"), new Date("2009-09-21")]
		const dcaInvest = data.values.filter(d => d.datetime >= dcaDates[dcaDates.length - 1]);
		const dcaAvgPrice = 0;

		const waitPostInvest = data.values.filter(d => d.datetime >= waitInvestDate);
		const waitInvestPrice = waitPostInvest[waitPostInvest.length - 1].close;

		const svg = section.append("svg")
		.attr("id", "line-chart")
		.style("opacity", 0);

		svg.transition()
			.delay(baseTime * (initDelay + stepTime * 4))
			.duration(transDuration)
			.on("end", () => {
				drawLineChart(postInvest, dcaInvest, waitPostInvest);
			})
	
		createTextBlock({
			html: section2,
			displayText: `Your $${INVESTMENT.toLocaleString()} inheritance is now: 
				$${lumpSumCalc(INVESTMENT, lsInvestPrice, finalPrice)}. What amazing conviction!`,
			transDuration: 1000,
			numWaits: 15,
			color: "#00b26f"
		});

		createTextBlock({
			html: section2,
			displayText: `If you had spread out investments over a year, you would instead have:
				$${dcaCalc(INVESTMENT, dcaDates, postInvest)}`,
			transDuration: 1000,
			numWaits: 15,
			color: "#666666"
		});

		createTextBlock({
			html: section2,
			displayText: `If you were hesistant about investing and waited two years before going all in on the market, your $${INVESTMENT.toLocaleString()} inheritance is now: 
				$${lumpSumCalc(INVESTMENT, waitInvestPrice, finalPrice)}.`,
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

function drawLineChart(postInvest, dcaInvest, waitPostInvest) {
	// define x scale
	const x = d3.scaleUtc(d3.extent([...postInvest], d => d.datetime), 
	                      [marginLeft, width - marginRight]);

	// define y scale
	const y = d3.scaleLinear([0, d3.max(postInvest, d => d.close * (INVESTMENT / postInvest[postInvest.length - 1].close)) + INVESTMENT], [height - marginBottom, marginTop]);

	// declare line generator
	const lumpSumLine = d3.line()
		.x(d => x(d.datetime))
		.y(d => y(d.close * (INVESTMENT / postInvest[postInvest.length - 1].close)));

	const dcaLine = d3.line()
		.x(d => x(d.datetime))
		.y(d => y(d.close * (INVESTMENT / dcaInvest[dcaInvest.length - 1].close)));

	const waitLine = d3.line()
		.x(d => x(d.datetime))
		.y(d => y(d.close * (INVESTMENT / waitPostInvest[waitPostInvest.length - 1].close)));

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
		.datum(postInvest)
		.attr("fill", "none")
		.attr("stroke", "#ffc107")
		.attr("stroke-width", 2)
		.attr("d", dcaLine);

	const waitPostPath = svg.append("path")
		.datum(waitPostInvest)
		.attr("fill", "none")
		.attr("stroke", "#666666")
		.attr("stroke-width", 2)
		.attr("d", waitLine);

	drawTrendLine(lsPostPath, 8000);
	drawTrendLine(waitPostPath, 8000);

	// annotations
	investDateAnnotate(svg, x, marginTop, marginBottom, 
		               height, lsInvestDate, 
					   `📅 Invested: $${INVESTMENT}`);
	finalValueDot(svg, x, y, "#00b26f", postInvest);
	finalValueDot(svg, x, y, "#666666", waitPostInvest);
	
	return svg.node();
}

startFrame();
