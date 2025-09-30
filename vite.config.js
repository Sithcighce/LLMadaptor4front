import react from "@vitejs/plugin-react";
import path from "path";
import eslint from "vite-plugin-eslint2";
import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";

import { defineConfig  } from "vite";

export default ({ mode }) => {
  
  return defineConfig({
    root: "src",
    publicDir: mode === 'development' ? '../public' : false,
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
    build: {
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
    },
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