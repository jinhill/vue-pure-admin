import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target project root directory (defaults to current working directory)
const projectRoot = process.cwd();

console.log(
  `\x1b[36m>>> Starting VuePureAdmin Pruning Automation... [Root: ${projectRoot}]\x1b[0m\n`
);

// Helper to resolve absolute path
const resolvePath = (...args) => path.resolve(projectRoot, ...args);

// Helper to safely delete file
const safeDeleteFile = filePath => {
  const absPath = resolvePath(filePath);
  if (fs.existsSync(absPath)) {
    try {
      fs.unlinkSync(absPath);
      console.log(`\x1b[32m[DELETED FILE]\x1b[0m ${filePath}`);
    } catch (err) {
      console.error(
        `\x1b[31m[ERROR]\x1b[0m Failed to delete file ${filePath}:`,
        err.message
      );
    }
  } else {
    console.log(`\x1b[90m[SKIP]\x1b[0m File already deleted: ${filePath}`);
  }
};

// Helper to safely delete folder recursively
const safeDeleteFolder = folderPath => {
  const absPath = resolvePath(folderPath);
  if (fs.existsSync(absPath)) {
    try {
      fs.rmSync(absPath, { recursive: true, force: true });
      console.log(`\x1b[32m[DELETED FOLDER]\x1b[0m ${folderPath}`);
    } catch (err) {
      console.error(
        `\x1b[31m[ERROR]\x1b[0m Failed to delete folder ${folderPath}:`,
        err.message
      );
    }
  } else {
    console.log(`\x1b[90m[SKIP]\x1b[0m Folder already deleted: ${folderPath}`);
  }
};

// Helper to safely modify file contents
const safeModifyFile = (filePath, modifyFn) => {
  const absPath = resolvePath(filePath);
  if (fs.existsSync(absPath)) {
    try {
      const content = fs.readFileSync(absPath, "utf8");
      const newContent = modifyFn(content);
      if (content !== newContent) {
        fs.writeFileSync(absPath, newContent, "utf8");
        console.log(`\x1b[34m[MODIFIED FILE]\x1b[0m ${filePath}`);
      } else {
        console.log(
          `\x1b[90m[SKIP]\x1b[0m File already in pruned state: ${filePath}`
        );
      }
    } catch (err) {
      console.error(
        `\x1b[31m[ERROR]\x1b[0m Failed to modify file ${filePath}:`,
        err.message
      );
    }
  } else {
    console.error(
      `\x1b[33m[WARNING]\x1b[0m File does not exist to modify: ${filePath}`
    );
  }
};

