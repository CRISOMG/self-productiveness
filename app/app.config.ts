export default defineAppConfig({
  ui: {
    colors: {
      primary: "peach",
      neutral: "brand-charcoal",
    },
    container: {
      base: "w-full max-w-(--ui-container) mx-auto px-4 sm:px-6 lg:px-8",
    },
    button: {
      slots: {
        base: ["rounded-xs transition-colors duration-200"],
      },
    },
  },
});
