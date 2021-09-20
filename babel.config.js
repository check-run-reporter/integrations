"use strict";

module.exports = function (api) {
  api.cache.using(
    () =>
      `${process.env.BABEL_ENV}-${process.env.NODE_ENV}-${process.env.BUILD_TARGET}`
  );

  const config = {
    comments: true,
    presets: [
      "@babel/preset-typescript",
      [
        "@babel/preset-env",
        {
          modules: process.env.BUILD_TARGET === "modules" ? false : undefined,
          targets: { node: true },
        },
      ],
    ],
    retainLines: process.env.NODE_ENV !== "production",
    sourceMaps: true,
  };

  return config;
};