// Helper to safely write file with content
const safeWriteFile = (filePath, content) => {
  const absPath = resolvePath(filePath);
  const dirPath = path.dirname(absPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  try {
    fs.writeFileSync(absPath, content, "utf8");
    console.log(`\x1b[34m[WRITTEN FILE]\x1b[0m ${filePath}`);
  } catch (err) {
    console.error(
      `\x1b[31m[ERROR]\x1b[0m Failed to write file ${filePath}:`,
      err.message
    );
  }
};

// ==========================================
// 📋 1. CLEANUP STATIC ROUTING CONFIGS
// ==========================================
console.log("\n\x1b[35m=== 📋 1. Cleaning static routing files ===\x1b[0m");
const routerModulesDir = resolvePath("src/router/modules");
if (fs.existsSync(routerModulesDir)) {
  const files = fs.readdirSync(routerModulesDir);
  files.forEach(file => {
    if (file !== "home.ts" && file !== "remaining.ts") {
      safeDeleteFile(`src/router/modules/${file}`);
    }
  });
}

// ==========================================
// 📋 2. CLEANUP UNUSED VIEW DIRECTORIES
// ==========================================
console.log("\n\x1b[35m=== 📋 2. Cleaning unused view folders ===\x1b[0m");
const keepViews = new Set([
  "welcome",
  "system",
  "monitor",
  "login",
  "error",
  "account-settings"
]);
const viewsDir = resolvePath("src/views");
if (fs.existsSync(viewsDir)) {
  const dirs = fs.readdirSync(viewsDir);
  dirs.forEach(dir => {
    const dirPath = path.join(viewsDir, dir);
    if (fs.statSync(dirPath).isDirectory()) {
      if (!keepViews.has(dir)) {
        safeDeleteFolder(`src/views/${dir}`);
      }
    }
  });
}

// ==========================================
// 📋 3. CLEANUP UNUSED RE COMPONENTS
// ==========================================
console.log(
  "\n\x1b[35m=== 📋 3. Cleaning unused Re secondary components ===\x1b[0m"
);
const componentsToDelete = [
  "ReBarcode",
  "ReCropper",
  "ReCropperPreview",
  "ReFlowChart",
  "ReMap",
  "ReSeamlessScroll",
  "ReSelector",
  "ReSplitPane",
  "ReVxeTableBar",
  "ReTreeLine",
  "ReFlop"
];
componentsToDelete.forEach(comp => {
  safeDeleteFolder(`src/components/${comp}`);
});

// ==========================================
// 📋 4. CLEANUP SINGLE REDUNDANT UTILS / PLUGINS
// ==========================================
console.log(
  "\n\x1b[35m=== 📋 4. Cleaning standalone unused modules ===\x1b[0m"
);
safeDeleteFile("src/utils/chinaArea.ts");
safeDeleteFile("src/plugins/vxeTable.ts");

// ==========================================
// 📋 5. DECOUPLING MAIN SYSTEM FILES & VIEWS
// ==========================================
console.log(
  "\n\x1b[35m=== 📋 5. Decoupling system references and templates ===\x1b[0m"
);

// 5.1 Clean remaining.ts (remove '/empty' route)
safeModifyFile("src/router/modules/remaining.ts", content => {
  return content.replace(
    /\n\s*\{\s*path:\s*['"]\/empty['"][\s\S]*?\},\s*/g,
    "\n"
  );
});

// 5.2 Clean main.ts (remove vxe-table global plugins)
safeModifyFile("src/main.ts", content => {
  let res = content.replace(
    /import\s+\{\s*useVxeTable\s*\}\s+from\s+["']@\/plugins\/vxeTable["'];?\s*/g,
    ""
  );
  res = res.replace(/\.use\(useVxeTable\)/g, "");
  return res;
});

// 5.3 Clean App.vue (remove plus-pro-components locales)
safeModifyFile("src/App.vue", content => {
  let res = content.replace(
    /import\s+plusEn\s+from\s+["']plus-pro-components\/es\/locale\/lang\/en["'];?\s*/g,
    ""
  );
  res = res.replace(
    /import\s+plusZhCn\s+from\s+["']plus-pro-components\/es\/locale\/lang\/zh-cn["'];?\s*/g,
    ""
  );
  res = res.replace(/\{\s*\.\.\.zhCn,\s*\.\.\.plusZhCn\s*\}/g, "zhCn");
  res = res.replace(/\{\s*\.\.\.en,\s*\.\.\.plusEn\s*\}/g, "en");
  return res;
});

// 5.4 Clean layout/index.vue (remove animate.css)
safeModifyFile("src/layout/index.vue", content => {
  return content.replace(/import\s+["']animate\.css["'];?\s*/g, "");
});

// 5.5 Overwrite mock/asyncRoutes.ts with core-only dynamic routing
const cleanAsyncRoutes = `// 模拟后端动态生成路由
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { system, monitor } from "@/router/enums";

const systemManagementRouter = {
  path: "/system",
  meta: {
    icon: "ri:settings-3-line",
    title: "menus.pureSysManagement",
    rank: system
  },
  children: [
    {
      path: "/system/user/index",
      name: "SystemUser",
      meta: {
        icon: "ri:admin-line",
        title: "menus.pureUser",
        roles: ["admin"]
      }
    },
    {
      path: "/system/role/index",
      name: "SystemRole",
      meta: {
        icon: "ri:admin-fill",
        title: "menus.pureRole",
        roles: ["admin"]
      }
    },
    {
      path: "/system/menu/index",
      name: "SystemMenu",
      meta: {
        icon: "ep:menu",
        title: "menus.pureSystemMenu",
        roles: ["admin"]
      }
    },
    {
      path: "/system/dept/index",
      name: "SystemDept",
      meta: {
        icon: "ri:git-branch-line",
        title: "menus.pureDept",
        roles: ["admin"]
      }
    }
  ]
};

const systemMonitorRouter = {
  path: "/monitor",
  meta: {
    icon: "ep:monitor",
    title: "menus.pureSysMonitor",
    rank: monitor
  },
  children: [
    {
      path: "/monitor/online-user",
      component: "monitor/online/index",
      name: "OnlineUser",
      meta: {
        icon: "ri:user-voice-line",
        title: "menus.pureOnlineUser",
        roles: ["admin"]
      }
    },
    {
      path: "/monitor/login-logs",
      component: "monitor/logs/login/index",
      name: "LoginLog",
      meta: {
        icon: "ri:window-line",
        title: "menus.pureLoginLog",
        roles: ["admin"]
      }
    },
    {
      path: "/monitor/operation-logs",
      component: "monitor/logs/operation/index",
      name: "OperationLog",
      meta: {
        icon: "ri:history-fill",
        title: "menus.pureOperationLog",
        roles: ["admin"]
      }
    },
    {
      path: "/monitor/system-logs",
      component: "monitor/logs/system/index",
      name: "SystemLog",
      meta: {
        icon: "ri:file-search-line",
        title: "menus.pureSystemLog",
        roles: ["admin"]
      }
    }
  ]
};

export default defineFakeRoute([
  {
    url: "/get-async-routes",
    method: "get",
    response: () => {
      return {
        code: 0,
        message: "操作成功",
        data: [
          systemManagementRouter,
          systemMonitorRouter
        ]
      };
    }
  }
]);
`;
safeWriteFile("mock/asyncRoutes.ts", cleanAsyncRoutes);

// 5.6 Overwrite src/views/monitor/logs/system/detail.vue with native pre elements
const cleanDetailVue = `<script setup lang="tsx">
import { ref } from "vue";

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
});

const columns = [
  {
    label: "IP 地址",
    prop: "ip"
  },
  {
    label: "地点",
    prop: "address"
  },
  {
    label: "操作系统",
    prop: "system"
  },
  {
    label: "浏览器类型",
    prop: "browser"
  },
  {
    label: "所属模块",
    prop: "module"
  },
  {
    label: "请求时间",
    prop: "requestTime"
  },
  {
    label: "请求方法",
    prop: "method"
  },
  {
    label: "请求耗时",
    prop: "takesTime"
  },
  {
    label: "请求接口",
    prop: "url",
    copy: true
  },
  {
    label: "TraceId",
    prop: "traceId",
    copy: true
  }
];

const dataList = ref([
  {
    title: "响应头",
    name: "responseHeaders",
    data: (props.data[0] as any).responseHeaders
  },
  {
    title: "响应体",
    name: "responseBody",
    data: (props.data[0] as any).responseBody
  },
  {
    title: "请求头",
    name: "requestHeaders",
    data: (props.data[0] as any).requestHeaders
  },
  {
    title: "请求体",
    name: "requestBody",
    data: (props.data[0] as any).requestBody
  }
]);
</script>

<template>
  <div>
    <el-scrollbar>
      <PureDescriptions border :data="data" :columns="columns" :column="5" />
    </el-scrollbar>
    <el-tabs :modelValue="'responseBody'" type="border-card" class="mt-4">
      <el-tab-pane
        v-for="(item, index) in dataList"
        :key="index"
        :name="item.name"
        :label="item.title"
      >
        <el-scrollbar max-height="calc(100vh - 240px)">
          <pre class="bg-(--el-fill-color-light) p-4 rounded text-sm overflow-auto text-left font-mono">{{ JSON.stringify(item.data, null, 2) }}</pre>
        </el-scrollbar>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
`;
safeWriteFile("src/views/monitor/logs/system/detail.vue", cleanDetailVue);

// 5.7 Overwrite Profile.vue with zero-dependency direct avatar upload component
const cleanProfileVue = `<script setup lang="ts">
import { formUpload } from "@/api/mock";
import { message } from "@/utils/message";
import { onMounted, reactive, ref } from "vue";
import { type UserInfo, getMine } from "@/api/user";
import type { FormInstance, FormRules } from "element-plus";
import { createFormData, deviceDetection } from "@pureadmin/utils";
import uploadLine from "~icons/ri/upload-line";

defineOptions({
  name: "Profile"
});

const uploadRef = ref();
const userInfoFormRef = ref<FormInstance>();

const userInfos = reactive({
  avatar: "",
  nickname: "",
  email: "",
  phone: "",
  description: ""
});

const rules = reactive<FormRules<UserInfo>>({
  nickname: [{ required: true, message: "昵称必填", trigger: "blur" }]
});

function queryEmail(queryString, callback) {
  const emailList = [
    { value: "@qq.com" },
    { value: "@126.com" },
    { value: "@163.com" }
  ];
  let results = [];
  let queryList = [];
  emailList.map(item =>
    queryList.push({ value: queryString.split("@")[0] + item.value })
  );
  results = queryString
    ? queryList.filter(
        item =>
          item.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
      )
    : queryList;
  callback(results);
}

const onChange = uploadFile => {
  const formData = createFormData({
    files: uploadFile.raw
  });
  formUpload(formData)
    .then(({ code }) => {
      if (code === 0) {
        message("更新头像成功", { type: "success" });
        const reader = new FileReader();
        reader.onload = e => {
          userInfos.avatar = e.target.result as string;
        };
        reader.readAsDataURL(uploadFile.raw);
      } else {
        message("更新头像失败");
      }
    })
    .catch(error => {
      message(\`提交异常 \${error}\`, { type: "error" });
    })
    .finally(() => {
      uploadRef.value.clearFiles();
    });
};

// 更新信息
const onSubmit = async (formEl: FormInstance) => {
  await formEl.validate((valid, fields) => {
    if (valid) {
      console.log(userInfos);
      message("更新信息成功", { type: "success" });
    } else {
      console.log("error submit!", fields);
    }
  });
};

onMounted(async () => {
  const { code, data } = await getMine();
  if (code === 0) {
    Object.assign(userInfos, data);
  }
});
</script>

<template>
  <div :class="['min-w-45', deviceDetection() ? 'max-w-full' : 'max-w-[70%]']">
    <h3 class="my-8!">个人信息</h3>
    <el-form
      ref="userInfoFormRef"
      label-position="top"
      :rules="rules"
      :model="userInfos"
    >
      <el-form-item label="头像">
        <el-avatar :size="80" :src="userInfos.avatar" />
        <el-upload
          ref="uploadRef"
          accept="image/*"
          action="#"
          :limit="1"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="onChange"
        >
          <el-button plain class="ml-4!">
            <IconifyIconOffline :icon="uploadLine" />
            <span class="ml-2">更新头像</span>
          </el-button>
        </el-upload>
      </el-form-item>
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="userInfos.nickname" placeholder="请输入昵称" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-autocomplete
          v-model="userInfos.email"
          :fetch-suggestions="queryEmail"
          :trigger-on-focus="false"
          placeholder="请输入邮箱"
          clearable
          class="w-full"
        />
      </el-form-item>
      <el-form-item label="联系电话">
        <el-input
          v-model="userInfos.phone"
          placeholder="请输入联系电话"
          clearable
        />
      </el-form-item>
      <el-form-item label="简介">
        <el-input
          v-model="userInfos.description"
          placeholder="请输入简介"
          type="textarea"
          :autosize="{ minRows: 6, maxRows: 8 }"
          maxlength="56"
          show-word-limit
        />
      </el-form-item>
      <el-button type="primary" @click="onSubmit(userInfoFormRef)">
        更新信息
      </el-button>
    </el-form>
  </div>
</template>
`;
safeWriteFile(
  "src/views/account-settings/components/Profile.vue",
  cleanProfileVue
);

// ==========================================
// 📋 6. DEPENDENCY PURGING (package.json)
// ==========================================
console.log(
  "\n\x1b[35m=== 📋 6. Optimization of package.json dependencies ===\x1b[0m"
);
const packageJsonPath = resolvePath("package.json");
if (fs.existsSync(packageJsonPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    const depsToRemove = [
      "@amap/amap-jsapi-loader",
      "@infectoone/vue-ganttastic",
      "@logicflow/core",
      "@logicflow/extension",
      "@vue-flow/background",
      "@vue-flow/core",
      "@wangeditor/editor",
      "@wangeditor/editor-for-vue",
      "codemirror",
      "codemirror-editor-vue3",
      "deep-chat",
      "el-table-infinite-scroll",
      "jsbarcode",
      "mint-filter",
      "mqtt",
      "plus-pro-components",
      "vditor",
      "vue-pdf-embed",
      "vue3-danmaku",
      "vue3-puzzle-vcode",
      "vxe-table",
      "wavesurfer.js",
      "xgplayer",
      "xlsx",
      "intro.js",
      "cropperjs",
      "swiper",
      "vue-json-pretty",
      "vue-virtual-scroller",
      "vuedraggable",
      "@howdyjs/mouse-menu",
      "v-contextmenu",
      "vue-waterfall-plugin-next",
      "china-area-data",
      "animate.css"
    ];

    const devDepsToRemove = [
      "@types/codemirror",
      "@types/dagre",
      "@types/intro.js",
      "dagre"
    ];

    let modified = false;

    if (pkg.dependencies) {
      depsToRemove.forEach(dep => {
        if (pkg.dependencies[dep]) {
          delete pkg.dependencies[dep];
          console.log(`\x1b[32m[REMOVED DEP]\x1b[0m dependencies.${dep}`);
          modified = true;
        }
      });
    }

    if (pkg.devDependencies) {
      devDepsToRemove.forEach(dep => {
        if (pkg.devDependencies[dep]) {
          delete pkg.devDependencies[dep];
          console.log(`\x1b[32m[REMOVED DEVDEP]\x1b[0m devDependencies.${dep}`);
          modified = true;
        }
      });
    }

    if (modified) {
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(pkg, null, 2) + "\n",
        "utf8"
      );
      console.log(
        `\x1b[34m[WRITTEN package.json]\x1b[0m Successfully updated dependencies.`
      );
    } else {
      console.log(`\x1b[90m[SKIP]\x1b[0m dependencies are already clean.`);
    }
  } catch (err) {
    console.error(
      `\x1b[31m[ERROR]\x1b[0m Failed to parse/modify package.json:`,
      err.message
    );
  }
}

// ==========================================
// 📋 7. VITE PRE-BUNDLING & BUILD SAFEGUARDS
// ==========================================
console.log(
  "\n\x1b[35m=== 📋 7. Optimization of Vite Pre-bundling config & utils ===\x1b[0m"
);

// 7.1 Overwrite build/optimize.ts
const cleanOptimizeTs = `/**
 * 此文件作用于 \`vite.config.ts\` 的 \`optimizeDeps.include\` 依赖预构建配置项
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
`;
safeWriteFile("build/optimize.ts", cleanOptimizeTs);

// 7.2 Inject existsSync check in build/utils.ts
safeModifyFile("build/utils.ts", content => {
  // Inject imports if not present
  if (!content.includes("existsSync")) {
    content = content.replace(
      /import\s+\{\s*readdir,\s*stat\s*\}\s+from\s+["']node:fs["'];?/g,
      'import { readdir, stat, existsSync } from "node:fs";'
    );
  }

  // Inject safety check inside getPackageSize
  if (!content.includes("if (!existsSync(folder))")) {
    content = content.replace(
      /(const getPackageSize = options => \{[\s\S]*?const \{ folder = "dist"[^}]*?\} = options;)/,
      "$1\n  if (!existsSync(folder)) {\n    return callback(0);\n  }"
    );
  }
  return content;
});

console.log(
  "\n\x1b[36m>>> VuePureAdmin Pruning Completed Successfully! 🎉\x1b[0m"
);
console.log(
  "\x1b[33m>>> To apply the changes, run: pnpm install && pnpm build\x1b[0m\n"
);
