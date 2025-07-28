import { 
	createTextBlock
} from './chartUtil.js';

// declare heatmap dimensions and margins
const INVESTMENT = 100000;
const margin = {top: 10, right: 25, bottom: 30, left: 40};
const width = 850;
const height = 150;

const baseTime = 100;
const stepTime = 10;
const initDelay = 10;
const transDuration = 1000;

export function hmapHeader() {
	const section = d3.select(".header-text")
	
	createTextBlock({
		html: section,
		header: "h2",
		displayText: "Lump Sum or DCA?",
		transDuration: transDuration,
		numWaits: 0,
		highlight: false
	});

	createTextBlock({
		html: section,
		header: "p",
		color: "#666666",
		displayText: "A comparison of the strategies on various start years and investment timeframes.",
		transDuration: transDuration,
		numWaits: 0,
		highlight: false
	});

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
		.delay(baseTime * (initDelay + stepTime * 2))
		.duration(transDuration)
		.style("opacity", 1);
}

export async function hmapFrame(hmapData, hmapHeaderTxt) {
    const data = await d3.json(hmapData); 

    const hmapSection = d3.select("#lump-dca-heatmap");

    // heatmap header
    hmapSection.append("div")
        .append("p")
        .text(hmapHeaderTxt)
        .style("color", "#666666")
        .style("opacity", 0)
        .transition()
        .delay(baseTime * (initDelay + stepTime * 2))
        .duration(transDuration)
        .style("opacity", 1);

    // create svg
    const svg = hmapSection.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Axes and scales (same as before)
    const durationDomain = ['1Y', '2Y', '3Y', '4Y', '5Y', '10Y'];
    const durationMap = { 1: '1Y', 2: '2Y', 3: '3Y', 4: '4Y', 5: '5Y', 10: '10Y' };
    const yrDomain = Array.from({ length: 2024 - 1993 + 1 }, (_, i) => 2024 - i);
    const x = d3.scaleBand().domain(yrDomain).range([width, 0]).padding(0.05);
    const y = d3.scaleBand().domain(durationDomain).range([0, height]).padding(0.05);

    // x-axis
    const xAxis = svg.append("g")
        .style("font-size", 12)
        .style("opacity", 0)
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => i % 2 === 0)));

    xAxis.selectAll(".tick line").remove();
    xAxis.select(".domain").remove();

    xAxis.transition()
        .delay(baseTime * (initDelay + stepTime * 2))
        .duration(transDuration)
        .style("opacity", 1);

    // y-axis
    const yAxis = svg.append("g")
        .style("font-size", 12)
        .style("opacity", 0)
        .call(d3.axisLeft(y).tickSize(0));

    yAxis.select(".domain").remove();

    yAxis.transition()
        .delay(baseTime * (initDelay + stepTime * 2))
        .duration(transDuration)
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
                    .delay(baseTime * (initDelay + stepTime * 2))
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

    const frameButtons = d3.select(".frame-toggle");
    frameButtons.transition()
        .delay(baseTime * (initDelay + stepTime * 3))
        .duration(transDuration)
        .style("opacity", 1)
        .style("padding", "10px")
        .style("border-radius", "10px");
}

hmapHeader();
await hmapFrame("data/heatmap_12.json", "DCA over 12 months");
await hmapFrame("data/heatmap_24.json", "DCA over 24 months");

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
