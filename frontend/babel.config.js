module.exports = {
  presets: [
    "@babel/preset-env",
    "@babel/preset-flow"
  ],
  ignore: ["src/js/ui/easyselector.js"] // this casuses errors across all anthera-based codebases. i don't know why :)
};
