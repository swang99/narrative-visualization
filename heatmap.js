import { 
	createTextBlock, hmapFrame, 
	linkFadeOut
} from './chartUtil.js';

export function hmapHeader() {
	const section = d3.select(".header-text")

	const hmapTextBlocks = [
		{
			header: "h2",
			displayText: "Lump Sum or DCA?"
		},
		{
			header: "p",
			color: "#666666",
			displayText: "A comparison of the strategies on various start years and investment timeframes. What is the takeaway?"
		}
	]

	hmapTextBlocks.forEach((block) => {
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
}

// declare heatmap configurations
const hmapConfig = {
	width: 850,
	height: 150,
	margin: {top: 10, right: 25, bottom: 30, left: 40},
	time: { base: 100, step: 10, initDelay: 10, duration: 1000 },
};

hmapHeader();
await hmapFrame(3, 12, "Lump Sum vs. DCA spread over 12 months (March start date)", 
	d3.select(".header-text"), hmapConfig);
await hmapFrame(3, 24, "Lump Sum vs. DCA spread over 24 months (March start date)",
	null, hmapConfig);

// fade out on any link click
linkFadeOut();