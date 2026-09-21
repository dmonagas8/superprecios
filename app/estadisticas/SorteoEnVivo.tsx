'use client'

import { useState } from 'react'
import confetti from 'canvas-confetti'
import { supabase } from '@/lib/supabaseClient'

const SUCURSALES = [
  'Pronto',
  'Sempre',
  'Mercadinho',
  'Tu Super',
  'Super Más',
  'Mercado da Onda',
]

type Participante = { nombre: string; sucursal: string }
type Ganador = { nombre: string; dni: string; telefono: string; sucursal: string }

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function lanzarConfetti() {
  const disparo = (angle: number, originX: number) => {
    confetti({
      particleCount: 70,
      angle,
      spread: 65,
      startVelocity: 55,
      origin: { x: originX, y: 0.6 },
      colors: ['#FF4B12', '#FFD23F', '#FFF6EC', '#4FB0D8'],
    })
  }
  disparo(60, 0.15)
  disparo(120, 0.85)
  setTimeout(() => {
    disparo(90, 0.5)
  }, 250)
}

export default function SorteoEnVivo({ clave, onClose }: { clave: string; onClose: () => void }) {
  const [stage, setStage] = useState<'config' | 'spinning' | 'result'>('config')
  const [sucursalFiltro, setSucursalFiltro] = useState('')
  const [nombreVisible, setNombreVisible] = useState('')
  const [ganador, setGanador] = useState<Ganador | null>(null)
  const [mostrarDatos, setMostrarDatos] = useState(false)
  const [error, setError] = useState('')

  const empezar = async () => {
    setError('')

    const [{ data: lista, error: e1 }, { data: gan, error: e2 }] = await Promise.all([
      supabase.rpc('admin_lista_participantes', {
        p_clave: clave,
        p_sucursal: sucursalFiltro || null,
      }),
      supabase
        .rpc('admin_sortear_ganador', { p_clave: clave, p_sucursal: sucursalFiltro || null })
        .single(),
    ])

    if (e1 || e2 || !gan || !lista || lista.length === 0) {
      setError('No hay participantes para sortear en esa sucursal.')
      return
    }

    const nombres = (lista as Participante[]).map((p) => p.nombre)
    setStage('spinning')

    const pasos = 22
    const secuencia: string[] = []
    for (let i = 0; i < pasos - 1; i++) {
      secuencia.push(nombres[Math.floor(Math.random() * nombres.length)])
    }
    secuencia.push((gan as Ganador).nombre)

    for (let i = 0; i < secuencia.length; i++) {
      const progreso = i / (secuencia.length - 1)
      const delay = 55 + Math.pow(progreso, 3) * 320
      setNombreVisible(secuencia[i])
      await sleep(delay)
    }

    setGanador(gan as Ganador)
    setStage('result')
    lanzarConfetti()
  }

  const reiniciar = () => {
    setStage('config')
    setGanador(null)
    setMostrarDatos(false)
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#FF4B12] to-[#C1272D] px-6 text-center">
      <button
        onClick={onClose}
        className="absolute right-5 top-5 text-2xl text-white/70 hover:text-white"
        aria-label="Cerrar"
      >
        ✕
      </button>

      {stage === 'config' && (
        <div className="w-full max-w-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-white/70">
            Sorteo en vivo
          </p>
          <h2 className="font-display mt-2 text-4xl text-white">¿Quién se lo lleva?</h2>
          <select
            value={sucursalFiltro}
            onChange={(e) => setSucursalFiltro(e.target.value)}
            className="mt-6 w-full rounded-xl border-2 border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white focus:outline-none [&>option]:text-brand-ink"
          >
            <option value="">Todas las sucursales</option>
            {SUCURSALES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {error && <p className="mt-3 text-sm text-white">{error}</p>}
          <button
            onClick={empezar}
            className="mt-5 w-full rounded-full bg-white py-4 text-lg font-bold text-brand-orange shadow-lg transition hover:scale-[1.02]"
          >
            🎬 Empezar sorteo
          </button>
        </div>
      )}

      {stage === 'spinning' && (
        <div className="w-full max-w-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-white/70">
            Sorteando...
          </p>
          <div className="mt-6 flex h-28 items-center justify-center overflow-hidden rounded-3xl bg-white/10 px-4">
            <p className="font-display animate-pulse text-3xl leading-tight text-white">
              {nombreVisible}
            </p>
          </div>
        </div>
      )}

      {stage === 'result' && ganador && (
        <div className="w-full max-w-sm animate-[popIn_0.5s_ease-out]">
          <p className="text-5xl">🏆</p>
          <p className="mt-3 text-sm font-bold uppercase tracking-widest text-white/70">
            Ganador del sorteo
          </p>
          <h2 className="font-display mt-2 text-4xl leading-tight text-white">{ganador.nombre}</h2>
          <p className="mt-2 text-white/80">Sucursal {ganador.sucursal}</p>

          {mostrarDatos ? (
            <p className="mt-3 text-sm text-white/70">
              DNI {ganador.dni} · {ganador.telefono}
            </p>
          ) : (
            <button
              onClick={() => setMostrarDatos(true)}
              className="mt-3 text-sm text-white/60 underline"
            >
              Ver DNI y teléfono (privado, para contactarlo)
            </button>
          )}

          <button
            onClick={reiniciar}
            className="mt-8 w-full rounded-full bg-white py-3.5 font-bold text-brand-orange shadow-lg transition hover:scale-[1.02]"
          >
            🔁 Sortear de nuevo
          </button>
        </div>
      )}
    </div>
  )
}
