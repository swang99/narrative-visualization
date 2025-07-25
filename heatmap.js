// declare heatmap dimensions and margins
const INVESTMENT = 100000;
const margin = {top: 80, right: 25, bottom: 30, left: 40};
const width = 850;
const height = 200;

export async function generateHmapData(month) {
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
			let numDcas = 12;
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

	hmapFrame(res);
}

export async function hmapFrame(hmapData) {
	// append the svg object to the body of the page
	let svg = d3.select("#lump-dca-heatmap")
	  .append("svg")
	  .attr("width", width + margin.left + margin.right)
	  .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// build axes and scales
	const durationDomain = ['1Y', '2Y', '3Y', '4Y', '5Y', '10Y'];
	const durationMap = { 1: '1Y', 2: '2Y', 3: '3Y', 4: '4Y', 5: '5Y', 10: '10Y'};
	const yrDomain = Array.from({ length: 2024 - 1993 + 1 }, (_, i) => 2024 - i);
	let x = d3.scaleBand().domain(yrDomain).range([width, 0]).padding(0.05);
	let y = d3.scaleBand().domain(durationDomain).range([0, height]).padding(0.05);
	
	svg.append("g")
		.style("font-size", 12)
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x).tickValues(
        	x.domain().filter((d, i) => i % 2 === 0) // show every other year
      	))
		.call(g => g.selectAll(".tick line").remove())
		.select(".domain").remove();
	
	svg.append("g")
		.style("font-size", 12)
		.call(d3.axisLeft(y).tickSize(0))
		.select(".domain").remove();

	// color scale
	const colorScale = d3.scaleSequential()
		.interpolator(d3.interpolatePiYG)
		.domain([-0.1,0.1])

	// create tooltip
	const tooltip = d3.select("#lump-dca-heatmap")
		.append("div")
		.style("opacity", 0)
		.attr("class", "tooltip")
		.style("position", "absolute")
		.style("background-color", "white")
		.style("border", "solid")
		.style("border-width", "2px")
		.style("border-radius", "5px")
		.style("padding", "5px")

	// tooltip mouse functions: hover / move / leave a cell
	const mouseover = function(event, d) {
		tooltip.style("opacity", 1);
		d3.select(this)
			.style("stroke", "black")
			.style("opacity", 1);
	};

	const mousemove = function(event, d) {
		const [x, y] = d3.pointer(event);
		
		let label = "⏤ N/A";
		if (d.ls > d.dca) {
			label = "+" + (100 * (d.ls - d.dca)).toFixed(2) + "% LS"
		} else if (d.ls < d.dca) {
			label = "+" + (100 * (d.dca - d.ls)).toFixed(2) + "% DCA"
		}
		
		tooltip.html(label)
			.style("left", (x + 40) + "px")
			.style("top", (y + 20) + "px");
	};

	const mouseleave = function(event, d) {
		tooltip.style("opacity", 0)
		d3.select(this)
		  .style("stroke", "none")
		  .style("opacity", 0.8)
	}

	// add the squares
	svg.selectAll()
		.data(hmapData, function(d) {return d.year+':'+durationMap[d.duration];})
		.enter()
		.append("rect")
		.attr("x", function(d) { return x(d.startYr); })
		.attr("y", function(d) { return y(durationMap[d.duration]) })
		.attr("rx", 4)
		.attr("ry", 4)
		.attr("width", x.bandwidth())
		.attr("height", y.bandwidth())
		.style("fill", function(d) { return colorScale(d.ls - d.dca); })
		.style("stroke-width", 4)
		.style("stroke", "none")
		.style("opacity", 0.8)
		.on("mouseover", mouseover)
		.on("mousemove", mousemove)
		.on("mouseleave", mouseleave)

	// heatmap title
	svg.append("text")
		.attr("x", 0).attr("y", -50)
		.attr("text-anchor", "left")
		.style("font-size", "22px")
		.text("Lump Sum or DCA?");

	// heatmap subtitle
	svg.append("text")
		.attr("x", 0).attr("y", -20)
		.attr("text-anchor", "left")
		.style("fill", "grey")
		.text("A comparison of the strategies on various start years and investment timeframes.");
	}

generateHmapData(1);