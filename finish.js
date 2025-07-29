import { 
	createTextBlock, fadeIn, hmapFrame, 
	linkFadeOut
} from './chartUtil.js';

export function hmapHeader() {
	// text blocks
	const section = d3.select(".header-text")
	const finTextBlocks = [
		{
			header: "h2",
			displayText: "Time in the market > timing the market"
		},
		{
			header: "h2",
			color: "#666666",
			displayText: "We observe lump sum outperforming DCA in a majority of cases."
		},
		{
			header: "p",
			color: "#666666",
			displayText: "The longer we spread out our DCA, the less attractive it becomes compared to lump sum."
		},
		{
			header: "p",
			color: "#666666",
			displayText: "Even if timing is not the best, more money being invested for a longer time usually holds more weight.",

		}
	]

	finTextBlocks.forEach((block) => {
		createTextBlock({
			html: section,
			header: block.header,
			displayText: block.displayText,
			color: block.color,
			transDuration: hmapConfig.time.duration,
			numWaits: 0,
			highlight: false
		});
	})

	// heatmap parameters
	d3.select(".dropdown-group").style("opacity", 0)
	fadeIn(d3.select(".dropdown-group"), 2, 1, hmapConfig.time);
}

// declare heatmap configuration
const hmapConfig = {
	width: 850,
	height: 150,
	margin: {top: 10, right: 25, bottom: 30, left: 40},
	time: { base: 100, step: 10, initDelay: 10, duration: 1000 },
};

// show heatmap header
(async function main() {
	hmapHeader();

	// get selection parameters
	const monthSelect = document.getElementById('month-select');
	const dcaSelect = document.getElementById('dca-select');
	let currMonth = +monthSelect.value;
	let currDcaDur = +dcaSelect.value;

	// draw heatmap
	await hmapFrame(currMonth, currDcaDur, `Lump Sum vs. DCA spread over ${currDcaDur} months`,
		d3.select("#lump-dca-heatmap"), hmapConfig
	);

	// update on dropdown change
	monthSelect.addEventListener('change', async () => {
		currMonth = +monthSelect.value;
		d3.select("#lump-dca-heatmap").html("");
		await hmapFrame(currMonth, currDcaDur, `Lump Sum vs. DCA spread over ${currDcaDur} months`, 
			d3.select("#lump-dca-heatmap"), hmapConfig, true);
	});

	dcaSelect.addEventListener('change', async () => {
		currDcaDur = +dcaSelect.value;
		d3.select("#lump-dca-heatmap").html("");
		await hmapFrame(currMonth, currDcaDur, `Lump Sum vs. DCA spread over ${currDcaDur} months`, 
			d3.select("#lump-dca-heatmap"), hmapConfig, true);
	});

	linkFadeOut();
})();
