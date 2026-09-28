import type { Tema } from '@/lib/temas'
import { loadImage, roundRect, wrapText } from './generarQR'

const CREAM = '#FFF6EC'
const INK = '#241708'

export async function generarTarjetaGanador(config: {
  nombre: string
  sucursal: string
  premio_monto: string
  premio_texto: string
  tema: Tema
}): Promise<string> {
  const ORANGE = config.tema.primary
  const ORANGE_DARK = config.tema.primaryDark
  const GOLD = config.tema.gold

  await document.fonts.load('bold 90px Anton')
  await document.fonts.load('bold 150px Anton')

  const W = 1080
  const H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  const logo = await loadImage('/logo.png')

  // fondo degradé
  const gradiente = ctx.createLinearGradient(0, 0, W, H)
  gradiente.addColorStop(0, ORANGE)
  gradiente.addColorStop(1, ORANGE_DARK)
  ctx.fillStyle = gradiente
  ctx.fillRect(0, 0, W, H)

  // circulos decorativos
  ctx.fillStyle = 'rgba(255,255,255,0.10)'
  ctx.beginPath()
  ctx.ellipse(-80, -80, 260, 260, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(0,0,0,0.10)'
  ctx.beginPath()
  ctx.ellipse(W + 40, H + 20, 300, 300, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.textAlign = 'center'

  // logo circular
  const logoSize = 140
  const logoY = 72
  ctx.save()
  ctx.beginPath()
  ctx.arc(W / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(logo, W / 2 - logoSize / 2, logoY, logoSize, logoSize)
  ctx.restore()
  ctx.lineWidth = 6
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.beginPath()
  ctx.arc(W / 2, logoY + logoSize / 2, logoSize / 2 + 10, 0, Math.PI * 2)
  ctx.stroke()

  let y = logoY + logoSize + 70

  // trofeo
  ctx.font = '92px sans-serif'
  ctx.fillText('🏆', W / 2, y)
  y += 70

  // badge GANADOR
  ctx.font = 'bold 30px sans-serif'
  const badgeText = 'TENEMOS GANADOR'
  const badgeW = ctx.measureText(badgeText).width + 3 * badgeText.length + 56
  const badgeH = 62
  ctx.fillStyle = 'white'
  roundRect(ctx, W / 2 - badgeW / 2, y, badgeW, badgeH, badgeH / 2)
  ctx.fill()
  ctx.fillStyle = ORANGE
  ctx.fillText(badgeText, W / 2, y + badgeH / 2 + 10)
  y += badgeH + 56

  // nombre
  ctx.font = 'bold 88px Anton, sans-serif'
  ctx.fillStyle = 'white'
  const nombreLines = wrapText(ctx, config.nombre.toUpperCase(), W - 140)
  for (const line of nombreLines) {
    ctx.fillText(line, W / 2, y)
    y += 92
  }
  y += 14

  // sucursal pill
  ctx.font = 'bold 28px sans-serif'
  const sucText = `Sucursal ${config.sucursal}`
  const sucW = ctx.measureText(sucText).width + 3 * sucText.length + 50
  const sucH = 56
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  roundRect(ctx, W / 2 - sucW / 2, y, sucW, sucH, sucH / 2)
  ctx.fill()
  ctx.fillStyle = 'white'
  ctx.fillText(sucText, W / 2, y + sucH / 2 + 10)
  y += sucH + 64

  // tarjeta premio
  const cardW = 780
  const cardH = 220
  const cardX = W / 2 - cardW / 2
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  roundRect(ctx, cardX, y, cardW, cardH, 32)
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = GOLD
  roundRect(ctx, cardX, y, cardW, cardH, 32)
  ctx.stroke()

  ctx.font = 'bold 96px Anton, sans-serif'
  ctx.fillStyle = GOLD
  ctx.fillText(config.premio_monto, W / 2, y + 108)

  ctx.font = 'bold 32px sans-serif'
  ctx.fillStyle = 'white'
  ctx.fillText(config.premio_texto, W / 2, y + 165)

  // footer
  ctx.font = 'bold 26px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText('SUPERPRECIOS  ·  @superprecioslaplata', W / 2, H - 56)

  return canvas.toDataURL('image/png')
}
