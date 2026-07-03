export function extractHtmlFromResponse(text: string): string {
  // Try to extract from markdown code block
  const codeBlockMatch = text.match(/```(?:html)?\s*\n?([\s\S]*?)```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }

  // Try to find HTML directly
  const htmlMatch = text.match(/<!DOCTYPE html[\s\S]*<\/html>/i)
  if (htmlMatch) {
    return htmlMatch[0]
  }

  const htmlTagMatch = text.match(/<html[\s\S]*<\/html>/i)
  if (htmlTagMatch) {
    return htmlTagMatch[0]
  }

  // Return as-is if no patterns match
  return text.trim()
}

export function parseSSEChunk(chunk: string): string {
  const lines = chunk.split('\n')
  let content = ''

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6)
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) {
          content += delta
        }
      } catch {
        // Skip invalid JSON
      }
    }
  }

  return content
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
  // 检测纯键盘控制的游戏（没有触摸/点击事件）
  const hasKeyboard = html.includes('keydown') || html.includes('keyup')
  const hasTouch = html.includes('touchstart') || html.includes('click') || html.includes('pointerdown')
    || html.includes('onclick') || html.includes('ontouchstart')
  if (hasKeyboard && !hasTouch) {
    return { valid: false, reason: '仅支持键盘控制，手机端无法操作' }
  }
  // 检测只有触摸没有鼠标支持的游戏（在iframe中鼠标无法操作）
  const hasMouse = html.includes('mousedown') || html.includes('pointerdown') || html.includes('onclick')
    || html.includes('click')
  const hasTouchEvent = html.includes('touchstart')
  if (hasTouchEvent && !hasMouse && !html.includes('pointerdown')) {
    return { valid: false, reason: '仅支持触摸，电脑端鼠标无法操作' }
  }
  return { valid: true }
}

export function extractGameTitle(html: string): string {
  // 尝试从 HTML 中提取 title
  const titleMatch = html.match(/<title>(.*?)<\/title>/i)
  if (titleMatch) {
    return titleMatch[1].trim()
  }
  
  // 尝试提取 h1
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i)
  if (h1Match) {
    return h1Match[1].replace(/<[^>]+>/g, '').trim()
  }
  
  // 尝试提取 h2
  const h2Match = html.match(/<h2[^>]*>(.*?)<\/h2>/i)
  if (h2Match) {
    return h2Match[1].replace(/<[^>]+>/g, '').trim()
  }
  
  return '未命名游戏'
}

// 从 HTML 中提取游戏玩法描述（用于记忆系统中的多样性控制）
export function extractGameDescription(html: string): string {
  const descriptions: string[] = []
  
  // 提取 <meta name="description">
  const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
  if (metaMatch) descriptions.push(metaMatch[1])
  
  // 提取 <meta name="keywords">
  const kwMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i)
  if (kwMatch) descriptions.push(kwMatch[1])
  
  // 提取标题
  const title = extractGameTitle(html)
  if (title && title !== '未命名游戏') descriptions.push(title)
  
  // 提取开始界面的说明文字（通常在第一个 screen/overlay 中）
  // 查找包含"开始"、"玩法"、"说明"等关键词的段落
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
  
  // 综合描述
  if (descriptions.length > 0) {
    return descriptions.slice(0, 3).join('; ')
  }
  
  // 兜底：从 canvas/draw 代码中推断游戏类型
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
