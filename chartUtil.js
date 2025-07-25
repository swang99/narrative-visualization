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

/* calculation for a lump sum investment */
export function getLsDetails(postInvest, investment) {
	let investPrice = postInvest[0].close;
	let finalPrice = postInvest[postInvest.length - 1].close;
	let numShares = investment / investPrice;
	let finalValue = Math.round(numShares * finalPrice, 2);
	return [ finalValue, numShares ];
}

/* calculation for DCA investment (12 monthly installments) */
/* consolidate these two functions into one*/
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
export function createTextBlock({ html, displayText, transDuration, numWaits, header="h3",color="#0077cc", baseTime=100, stepTime=10, initDelay=10, highlight=true, opacityTrans=false }) {
	html.append(header)
		.style("opacity", opacityTrans ? 1 : 0)
		.style("color", color)
		.text(displayText)
		.transition()
		.delay(baseTime * (initDelay + stepTime * numWaits))
		.duration(transDuration)
		.style("opacity", highlight ? 1 : 0.8)
		.style("background-color", highlight ? "#d1fed9ff" : "#ffffff");
}

/* fade entire HTML on link click */
export function linkFadeOut() {
	d3.selectAll("a").on("click", function(event) {
	event.preventDefault();
	const target = d3.select(this).attr("href");

	// fade out old content
	d3.select("body")
		.transition()
		.duration(500)
		.style("opacity", 0)
		.on("end", () => {
			window.location.href = target;
		});
	});

	// fade in new content
	d3.select("body")
		.style("opacity", 0)
		.transition()
		.duration(500)
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