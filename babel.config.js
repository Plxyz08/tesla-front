module.exports = (api) => {
  api.cache(true)

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Soporte para React Native Reanimated
      "react-native-reanimated/plugin",

      // Transformaciones para módulos que no son compatibles con Hermes
      [
        "module-resolver",
        {
          alias: {
            "@": "./",
            "@components": "./components",
            "@screens": "./screens",
            "@context": "./context",
            "@services": "./services",
            "@hooks": "./hooks",
            "@lib": "./lib",
            "@models": "./models",
            "@navigation": "./navigation",
          },
        },
      ],
    ],
    env: {
      production: {
        plugins: ["transform-remove-console"],
      },
    },
  }
}
