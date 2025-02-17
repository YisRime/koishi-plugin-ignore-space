import { Context, Schema } from 'koishi'

/**
 * 插件名称
 */
export const name = 'ignore-space'

/**
 * 插件配置接口
 * @property ignoreat 是否忽略消息起始处的@和引用
 * @property whitelist 需要忽略空格的命令列表
 * @property blacklist 不进行处理的完整命令参数列表
 */
export interface Config {
  ignoreat: boolean
  whitelist: string[]
  blacklist: string[]
}

/**
 * 插件配置 Schema
 */
export const Config: Schema<Config> = Schema.object({
  ignoreat: Schema.boolean()
    .description('是否忽略消息开头的标记（如 @ 或引用）')
    .default(true),
  whitelist: Schema.array(String)
    .description('进行忽略处理的命令列表')
    .default(['help']),
  blacklist: Schema.array(String)
    .description('无需处理的完整命令参数列表')
    .default(['help-H'])
})

/**
 * 移除字符串起始处形如 <...> 的标签
 * @param input 输入字符串
 * @returns 处理后的字符串
 */
function removeLeadingAt(input: string): string {
  return input.replace(/^<[^>]+>\s*/g, '')
}

/**
 * 清理消息：去除两端空白，并根据配置移除起始 <...> 标签
 * @param msg 原始消息
 * @param ignoreAt 是否忽略起始的 <...> 标签
 * @returns 清理后的消息
 */
function cleanMessage(msg: string, ignoreAt: boolean): string {
  let m = msg.trim()
  if (ignoreAt) m = removeLeadingAt(m)
  return m
}

/**
 * 执行命令：根据命令截取参数并触发执行
 * @param session 当前会话或上下文
 * @param cmd 命令名称
 * @param message 完整消息
 * @returns 执行结果
 */
function execCommand(session: any, cmd: string, message: string) {
  const args = message.slice(cmd.length).trim()
  return session.execute(`${cmd} ${args}`.trim())
}

/**
 * 应用插件逻辑，拦截消息并根据配置处理命令
 * @param ctx koishi 上下文
 * @param config 插件配置
 */
export function apply(ctx: Context, config: Config) {
  const prefixes = ctx.root.config.prefix || []
  const rawNick = ctx.root.config.nickname
  const nicknames = Array.isArray(rawNick) ? rawNick : rawNick ? [rawNick] : []

  // 新增辅助函数：转义正则表达式特殊字符
  function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  // 合并前缀和昵称，昵称后可跟逗号或冒号
  const markers = [
    ...prefixes.map(escapeRegExp),
    ...nicknames.map(n => escapeRegExp(n) + '[,:]?')
  ]
  // 构造统一的正则，匹配开头任一标记及其后空格
  const markerPattern = markers.length ? new RegExp(`^(?:${markers.join('|')})\\s*`) : null

  ctx.middleware(async (session, next) => {
    let message = cleanMessage(session.content, config.ignoreat)

    if (markerPattern) {
      message = message.replace(markerPattern, '')
    }

    if (message.includes('<')) {
      const atTags = message.match(/<.*?>/g) || []
      const command = message.split('<')[0].trim()
      return await session.execute(`${command} ${atTags.join(' ')}`)
    }

    // 优先处理黑名单命令
    const blCmd = config.blacklist.find(cmd => message.startsWith(cmd))
    if (blCmd) {
      return await execCommand(session, blCmd, message)
    }

    // 再处理白名单命令
    const wlCmd = config.whitelist.find(cmd => message.startsWith(cmd))
    if (wlCmd) {
      return await execCommand(session, wlCmd, message)
    }

    return next()
  })
}
