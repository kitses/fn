import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
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
		syntaxHighlight: false,
		processor: unified({
			smartypants: false,
			rehypePlugins: [
				[rehypeExternalLinks, { rel: ["noopener"], target: false }],
			],
		}),
	},
});
