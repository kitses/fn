import { transformSync as esbuildTransformSync } from "esbuild";
import { emptyDirSync, expandGlobSync } from "@std/fs";
import { minify as minifyHtml } from "html-minifier-terser";
import MarkdownIt from "markdown-it";
import { extname, parse } from "@std/path";
import * as sass from "sass";

const SITE_DIRECTORY = "_site";

export default function configureEleventy(eleventyConfig) {
  eleventyConfig.on("beforeBuild", () => {
    emptyDirSync(SITE_DIRECTORY);
  });

  eleventyConfig.addShortcode(
    "currentYear",
    () => String(new Date().getFullYear()),
  );

  eleventyConfig.addPassthroughCopy("src/assets/img");
  eleventyConfig.addPassthroughCopy("src/assets/woff");
  eleventyConfig.addWatchTarget("src/**/*.{css,scss}");

  const markdownParser = new MarkdownIt({ html: true, linkify: true });
  const defaultLinkRenderer = markdownParser.renderer.rules.link_open ||
    ((tokens, index, options, _env, self) =>
      self.renderToken(tokens, index, options));

  markdownParser.renderer.rules.link_open = (
    tokens,
    index,
    options,
    _env,
    self,
  ) => {
    const hyperlinkReference = tokens[index].attrGet("href");
    if (!hyperlinkReference) {
      return defaultLinkRenderer(tokens, index, options, _env, self);
    }
    if (!/^https?:\/\//i.test(hyperlinkReference)) {
      return defaultLinkRenderer(tokens, index, options, _env, self);
    }
    tokens[index].attrJoin("rel", "noopener");
    return defaultLinkRenderer(tokens, index, options, _env, self);
  };
  eleventyConfig.setLibrary("md", markdownParser);

  eleventyConfig.addExtension("css", {
    outputFileExtension: "css",
    compile: (content) => () => {
      const result = esbuildTransformSync(content, {
        loader: "css",
        minify: true,
      });
      return result.code;
    },
  });

  eleventyConfig.addExtension("scss", {
    outputFileExtension: "css",
    compile: (content, inputPath) => {
      if (!inputPath) return;
      const parsedPath = parse(inputPath);
      if (parsedPath.name.startsWith("_")) return;
      return async () =>
        (
          await sass.compileStringAsync(content, {
            style: "compressed",
            loadPaths: ["src/assets/css"],
          })
        ).css;
    },
  });

  eleventyConfig.on("afterBuild", async () => {
    for (
      const fileEntry of expandGlobSync("**/*.{html,css,js}", {
        root: SITE_DIRECTORY,
      })
    ) {
      if (!fileEntry.isFile) continue;

      const fileContent = await Deno.readTextFile(fileEntry.path);
      const fileExtension = extname(fileEntry.path);

      let minifiedContent;
      if (fileExtension === ".html") {
        const minifyOptions = {
          collapseWhitespace: true,
          removeComments: true,
          removeOptionalTags: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeTagWhitespace: true,
          useShortDoctype: true,
          minifyCSS: true,
          minifyJS: true,
        };
        minifiedContent = await minifyHtml(fileContent, minifyOptions);
      } else if (fileExtension === ".css") {
        minifiedContent = esbuildTransformSync(fileContent, {
          loader: "css",
          minify: true,
        }).code;
      } else if (fileExtension === ".js") {
        minifiedContent = esbuildTransformSync(fileContent, {
          loader: "js",
          minify: true,
        }).code;
      } else {
        minifiedContent = fileContent;
      }

      await Deno.writeTextFile(fileEntry.path, minifiedContent);
    }
  });

  return {
    templateFormats: ["njk", "md", "scss", "css"],
    dir: { input: "src", output: SITE_DIRECTORY, includes: "_includes" },
  };
}
