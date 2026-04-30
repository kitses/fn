import { defineConfig } from "astro/config";
import rehypeExternalLinks from "rehype-external-links";
import mdx from "@astrojs/mdx";
import compress from "astro-compress";

// https://astro.build/config
export default defineConfig({
	compressHTML: false,
	integrations: [
		mdx(),
		compress({
			Image: false,
			SVG: false,
			HTML: {
				collapseWhitespace: true,
			},
		}),
	],
	markdown: {
		smartypants: false,
		syntaxHighlight: false,
		rehypePlugins: [
			[rehypeExternalLinks, { rel: ["noopener"], target: false }],
		],
	},
});
