/* gradually draw a trend line */
export function drawTrendLine(path, transDuration) {
	const totalLength = path.node().getTotalLength();
	path.attr("stroke-dasharray", totalLength)
		.attr("stroke-dashoffset", totalLength)
		.transition()
		.duration(transDuration) // duration in milliseconds
		.ease(d3.easeLinear)
		.attr("stroke-dashoffset", 0);
}

/* add vertical line annotation at a given investment date */
export function investDateAnnotate(svg, x, marginTop, marginBottom, height, investDate, annot_text) {
	// Vertical line at investDate
	svg.append("line")
	.attr("class", "hover-annotation")
	.attr("x1", x(investDate))
	.attr("x2", x(investDate))
	.attr("y1", marginTop)
	.attr("y2", height - marginBottom)
	.attr("stroke", "#999")
	.attr("stroke-dasharray", "4 4")
	.attr("stroke-width", 1);

	// Label for invest date
	svg.append("text")
	.attr("class", "hover-annotation")
	.attr("x", x(investDate) + 4)
	.attr("y", marginTop + 10)
	.attr("fill", "#999")
	.attr("font-size", "12px")
	.text(annot_text);
}

/* element fade in, fade out */
export function fadeIn(selection, delayMultiplier = 0, opacity = 1, config) {
	selection.transition()
		.delay(config.base * (config.initDelay + config.step * delayMultiplier))
		.duration(config.duration)
		.style("opacity", opacity);
}

/* calculation for a lump sum investment */
export function getLsDetails(postInvest, investment) {
	let investPrice = postInvest[0].close;
	let finalPrice = postInvest[postInvest.length - 1].close;
	let numShares = investment / investPrice;
	let finalValue = Math.round(numShares * finalPrice, 2);
	return [ finalValue, numShares ];
}

/* calculation for DCA investment (12 monthly installments) */
export function getDcaDetails(postInvest, investDates, investment) {
	let monthlyInvestment = investment / investDates.length;
	let numShares = 0;

	for (let i = 0; i < investDates.length; i++) {
		let nextInvestDate = investDates[i];
		let priceOnDate = postInvest.find(
			(inv) => (inv.datetime.getTime() === nextInvestDate.getTime())
		).close;
		numShares += monthlyInvestment / priceOnDate;
	}

	let finalValue = Math.round(numShares * postInvest[postInvest.length - 1].close);
	return [ finalValue, numShares ];
}

/* text block */
export function createTextBlock({ html, displayText, transDuration, numWaits, header="h3",color="#0077cc", baseTime=100, stepTime=10, initDelay=10, highlight=true, highlightColor="#d1fed9ff", opacityTrans=false }) {
	html.append(header)
		.style("opacity", opacityTrans ? 1 : 0)
		.style("color", color)
		.text(displayText)
		.transition()
		.delay(baseTime * (initDelay + stepTime * numWaits))
		.duration(transDuration)
		.style("opacity", highlight ? 1 : 0.8)
		.style("background-color", highlight ? highlightColor : "#ffffff");
}

/* fade entire HTML on link click */
export function linkFadeOut() {
	d3.selectAll("a").on("click", function(event) {
	event.preventDefault();
	const target = d3.select(this).attr("href");

	// fade out old content
	d3.select("body")
		.transition()
		.duration(600)
		.style("opacity", 0)
		.on("end", () => {
			window.location.href = target;
		});
	});

	// fade in new content
	d3.select("body")
		.style("opacity", 0)
		.transition()
		.duration(600)
		.style("opacity", 1);
}

/* format currency */
export function formatValue(value) {
	return Math.round(value, 2).toLocaleString("en", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
  		maximumFractionDigits: 0
	});
}
  
