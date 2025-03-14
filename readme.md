# koishi-plugin-ignore-space

[![npm](https://img.shields.io/npm/v/koishi-plugin-ignore-space?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-ignore-space)

忽略特定指令与特定参数之间的空格，可配置对于艾特和引用内容的处理

## 功能特点

- 自动清理命令和参数之间的空格
- 可选择是否忽略消息开头的 @ 标记
- 可选择是否忽略引用内容
- 支持命令白名单和黑名单配置
- 智能识别命令前缀

## 配置项

```typescript
export interface Config {
  // 是否忽略消息开头@前缀，默认为 true
  ignoreAt: boolean
  // 是否忽略引用内容，默认为 true
  ignoreQuote: boolean
  // 进行忽略处理的命令列表，默认为 ['help']
  whitelist: string[]
  // 无需处理的完整命令参数列表，默认为 ['help-H']
  blacklist: string[]
}
```

## 工作原理

1. 插件会自动识别并处理消息中的以下内容：
   - 命令前缀（包括自定义前缀和昵称）
   - @ 标记（可配置是否忽略）
   - 引用内容（可配置是否忽略）
   - 命令和参数之间的空格

2. 处理流程：
   - 清理消息前后的空格
   - 根据配置移除 @ 标记
   - 识别并处理命令前缀
   - 检查命令是否在黑白名单中
   - 重新组装并执行处理后的命令

## 注意事项

- 只有在白名单中的命令或匹配黑名单的完整命令才会进行处理
- 支持带有 at 标签的复杂命令格式
- 插件会保持引用内容的完整性（除非配置 ignoreQuote 为 false）
