// 保留接口兼容（实际逻辑移到 extractContentFromBuffer）
export function parseSSEChunk(_chunk: string): string {
  return ''
}

// 从累积的原始 SSE 数据中提取所有 delta.content（跳过 reasoning_content）
export function extractContentFromBuffer(rawData: string): string {
  const parts: string[] = []
  const regex = /"delta":\s*\{[^}]*"content"\s*:\s*"((?:[^"\\]|\\.)*)"/g
  let match
  while ((match = regex.exec(rawData)) !== null) {
    try {
      parts.push(JSON.parse(`"${match[1]}"`))
    } catch {}
  }
  return parts.join('')
}

// 提取 reasoning_content（思考过程）用于展示
export function extractReasoningFromBuffer(rawData: string): string {
  const parts: string[] = []
  const regex = /"reasoning_content"\s*:\s*"((?:[^"\\]|\\.)*)"/g
  let match
  while ((match = regex.exec(rawData)) !== null) {
    try {
      parts.push(JSON.parse(`"${match[1]}"`))
    } catch {}
  }
  return parts.join('')
}

export function extractHtmlFromResponse(text: string): string {
  // text 已经是通过 extractContentFromBuffer 清理后的内容
  // 只需处理可能残留的转义字符
  const cleaned = text
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')

  const codeBlockMatch = cleaned.match(/```(?:html)?\s*\n?([\s\S]*?)```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }

  const htmlMatch = cleaned.match(/<!DOCTYPE html[\s\S]*<\/html>/i)
  if (htmlMatch) {
    return htmlMatch[0]
  }

  const htmlTagMatch = cleaned.match(/<html[\s\S]*<\/html>/i)
  if (htmlTagMatch) {
    return htmlTagMatch[0]
  }

  return cleaned.trim()
}

export function generateId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// 验证生成的 HTML 是否是有效的游戏
export function validateGameHtml(html: string): { valid: boolean; reason?: string } {
  if (!html || html.trim().length === 0) {
    return { valid: false, reason: '空内容' }
  }
  if (html.length < 200) {
    return { valid: false, reason: '内容过短，不是有效游戏' }
  }
  if (!html.includes('</html>')) {
    return { valid: false, reason: 'HTML不完整（缺少闭合标签）' }
  }
  if (!html.includes('<script') && !html.includes('onclick')) {
    return { valid: false, reason: '缺少交互逻辑（无script标签）' }
  }
  if (!html.includes('<canvas') && !html.includes('<div') && !html.includes('<button')) {
    return { valid: false, reason: '缺少可见元素' }
  }
  if (html.includes('/* styles */') || html.includes('// game logic') || html.includes('/* game logic */')) {
    return { valid: false, reason: '只是代码模板，不是完整游戏' }
  }
  const hasKeyboard = html.includes('keydown') || html.includes('keyup')
  const hasTouch = html.includes('touchstart') || html.includes('click') || html.includes('pointerdown')
    || html.includes('onclick') || html.includes('ontouchstart')
  if (hasKeyboard && !hasTouch) {
    return { valid: false, reason: '仅支持键盘控制，手机端无法操作' }
  }
  const hasMouse = html.includes('mousedown') || html.includes('pointerdown') || html.includes('onclick')
    || html.includes('click')
  const hasTouchEvent = html.includes('touchstart')
  if (hasTouchEvent && !hasMouse && !html.includes('pointerdown')) {
    return { valid: false, reason: '仅支持触摸，电脑端鼠标无法操作' }
  }
  return { valid: true }
}

export function extractGameTitle(html: string): string {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i)
  if (titleMatch) return titleMatch[1].trim()

  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i)
  if (h1Match) return h1Match[1].replace(/<[^>]+>/g, '').trim()

  const h2Match = html.match(/<h2[^>]*>(.*?)<\/h2>/i)
  if (h2Match) return h2Match[1].replace(/<[^>]+>/g, '').trim()

  return '未命名游戏'
}

export function extractGameDescription(html: string): string {
  const descriptions: string[] = []

  const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
  if (metaMatch) descriptions.push(metaMatch[1])

  const kwMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i)
  if (kwMatch) descriptions.push(kwMatch[1])

  const title = extractGameTitle(html)
  if (title && title !== '未命名游戏') descriptions.push(title)

  const instructionPatterns = [
    /(?:玩法|说明|规则|操作)[：:]\s*([^<]{10,80})/i,
    /<p[^>]*class=["'][^"']*(?:desc|instruction|hint|tip)[^"']*["'][^>]*>([^<]{5,80})<\/p>/i,
    /<div[^>]*class=["'][^"']*(?:desc|instruction|rules)[^"']*["'][^>]*>([\s\S]{10,200}?)<\/div>/i,
  ]
  for (const pattern of instructionPatterns) {
    const match = html.match(pattern)
    if (match) {
      const text = match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      if (text.length > 5) descriptions.push(text)
    }
  }

  if (descriptions.length > 0) return descriptions.slice(0, 3).join('; ')

  if (html.includes('snake') || html.includes('蛇')) return '贪吃蛇类游戏'
  if (html.includes('tetris') || html.includes('方块')) return '方块下落类游戏'
  if (html.includes('mole') || html.includes('地鼠')) return '打地鼠类点击游戏'
  if (html.includes('match') && html.includes('3')) return '三消类游戏'
  if (html.includes('brick') || html.includes('砖块')) return '打砖块类游戏'
  if (html.includes('card') || html.includes('翻牌')) return '记忆翻牌类游戏'
  if (html.includes('shoot') || html.includes('射击')) return '射击类游戏'
  if (html.includes('runner') || html.includes('跑酷')) return '跑酷类游戏'
  if (html.includes('piano') || html.includes('钢琴')) return '音乐节拍类游戏'
  if (html.includes('2048')) return '数字合并类游戏'
  if (html.includes('flappy')) return '飞翔躲避类游戏'
  if (html.includes('fruit') || html.includes('水果')) return '切割类游戏'

  return '未知类型游戏'
}
