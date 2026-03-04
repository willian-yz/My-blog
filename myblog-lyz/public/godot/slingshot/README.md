# Slingshot Godot Web Export

此目录应只存放 **Godot Web 导出产物**，并与下列路径保持一致：

- `/godot/slingshot/slingshot.js`
- `/godot/slingshot/slingshot.wasm`
- `/godot/slingshot/slingshot.pck`

当前仓库已移除旧的占位导出，避免误判为“已接入 Godot”。
历史占位文件已归档到 `./_placeholder_archive/`。

## 重新导出

在仓库根目录执行：

```bash
./scripts/export_slingshot_web.sh
```

前提：本机已安装 Godot 4.x CLI 与对应 Web Export Templates。
