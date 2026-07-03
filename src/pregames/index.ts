import type { Game } from '../types'
import whackMole from '../pregames/whack-mole.html?raw'
import snake from '../pregames/snake.html?raw'
import reaction from '../pregames/reaction.html?raw'
import game2048 from '../pregames/2048.html?raw'

let pregameCounter = 0

const PREGAME_META = [
  { html: whackMole, title: '打地鼠' },
  { html: snake, title: '贪吃蛇' },
  { html: reaction, title: '反应速度测试' },
  { html: game2048, title: '2048' },
]

export function getPrebuiltGames(): Game[] {
  return PREGAME_META.map((meta) => ({
    id: `pregame_${pregameCounter++}`,
    title: meta.title,
    html: meta.html,
    status: 'ready' as const,
    generatedAt: Date.now(),
    generationTime: 0,
    tokenCount: 0,
    tokenSpeed: 0,
  }))
}
