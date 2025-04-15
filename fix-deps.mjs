// 修复 @copilotkit/react-core 的问题

// 搜索 node_modules 中的 @copilotkit/react-core/dist 文件夹,每个文件中的 constructFinalMessages 函数, 替换为 window.constructFinalMessages 函数

import fs from "fs";
import path from "path";

const distPath = path.join(
  "./",
  "node_modules",
  "@copilotkit",
  "react-core",
  "dist",
);

const files = fs.readdirSync(distPath);

files.forEach((file) => {
  const filePath = path.join(distPath, file);
  if (!filePath.includes(".")) return;
  //   console.log(filePath);
  const content = fs.readFileSync(filePath, "utf-8");

  const newContent = content
    .replace("constructFinalMessages", "window.constructFinalMessages")
    .replace(
      "window.window.constructFinalMessages",
      "window.constructFinalMessages",
    )
    .replace(
      "function window.constructFinalMessages",
      "function constructFinalMessages",
    );
  fs.writeFileSync(filePath, newContent);
});
console.log("修复 @copilotkit/react-core 完成");
