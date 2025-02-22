/**
 * @module ignore-space
 * @description 一个用于处理消息空格的 Koishi 插件
 */

import { Context, Schema } from 'koishi'

export const name = 'ignore-space'

/**
 * @interface Config
 * @description 插件配置项接口
 */
export interface Config {
  /** 是否忽略消息开头@前缀 */
  ignoreAt: boolean
  /** 是否忽略引用内容 */
  ignoreQuote: boolean
  /** 进行忽略处理的命令列表 */
  whitelist: string[]
  /** 无需处理的完整命令参数列表 */
  blacklist: string[]
}

export const Config: Schema<Config> = Schema.object({
  ignoreAt: Schema.boolean().description('忽略消息开头@前缀').default(true),
  ignoreQuote: Schema.boolean().description('忽略引用内容').default(true),
  whitelist: Schema.array(String).description('进行忽略处理的命令列表').default(['help']),
  blacklist: Schema.array(String).description('无需处理的完整命令参数列表').default(['help-H'])
})

/**
 * @function apply
 * @description 插件主函数，处理消息中的空格并重新执行命令
 * @param ctx - Koishi 上下文
 * @param config - 插件配置
 */
export function apply(ctx: Context, config: Config) {
  const prefixes = ctx.root.config.prefix || []
  const nicknames = Array.isArray(ctx.root.config.nickname)
    ? ctx.root.config.nickname
    : ctx.root.config.nickname ? [ctx.root.config.nickname] : []

  /**
   * @private
   * @description 匹配命令前缀的正则表达式
   */
  const markerPattern = [...prefixes, ...nicknames].length
    ? new RegExp(`^(?:${[...prefixes, ...nicknames.map(n => n + '[,:]?')]
        .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|')})\\s*`)
    : null

  /**
   * 处理消息空格的中间件
   * @param session - 会话上下文
   * @param next - 下一个中间件
   * @returns Promise 执行结果
   */
  ctx.middleware(async (session, next) => {
    // 获取并清理消息内容
    let message = session.content.trim()
    if (config.ignoreAt) {
      // 移除开头的 at 标记
      message = message.replace(/^<at[^>]+>\s*/g, '')
    }

    // 检查是否包含命令前缀，如果没有则跳过处理
    if (!(!markerPattern || markerPattern.test(message))) return next()
    // 移除命令前缀
    if (markerPattern) message = message.replace(markerPattern, '')

    let cmd: string, args: string
    if (message.includes('<')) {
      // 处理包含 at 标签的情况
      const atTags = message.match(/<.*?>/g) || []
      cmd = message.split('<')[0].trim()
      args = atTags.join(' ')
    } else {
      // 检查是否匹配黑名单或白名单中的命令
      const targetCmd = config.blacklist.find(cmd => message.startsWith(cmd))
        || config.whitelist.find(cmd => message.startsWith(cmd))
      if (!targetCmd) return next()

      // 提取命令和参数
      cmd = targetCmd
      args = message.slice(targetCmd.length).trim()
    }

    // 构造最终执行的命令
    const finalCommand = `${cmd}${args ? ' ' + args : ''}${
      !config.ignoreQuote && session.quote?.content ? ' ' + session.quote.content : ''
    }`

    // 重新执行处理后的命令
    return session.execute(finalCommand)
  })
}
