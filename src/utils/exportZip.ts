import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { Game } from '../types'

function generateIndexHtml(games: Game[]): string {
  const list = games
    .map((game, i) => {
      const title = game.title || `游戏 ${i + 1}`
      return `<li><a href="game_${String(i + 1).padStart(3, '0')}.html">${title}</a></li>`
    })
    .join('\n      ')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>AI游戏合集</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f0f1a;
      color: #e2e8f0;
      padding: 20px;
      min-height: 100vh;
    }
    h1 {
      text-align: center;
      margin-bottom: 24px;
      font-size: 24px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    ul {
      list-style: none;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    }
    a {
      display: block;
      padding: 16px;
      background: #1a1a2e;
      border-radius: 12px;
      color: #e2e8f0;
      text-decoration: none;
      text-align: center;
      transition: transform 0.2s, background 0.2s;
    }
    a:hover {
      transform: scale(1.05);
      background: #252542;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      color: #64748b;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <h1>🎮 AI游戏合集</h1>
  <ul>
    ${list}
  </ul>
  <div class="footer">
    由 AI 实时生成 | Scrolling Games
  </div>
</body>
</html>`
}

export async function exportGamesAsZip(games: Game[]): Promise<void> {
  const zip = new JSZip()

  // Add index
  zip.file('index.html', generateIndexHtml(games))

  // Add each game
  games.forEach((game, i) => {
    const filename = `game_${String(i + 1).padStart(3, '0')}.html`
    zip.file(filename, game.html)
  })

  const content = await zip.generateAsync({ type: 'blob' })
  const timestamp = new Date().toISOString().slice(0, 10)
  saveAs(content, `ai-games-${timestamp}.zip`)
}
