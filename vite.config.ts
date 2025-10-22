import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

const plugins = [react(), vitePluginManusRuntime()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@src": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      external: [
        'react-native',
        'react-native-keychain',
        'react-native-biometrics',
        'react-native-flash-message',
        'react-native-gesture-handler',
        'react-native-localize',
        'react-native-qrcode-svg',
        'react-native-reanimated',
        'react-native-safe-area-context',
        'react-native-screens',
        'react-native-sqlite-storage',
        'react-native-vision-camera',
        '@react-native-async-storage/async-storage',
        '@react-native-community/netinfo',
        '@react-navigation/native',
        '@react-navigation/native-stack',
        '@react-navigation/stack'
      ]
    }
  },
  server: {
    port: 8080,
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
