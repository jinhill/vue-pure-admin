/**
 * 此文件作用于 `vite.config.ts` 的 `optimizeDeps.include` 依赖预构建配置项
 */
const include = [
  "qs",
  "mitt",
  "dayjs",
  "axios",
  "pinia",
  "typeit",
  "qrcode",
  "vue-i18n",
  "vue-types",
  "js-cookie",
  "vue-tippy",
  "pinyin-pro",
  "sortablejs",
  "highlight.js",
  "@vueuse/core",
  "@pureadmin/utils",
  "responsive-storage"
];

const exclude = ["@iconify/json"];

export { include, exclude };
