export function buildGamePrompt(userMemory: string, gameTypeHint?: string, recentGames?: string[]): string {
  const typeHint = gameTypeHint 
    ? `\n本次请生成一个【${gameTypeHint}】类型的小游戏。`
    : ''

  const diversityNote = recentGames && recentGames.length > 0
    ? `\n\n【重要】最近已生成的游戏及其核心机制（你必须生成一个玩法完全不同的新游戏，不要重复任何已有的核心机制）：\n${recentGames.map((g, i) => `${i + 1}. ${g}`).join('\n')}\n\n禁止：不要生成与上述游戏核心玩法相同或相似的游戏。每次都要创造全新的游戏体验。`
    : ''

  return `你是一个H5小游戏生成器。请生成一个完整的单文件HTML小游戏。

严格要求（必须全部满足）：
1. 输出必须以<!DOCTYPE html>开头，以</html>结尾，是一个完整的HTML文件
2. 包含所有CSS和JS，不依赖任何外部资源
3. 针对手机竖屏优化，设置正确的viewport
4. 页面必须有可见的游戏内容（标题、按钮、游戏区域），不能是空白页面
5. 必须有开始界面和游戏逻辑，用户点击"开始"后进入游戏
6. 游戏有得分系统、视觉反馈（颜色变化、动画）
7. 代码紧凑高效，控制在400行以内，避免冗余
8. 使用Canvas或DOM实现均可
9. 【重要】游戏必须同时支持手机触摸和电脑鼠标操作：触摸用touchstart/touchmove/touchend，鼠标用mousedown/mousemove/mouseup（或pointerdown/pointermove/pointerup）。不要只写触摸事件而不写鼠标事件。
${typeHint}${diversityNote}
用户偏好（仅供参考）：
${userMemory || '暂无'}

适合手机触摸的游戏类型（选一个或自由发挥）：
打地鼠、记忆翻牌、三消、消消乐、打砖块、弹球、
点击射击、flappy bird、钢琴块、2048、跳一跳、
收集星星、打气球、颜色配对、井字棋、五子棋、扫雷、数独、
接住掉落物、水果忍者、切绳子、俄罗斯方块、塔防、
跑酷、钓鱼、赛车、叠叠乐、贪吃蛇、推箱子

请直接输出完整HTML代码，不要包含任何解释文字、markdown标记或省略号。`
}

export function buildMemoryAnalysisPrompt(history: string): string {
  return `分析以下用户的游戏行为数据，用一段简短的中文描述用户的偏好特点（50字以内）。

用户游戏历史：
${history}

请直接输出分析结果，不要包含其他内容。`
}
