import react from "@vitejs/plugin-react";
import path from "path";
import eslint from "vite-plugin-eslint2";
import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";

import { defineConfig  } from "vite";

export default ({ mode }) => {
  
  // Determine if we're building for demo or library
  const isDemoMode = mode === 'demo';
  
  // Library build configuration (for npm package)
  const libBuildConfig = {
    lib: {
      entry: path.resolve(__dirname, "src/index.tsx"),
      name: "llm-connector",
      fileName: "index",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react-dom/server",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@mlc-ai/web-llm",
      ],
      output: {
        globals: {
          react: "React",
        }
      },
    },
    outDir: "../dist",
    assetsInclude: ['**/*.wasm'],
  };

  // Demo/Preview build configuration (for Vercel deployment)
  const demoBuildConfig = {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/index.html"),
      },
    },
    outDir: "../dist",
    assetsInclude: ['**/*.wasm'],
  };

  return defineConfig({
    root: "src",
    publicDir: '../public',
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    preview: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    build: isDemoMode ? demoBuildConfig : libBuildConfig,
    css: {
      postcss: {
        plugins: [
          tailwindcss,
          autoprefixer,
        ],
      },
    },
    plugins: [
      react({
        include: "**/*.{jsx,tsx}",
      }),
      // eslint() // 暂时禁用 ESLint 来专注于样式问题
    ],
  });
}