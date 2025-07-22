/* gradually draw a trend line */
export function drawTrendLine(path, transDuration) {
	const totalLength = path.node().getTotalLength();
	path.attr("stroke-dasharray", totalLength)
		.attr("stroke-dashoffset", -totalLength)
		.attr("opacity", 0.1)
		.transition()
		.duration(transDuration) // duration in milliseconds
		.ease(d3.easeLinear)
		.attr("opacity", 1)
		.attr("stroke-dashoffset", 0);
}

/* add vertical line annotation at a given investment date */
export function investDateAnnotate(svg, x, marginTop, marginBottom, height, investDate, annot_text) {
	// Vertical line at investDate
	svg.append("line")
	.attr("x1", x(investDate))
	.attr("x2", x(investDate))
	.attr("y1", marginTop)
	.attr("y2", height - marginBottom)
	.attr("stroke", "#999")
	.attr("stroke-dasharray", "4 4")
	.attr("stroke-width", 1);

	// Label for invest date
	svg.append("text")
	.attr("x", x(investDate) + 4)
	.attr("y", marginTop + 10)
	.attr("fill", "#999")
	.attr("font-size", "12px")
	.text(annot_text);
}

/* calculation for a lump sum investment */
export function getLsDetails(postInvest, investment) {
	let investPrice = postInvest[postInvest.length - 1].close;
	let finalPrice = postInvest[0].close;
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

	let finalValue = Math.round(numShares * postInvest[0].close);
	return [ finalValue, numShares ];
}

/* text block */
export function createTextBlock({ html, displayText, transDuration, numWaits, header="h3",color="#0077cc", baseTime=100, stepTime=10, initDelay=10, opacityOff=false}) {
	html.append(header)
		.style("opacity", opacityOff ? 1 : 0)
		.style("color", color)
		.text(displayText)
		.transition()
		.delay(baseTime * (initDelay + stepTime * numWaits))
		.duration(transDuration)
		.style("opacity", 1);
}
