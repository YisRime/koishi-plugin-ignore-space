import { Context, Schema } from 'koishi'

/**
 * 插件名称
 */
export const name = 'ignore-space'

/**
 * 插件配置接口
 * @property ignoreAt 是否忽略消息起始处的@标记
 * @property ignoreQuote 是否忽略消息起始处的引用
 * @property whitelist 需要忽略空格的命令列表
 * @property blacklist 不进行处理的完整命令参数列表
 * @interface Config
 * @example
 */
export interface Config {
  ignoreAt: boolean
  ignoreQuote: boolean
  whitelist: string[]
  blacklist: string[]
}

/**
 * 插件配置 Schema
 */
export const Config: Schema<Config> = Schema.object({
  ignoreAt: Schema.boolean()
    .description('是否忽略消息开头的@标记')
    .default(true),
  ignoreQuote: Schema.boolean()
    .description('是否忽略消息开头的引用')
    .default(true),
  whitelist: Schema.array(String)
    .description('进行忽略处理的命令列表')
    .default(['help']),
  blacklist: Schema.array(String)
    .description('无需处理的完整命令参数列表')
    .default(['help-H'])
})

/**
 * 移除字符串起始处的@标记
 * @param {string} input - 需要处理的输入字符串
 * @returns {string} 移除了起始@标记的字符串
 * @example
 */
function removeLeadingAt(input: string): string {
  return input.replace(/^<at[^>]+>\s*/g, '') // 去除形如 <at...> 的标记
}

// 删除 removeLeadingQuote 函数

/**
 * 清理消息内容
 * @param {string} msg - 原始消息内容
 * @param {boolean} ignoreAt - 是否移除开头的@标记
 * @returns {string} 清理后的消息内容
 * @example
 */
function cleanMessage(msg: string, ignoreAt: boolean): string {
  let m = msg.trim()
  if (ignoreAt) m = removeLeadingAt(m)
  return m
}

/**
 * 执行命令并添加引用内容
 * @param {any} session - Koishi 会话对象
 * @param {string} cmd - 要执行的命令
 * @param {string} args - 命令参数
 * @param {Config} config - 插件配置
 * @returns {Promise<any>} 命令执行结果
 * @example
 */
function execCommand(session: any, cmd: string, args: string, config: Config) {
  const quoteContent = config.ignoreQuote && session.quote?.content ? ` ${session.quote.content}` : ''
  return session.execute(`${cmd}${args ? ' ' + args : ''}${quoteContent}`)
}

/**
 * 插件主函数
 * @param {Context} ctx - Koishi 上下文对象
 * @param {Config} config - 插件配置
 * @example
 */
export function apply(ctx: Context, config: Config) {
  // 1. 首先获取配置中的前缀和昵称
  const prefixes = ctx.root.config.prefix || []  // 获取命令前缀，如 ['!', '.']
  const rawNick = ctx.root.config.nickname      // 获取机器人昵称
  const nicknames = Array.isArray(rawNick) ? rawNick : rawNick ? [rawNick] : []  // 处理昵称为数组形式

  // 2. 定义转义函数，确保特殊字符被正确处理
  function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  // 3. 构造标记数组，包含：
  // - 转义后的前缀
  // - 转义后的昵称（昵称后可以跟逗号或冒号）
  const markers = [
    ...prefixes.map(escapeRegExp),
    ...nicknames.map(n => escapeRegExp(n) + '[,:]?')
  ]

  // 4. 最终构造正则表达式
  const markerPattern = markers.length ? new RegExp(`^(?:${markers.join('|')})\\s*`) : null

  ctx.middleware(async (session, next) => {
    // 清理消息内容
    let message = cleanMessage(session.content, config.ignoreAt)

    // 检查是否有前缀或昵称匹配
    if (!(!markerPattern || markerPattern.test(message))) return next()

    if (markerPattern) {
      message = message.replace(markerPattern, '')
    }

    // 提取命令和参数
    let cmd: string, args: string
    if (message.includes('<')) {
      const atTags = message.match(/<.*?>/g) || []
      cmd = message.split('<')[0].trim()
      args = atTags.join(' ')
    } else {
      // 优先检查黑名单
      const targetCmd = config.blacklist.find(cmd => message.startsWith(cmd))
        || config.whitelist.find(cmd => message.startsWith(cmd))

      if (!targetCmd) return next()

      cmd = targetCmd
      args = message.slice(targetCmd.length).trim()
    }

    return execCommand(session, cmd, args, config)
  })
}
