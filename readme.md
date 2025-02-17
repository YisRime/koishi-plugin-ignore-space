# koishi-plugin-ignore-space

[![npm](https://img.shields.io/npm/v/koishi-plugin-ignore-space?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-ignore-space)

忽略指令和参数之间的空格，支持黑白名单

## 安装

使用 npm 或 yarn 安装:

```bash
npm install koishi-plugin-ignore-space
# or
yarn add koishi-plugin-ignore-space
```

## 配置

在 Koishi 配置文件中添加如下插件配置示例:

```javascript
export default {
  plugins: {
    'ignore-space': {
      // ignoreat: 是否忽略消息开头的标记（如 @ 或引用），默认为 true
      ignoreat: true,
      // whitelist: 需要进行空格忽略处理的命令列表，默认为 ['help']
      whitelist: ['help'],
      // blacklist: 完整命令参数列表，不进行处理，默认为 ['help-H']
      blacklist: ['help-H']
    }
  }
}
```

## 使用

插件会自动清理消息中的空格及起始标记，具体行为根据配置项决定，详情参阅源码及相关文档。
