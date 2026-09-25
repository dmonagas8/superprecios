'use client'

import { useState } from 'react'
import confetti from 'canvas-confetti'
import { supabase } from '@/lib/supabaseClient'
import { tick, fanfare } from './sonido'

type Participante = { nombre: string; sucursal: string }
type Ganador = { nombre: string; dni: string; telefono: string; sucursal: string; monto: number }

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function lanzarConfetti() {
  const disparo = (angle: number, originX: number, particleCount = 90) => {
    confetti({
      particleCount,
      angle,
      spread: 70,
      startVelocity: 58,
      gravity: 0.9,
      ticks: 220,
      origin: { x: originX, y: 0.6 },
      colors: ['#FF4B12', '#FFD23F', '#FFF6EC', '#4FB0D8', '#2D5F3E'],
    })
  }
  disparo(60, 0.1)
  disparo(120, 0.9)
  disparo(90, 0.5, 60)
  setTimeout(() => {
    disparo(70, 0.2, 50)
    disparo(110, 0.8, 50)
  }, 300)
  setTimeout(() => disparo(90, 0.5, 70), 650)
}

export default function SorteoEnVivo({
  clave,
  onClose,
  onGanador,
}: {
  clave: string
  onClose: () => void
  onGanador: (g: Ganador) => void
}) {
  const [stage, setStage] = useState<'config' | 'spinning' | 'result'>('config')
  const [nombreVisible, setNombreVisible] = useState('')
  const [sucursalVisible, setSucursalVisible] = useState('')
  const [stepKey, setStepKey] = useState(0)
  const [climax, setClimax] = useState(false)
  const [ganador, setGanador] = useState<Ganador | null>(null)
  const [mostrarFlash, setMostrarFlash] = useState(false)
  const [error, setError] = useState('')

  const empezar = async () => {
    setError('')

    const [{ data: lista, error: e1 }, { data: gan, error: e2 }] = await Promise.all([
      supabase.rpc('admin_lista_participantes_oc', { p_clave: clave }),
      supabase.rpc('admin_sortear_ganador_oc', { p_clave: clave }).single(),
    ])

    if (e1 || e2 || !gan || !lista || lista.length === 0) {
      setError('Todavía no hay participantes para sortear.')
      return
    }

    const pool = lista as Participante[]
    setStage('spinning')
    setClimax(false)

    const pasos = 24
    const secuencia: Participante[] = []
    for (let i = 0; i < pasos - 1; i++) {
      secuencia.push(pool[Math.floor(Math.random() * pool.length)])
    }
    secuencia.push(gan as Ganador)

    for (let i = 0; i < secuencia.length; i++) {
      const progreso = i / (secuencia.length - 1)
      const delay = 60 + Math.pow(progreso, 3) * 340
      setNombreVisible(secuencia[i].nombre)
      setSucursalVisible(secuencia[i].sucursal)
      setStepKey((k) => k + 1)
      tick(700 + progreso * 500)
      if (progreso > 0.75) setClimax(true)
      await sleep(delay)
    }

    setMostrarFlash(true)
    setGanador(gan as Ganador)
    setStage('result')
    lanzarConfetti()
    fanfare()
    onGanador(gan as Ganador)
    setTimeout(() => setMostrarFlash(false), 400)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#FF4B12] to-[#C1272D] px-6 text-center">
      {/* brillo de fondo mientras gira */}
      {stage === 'spinning' && (
        <>
          <div
            className="pointer-events-none absolute h-72 w-72 rounded-full bg-white/30 blur-3xl"
            style={{ animation: 'glowPulse 1.1s ease-in-out infinite' }}
          />
          <div
            className="pointer-events-none absolute h-96 w-96 rounded-full border-2 border-dashed border-white/20"
            style={{ animation: 'ringSpin 6s linear infinite' }}
          />
        </>
      )}

      {mostrarFlash && (
        <div
          className="pointer-events-none absolute inset-0 bg-white"
          style={{ animation: 'flashPulse 0.4s ease-out' }}
        />
      )}

      <button
        onClick={onClose}
        className="absolute right-5 top-5 z-10 text-2xl text-white/70 hover:text-white"
        aria-label="Cerrar"
      >
        ✕
      </button>

      {/* marca visible durante todo el sorteo, por si el clip se recorta o resube sin contexto */}
      <img
        src="/logo.png"
        alt="Superprecios"
        className="absolute top-5 left-1/2 z-10 h-12 w-12 -translate-x-1/2 rounded-full ring-2 ring-white/30"
      />

      {stage === 'spinning' && (
        <span className="absolute bottom-5 right-5 z-10 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white/70">
          🎫 Orden de compra $50.000
        </span>
      )}

      {stage === 'config' && (
        <div className="w-full max-w-sm pt-12">
          <p className="text-sm font-bold uppercase tracking-widest text-white/70">
            Sorteo en vivo
          </p>
          <div className="mt-4 rounded-3xl border-2 border-white/20 bg-white/10 py-6 shadow-lg">
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">Premio</p>
            <p className="font-display mt-1 text-5xl text-white">$50.000</p>
            <p className="mt-1 text-xs text-white/70">en orden de compra</p>
          </div>
          <h2 className="font-display mt-4 text-4xl text-white">¿Quién se lo lleva?</h2>
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
        <div className="relative flex h-32 w-full max-w-sm flex-col items-center justify-center px-4">
          <p className="absolute -top-10 text-sm font-bold uppercase tracking-widest text-white/70">
            Sorteando...
          </p>
          <div
            key={stepKey}
            className="transition-transform duration-200"
            style={{
              animation: 'slotFlip 0.18s ease-out',
              transform: climax ? 'scale(1.12)' : 'scale(1)',
            }}
          >
            <p
              className="font-display text-4xl leading-tight text-white transition-[text-shadow] duration-200"
              style={{
                textShadow: climax
                  ? '0 0 28px rgba(255,210,63,0.95), 0 0 55px rgba(255,210,63,0.6)'
                  : '0 0 0 rgba(255,210,63,0)',
              }}
            >
              {nombreVisible}
            </p>
            <p
              className={`mt-1 text-center text-xs font-bold uppercase tracking-widest transition-colors duration-200 ${
                climax ? 'text-[#FFD23F]' : 'text-white/60'
              }`}
            >
              {sucursalVisible}
            </p>
          </div>
        </div>
      )}

      {stage === 'result' && ganador && (
        <div className="w-full max-w-sm animate-[popIn_0.55s_ease-out]">
          <p className="text-6xl">🏆</p>
          <p className="mt-3 text-sm font-bold uppercase tracking-widest text-white/70">
            Ganador del sorteo
          </p>
          <h2 className="font-display mt-2 text-5xl leading-tight text-white">{ganador.nombre}</h2>
          <span className="mt-3 inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-white">
            📍 {ganador.sucursal}
          </span>
          <div className="mx-auto mt-5 rounded-3xl border-2 border-[#FFD23F]/40 bg-white/10 py-5">
            <p className="font-display text-4xl text-[#FFD23F]">$50.000</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/70">
              en orden de compra
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
