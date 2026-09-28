import QRCode from 'qrcode'

const URL_SORTEO = 'https://sorteo-superprecios.vercel.app'
const ORANGE = '#FF4B12'
const CREAM = '#FFF6EC'
const INK = '#241708'
const GOLD = '#FFD23F'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let actual = ''
  for (const word of words) {
    const test = actual ? `${actual} ${word}` : word
    if (ctx.measureText(test).width <= maxWidth) {
      actual = test
    } else {
      if (actual) lines.push(actual)
      actual = word
    }
  }
  if (actual) lines.push(actual)
  return lines
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function generarTarjetaQR(config: {
  titulo: string
  premio_monto: string
  premio_nota: string
}): Promise<string> {
  await document.fonts.load('bold 80px Anton')
  await document.fonts.load('bold 130px Anton')

  const W = 1240
  const H = 1810
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = CREAM
  ctx.fillRect(0, 0, W, H)

  const [logo, qrDataUrl] = await Promise.all([
    loadImage('/logo.png'),
    QRCode.toDataURL(URL_SORTEO, {
      errorCorrectionLevel: 'H',
      margin: 0,
      width: 640,
      color: { dark: INK, light: '#FFFFFF' },
    }),
  ])
  const qrImg = await loadImage(qrDataUrl)

  ctx.textAlign = 'center'

  // --- medir el bloque de texto primero, sin dibujar, para saber dónde va el QR ---
  ctx.font = 'bold 78px Anton, sans-serif'
  const tituloLines = wrapText(ctx, config.titulo.toUpperCase(), W - 160)

  let y = 55 + 182 + 24 // logo + badge
  y += 58 + 34 // badge
  y += tituloLines.length * 84
  y += 128 // monto
  y += 48 // nota
  const topH = y + 40
  const qrY = topH - 40

  // --- fondo naranja ---
  ctx.fillStyle = ORANGE
  ctx.fillRect(0, 0, W, topH)

  // circulos decorativos
  ctx.fillStyle = 'rgba(255,255,255,0.11)'
  ctx.beginPath()
  ctx.ellipse(-70, -70, 220, 220, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(0,0,0,0.11)'
  ctx.beginPath()
  ctx.ellipse(W + 30, topH - 20, 250, 250, 0, 0, Math.PI * 2)
  ctx.fill()

  // logo circular
  const logoSize = 160
  const logoY = 66
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
  ctx.arc(W / 2, logoY + logoSize / 2, logoSize / 2 + 11, 0, Math.PI * 2)
  ctx.stroke()

  y = 55 + 182 + 24

  // badge
  ctx.font = 'bold 26px sans-serif'
  const badgeText = 'SORTEO ACTIVO'
  const badgeW = ctx.measureText(badgeText).width + 3 * badgeText.length + 50
  const badgeH = 58
  ctx.fillStyle = 'white'
  roundRect(ctx, W / 2 - badgeW / 2, y, badgeW, badgeH, badgeH / 2)
  ctx.fill()
  ctx.fillStyle = ORANGE
  ctx.fillText(badgeText, W / 2, y + badgeH / 2 + 9)
  y += badgeH + 34

  // titulo
  ctx.font = 'bold 78px Anton, sans-serif'
  ctx.fillStyle = 'white'
  for (const line of tituloLines) {
    ctx.fillText(line, W / 2, y)
    y += 84
  }

  // monto
  ctx.font = 'bold 128px Anton, sans-serif'
  ctx.fillStyle = GOLD
  ctx.fillText(config.premio_monto, W / 2, y)
  y += 128

  // nota
  ctx.font = '30px sans-serif'
  ctx.fillStyle = '#FFE4D6'
  ctx.fillText(config.premio_nota, W / 2, y)
  y += 48

  // --- tarjeta blanca con QR ---
  const qrSize = 620
  const pad = 38
  const cardSize = qrSize + pad * 2
  const cardX = W / 2 - cardSize / 2

  ctx.fillStyle = 'rgba(255,75,18,0.25)'
  roundRect(ctx, cardX, qrY + 14, cardSize, cardSize, 44)
  ctx.fill()

  ctx.fillStyle = 'white'
  roundRect(ctx, cardX, qrY, cardSize, cardSize, 44)
  ctx.fill()

  ctx.drawImage(qrImg, cardX + pad, qrY + pad, qrSize, qrSize)

  // marca del logo en el centro del QR
  const markD = 100
  const markX = W / 2 - markD / 2
  const markY = qrY + cardSize / 2 - markD / 2
  ctx.fillStyle = 'white'
  roundRect(ctx, markX, markY, markD, markD, 24)
  ctx.fill()
  ctx.save()
  ctx.beginPath()
  ctx.arc(W / 2, markY + markD / 2, (markD - 16) / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(logo, markX + 8, markY + 8, markD - 16, markD - 16)
  ctx.restore()

  y = qrY + cardSize + 50

  ctx.font = 'bold 40px sans-serif'
  ctx.fillStyle = INK
  ctx.fillText('Escaneá y participá', W / 2, y)
  y += 58

  ctx.font = '27px sans-serif'
  ctx.fillStyle = '#8A7A68'
  ctx.fillText('Cargá tus datos y quedás participando', W / 2, y)

  ctx.font = 'bold 25px sans-serif'
  ctx.fillStyle = ORANGE
  ctx.fillText('SUPERPRECIOS  ·  @superprecioslaplata', W / 2, H - 60)

  return canvas.toDataURL('image/png')
}