export function formatDate(date) {
    return date.toLocaleString("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    });
}

/* heatmap functions */
export async function hmapGenData(month, numDcas) {
	const INVESTMENT = 100000;
	const data = await d3.json("data/spy_prices.json");
	
	data.values.forEach(d => {
		d.datetime = new Date(d.datetime);
		d.close = +d.close;
	});

	const spyHist = data.values;
	spyHist.sort((a, b) => a.datetime - b.datetime);
	const spyHistAMth = spyHist.filter(d => d.datetime.getMonth() === month - 1);

	const seenYears = new Set();
	const spyHist_yearly = spyHistAMth.filter(d => {
		const year = d.datetime.getFullYear();
		if (!seenYears.has(year)) {
			seenYears.add(year);
			return true;
		}
		return false;
	});

	const durations = [1, 2, 3, 4, 5, 10];
	const res = [];

	for (let i = 0; i < spyHist_yearly.length; i++) {
		const startDate = spyHist_yearly[i].datetime;
		const startPrice = spyHist_yearly[i].close;

		for (let dur of durations) {
			const endEntry = spyHist_yearly[Math.min(i + dur, spyHist_yearly.length - 1)];
			const inbound = i + dur <= spyHist_yearly.length - 1
			
			// lump sum 
			const lsReturn =  inbound ? (endEntry.close - startPrice) / startPrice : 0;

			// dca
			let monthlyInvestment = INVESTMENT / numDcas;
			let dcaShares = 0;

			const startIdx = spyHist.findIndex(d => d.datetime.getTime() === startDate.getTime());

			for (let j = 0; j < numDcas; j++) {
				const entry = spyHist[startIdx + j];
				if (!entry) break;
				dcaShares += monthlyInvestment / entry.close;
			}

			let dcaReturn = inbound ? (dcaShares * endEntry.close - INVESTMENT) / INVESTMENT : 0;

			res.push({
				startYr: startDate.getFullYear(),
				duration: dur,
				ls: +lsReturn.toFixed(4),
				dca: +dcaReturn.toFixed(4)
			});
		}
	}

	return res;
}

export async function hmapFrame(month, numDcas, hmapHeaderTxt, 
	legendSection, config, update=false) {
	// generate heat map data
	const data = await hmapGenData(month, numDcas);

	// add legend
	if (legendSection) {
		addGradientLegend(
			legendSection, config.time.base, config.time.initDelay, 
			config.time.step, config.time.duration, update
		);
	}

	// heatmap header
	const hmapSection = d3.select("#lump-dca-heatmap");
	hmapSection.append("div")
		.append("p")
		.text(hmapHeaderTxt)
		.style("color", "#666666")
		.style("opacity", 0)
		.style("margin-top", "10px")
		.style("margin-bottom", "10px")
		.transition()
		.delay(update ? 0 : config.time.base * (config.time.initDelay + config.time.step * 2))
		.duration(config.time.duration)
		.style("opacity", 1);

	// create svg
	const svg = hmapSection.append("svg")
		.attr("width", config.width + config.margin.left + config.margin.right)
		.attr("height", config.height + config.margin.top + config.margin.bottom)
		.append("g")
		.attr("transform", "translate(" + config.margin.left + "," + config.margin.top + ")");

	// Axes and scales (same as before)
	const durationDomain = ['1Y', '2Y', '3Y', '4Y', '5Y', '10Y'];
	const durationMap = { 1: '1Y', 2: '2Y', 3: '3Y', 4: '4Y', 5: '5Y', 10: '10Y' };
	const yrDomain = Array.from({ length: 2024 - 1993 + 1 }, (_, i) => 2024 - i);
	const x = d3.scaleBand().domain(yrDomain).range([config.width, 0]).padding(0.05);
	const y = d3.scaleBand().domain(durationDomain).range([0, config.height]).padding(0.05);

	// x-axis
	const xAxis = svg.append("g")
		.style("font-size", 12)
		.style("font-family", "Lato, Arial, sans-serif")
		.style("opacity", 0)
		.attr("transform", "translate(0," + config.height + ")")
		.call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => i % 2 === 0)));

	xAxis.selectAll(".tick line").remove();
	xAxis.select(".domain").remove();

	xAxis.transition()
		.delay(update ? 0 : 
			config.time.baseTime * (config.time.initDelay + config.time.step * 2)
		)
		.duration(config.time.duration)
		.style("opacity", 1);

	// y-axis
	const yAxis = svg.append("g")
		.style("font-size", 12)
		.style("font-family", "Lato, Arial, sans-serif")
		.style("opacity", 0)
		.call(d3.axisLeft(y).tickSize(0));

	yAxis.select(".domain").remove();

	yAxis.transition()
		.delay(
			config.time.baseTime * (config.time.initDelay + config.time.step * 2)
		)
		.duration(config.time.transDuration)
		.style("opacity", 1);

	// Color scale
	const colorScale = d3.scaleSequential()
		.interpolator(d3.interpolatePiYG)
		.domain([-0.1, 0.1]);

	// Tooltip setup (same as before)
	const tooltip = d3.select("#lump-dca-heatmap")
		.append("div")
		.style("opacity", 0)
		.attr("class", "tooltip")
		.style("position", "absolute")
		.style("background-color", "white")
		.style("border", "solid 2px")
		.style("border-radius", "5px")
		.style("padding", "5px");

	// Tooltip event handlers (same as before)
	const mouseover = function (event, d) {
		tooltip.style("opacity", 1);
		d3.select(this)
			.style("stroke", "black")
			.style("opacity", 1);
	};

	const mousemove = function (event, d) {
		const [mouseX, mouseY] = d3.pointer(event);
		let label = "⏤ N/A";

		if (d.ls > d.dca) {
			label = "+" + (100 * (d.ls - d.dca)).toFixed(2) + "% LS";
		} else if (d.ls < d.dca) {
			label = "+" + (100 * (d.dca - d.ls)).toFixed(2) + "% DCA";
		}

		tooltip.html(label)
			.style("left", (event.pageX + 10) + "px")
			.style("top", (event.pageY - 28) + "px")
			.style("font-size", "13px");
	};

	const mouseleave = function (event, d) {
		tooltip.style("opacity", 0);
		d3.select(this)
			.style("stroke", "none")
			.style("opacity", 0.8);
	};

	// heatmap squares
	svg.selectAll("rect")
		.data(data, d => d.startYr + ":" + durationMap[d.duration])
		.join(
			enter => {
				const rects = enter.append("rect")
					.attr("x", d => x(d.startYr))
					.attr("y", d => y(durationMap[d.duration]))
					.attr("rx", 4).attr("ry", 4)
					.attr("width", x.bandwidth())
					.attr("height", y.bandwidth())
					.style("fill", d => colorScale(d.ls - d.dca))
					.style("stroke-width", 4)
					.style("stroke", "none")
					.style("opacity", 0);

				rects.transition()
					.delay(
						update ? 0 : config.time.base * (config.time.initDelay + config.time.step * 2)
					)
					.duration(600)
					.style("opacity", 0.8)
					.on("end", function () {
						d3.select(this)
							.on("mouseover", mouseover)
							.on("mousemove", mousemove)
							.on("mouseleave", mouseleave);
					});

				return rects;
			},
			update => update
				.transition()
				.duration(600)
				.style("fill", d => colorScale(d.ls - d.dca))
		);

	// time period annotations
	const periodAnnotations = [
		{ year: 2001, label: "Dot-com Bubble" },
		{ year: 2008, label: "2008 Recession" },
		{ year: 2020, label: "COVID-19" }
	];

	svg.selectAll(".event-label")
		.data(periodAnnotations)
		.enter()
		.append("text")
		.attr("class", "event-label")
		.attr("x", d => x(d.year) + x.bandwidth() / 2)
		.attr("y", -2)
		.attr("text-anchor", "middle")
		.style("font-size", "10px")
		.style("fill", "#444")
		.style("opacity", 0)
		.text(d => d.label)
		.transition()
		.delay(update ? 0 : config.time.base * (config.time.initDelay + config.time.step * 2))
		.duration(config.time.duration)
		.style("opacity", 1);

	const frameButtons = d3.select(".frame-toggle");
	frameButtons.transition()
		.delay(config.time.base * (config.time.initDelay + config.time.step * 3))
		.duration(config.time.duration)
		.style("opacity", 1)
		.style("padding", "10px")
		.style("border-radius", "10px");
}

export function addGradientLegend(section, baseTime, initDelay, stepTime, transDuration, update) {
	const legendDiv = section.append("div")
		.attr("class", "gradient-legend")
		.style("overflow", "hidden")
		.style("opacity", 0);

	legendDiv.append("p")
		.text("+10% LS")
		.style("float", "left")
		.style("margin", "0")
		.style("color", "#ffffff");

	legendDiv.append("p")
		.text("+10% DCA")
		.style("float", "right")
		.style("margin", "0")
		.style("color", "#ffffff");

	legendDiv.transition()
		.delay(update ? 0 : baseTime * (initDelay + stepTime * 2))
		.duration(transDuration)
		.style("opacity", 1);
}