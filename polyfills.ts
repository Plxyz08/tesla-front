// Primero, declaramos las interfaces para extender el objeto global
declare global {
  interface Global {
    HermesInternal?: any
    __turboModuleProxy?: any
  }
}

// Polyfill para setImmediate
if (typeof setImmediate === "undefined") {
  ;(global as any).setImmediate = (callback: () => void) => setTimeout(callback, 0)
}

// Asegurarse de que PlatformConstants esté disponible
import Constants from "expo-constants"
import { NativeModules } from "react-native"

// Verificar si estamos en un entorno Hermes
if ((global as any).HermesInternal && !(global as any).__turboModuleProxy) {
  // Esto es necesario para algunos módulos que dependen de PlatformConstants
  if (!NativeModules.PlatformConstants) {
    // Proporcionar un sustituto básico si es necesario
    NativeModules.PlatformConstants = {
      getConstants: () => ({
        reactNativeVersion: Constants.expoConfig?.sdkVersion
          ? { major: Number.parseInt(Constants.expoConfig.sdkVersion.split(".")[0]), minor: 0, patch: 0 }
          : { major: 0, minor: 76, patch: 9 },
      }),
    }
  }
}
