'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const SUCURSALES = [
  'Pronto',
  'Sempre',
  'Mercadinho',
  'Tu Super',
  'Super Más',
  'Mercado da Onda',
]

type Stats = {
  total: number
  por_sucursal: Record<string, number>
  por_dia: Record<string, number>
  ultimos: { nombre: string; sucursal: string; created_at: string }[]
}

type Ganador = {
  nombre: string
  dni: string
  telefono: string
  sucursal: string
}

export default function EstadisticasPage() {
  const [clave, setClave] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [sucursalSorteo, setSucursalSorteo] = useState('')
  const [ganador, setGanador] = useState<Ganador | null>(null)
  const [sorteando, setSorteando] = useState(false)

  const cargarStats = async (claveInput: string) => {
    setLoading(true)
    setError('')
    const { data, error: rpcError } = await supabase
      .rpc('admin_sorteo_stats', { p_clave: claveInput })
      .single()

    setLoading(false)

    if (rpcError || !data) {
      setError('Clave incorrecta.')
      return
    }

    setAutenticado(true)
    setStats(data as Stats)
  }

  const handleEntrar = (e: React.FormEvent) => {
    e.preventDefault()
    cargarStats(clave)
  }

  const handleSortear = async () => {
    setSorteando(true)
    setGanador(null)
    const { data, error: rpcError } = await supabase
      .rpc('admin_sortear_ganador', {
        p_clave: clave,
        p_sucursal: sucursalSorteo || null,
      })
      .single()
    setSorteando(false)

    if (rpcError || !data) {
      setError('No se pudo sortear (¿hay participantes en esa sucursal?)')
      return
    }
    setGanador(data as Ganador)
  }

  if (!autenticado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-cream px-5">
        <form
          onSubmit={handleEntrar}
          className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]"
        >
          <h1 className="font-display text-2xl text-brand-ink">Estadísticas del sorteo</h1>
          <p className="mt-2 text-sm text-brand-ink/60">Ingresá la clave para ver los datos.</p>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="Clave"
            className="mt-4 w-full rounded-xl border-2 border-black/5 bg-brand-cream px-4 py-3 text-sm focus:border-brand-orange focus:outline-none"
          />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-full bg-brand-orange py-3 font-bold text-white transition hover:bg-[#e8410c] disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-brand-cream px-5 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="font-display text-3xl text-brand-ink">Estadísticas del sorteo</h1>

        {/* Total */}
        <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">
            Total de participantes
          </p>
          <p className="font-display mt-1 text-5xl text-brand-orange">{stats?.total ?? 0}</p>
        </div>

        {/* Por sucursal */}
        <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-ink/40">
            Por sucursal
          </p>
          <div className="space-y-2">
            {SUCURSALES.map((s) => {
              const count = stats?.por_sucursal?.[s] ?? 0
              const max = Math.max(1, ...Object.values(stats?.por_sucursal ?? {}))
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-sm text-brand-ink">{s}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-brand-cream">
                    <div
                      className="h-full rounded-full bg-brand-orange"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-bold text-brand-ink">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sortear ganador */}
        <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-ink/40">
            Sortear ganador
          </p>
          <select
            value={sucursalSorteo}
            onChange={(e) => setSucursalSorteo(e.target.value)}
            className="w-full rounded-xl border-2 border-black/5 bg-brand-cream px-4 py-3 text-sm focus:border-brand-orange focus:outline-none"
          >
            <option value="">Todas las sucursales</option>
            {SUCURSALES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={handleSortear}
            disabled={sorteando || (stats?.total ?? 0) === 0}
            className="mt-3 w-full rounded-full bg-brand-orange py-3 font-bold text-white transition hover:bg-[#e8410c] disabled:opacity-60"
          >
            {sorteando ? 'Sorteando...' : '🎉 Sortear ganador'}
          </button>

          {ganador && (
            <div className="mt-4 rounded-2xl bg-brand-cream p-4 text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-orange">
                Ganador
              </p>
              <p className="mt-1 text-lg font-bold text-brand-ink">{ganador.nombre}</p>
              <p className="text-sm text-brand-ink/60">DNI {ganador.dni} · {ganador.telefono}</p>
              <p className="text-sm text-brand-ink/60">Sucursal: {ganador.sucursal}</p>
            </div>
          )}
        </div>

        {/* Últimos participantes */}
        <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-ink/40">
            Últimos en participar
          </p>
          {stats?.ultimos?.length ? (
            <div className="space-y-2">
              {stats.ultimos.map((u, i) => (
                <div key={i} className="flex justify-between border-b border-black/5 pb-2 text-sm last:border-0">
                  <span className="text-brand-ink">{u.nombre}</span>
                  <span className="text-brand-ink/50">{u.sucursal}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-ink/50">Todavía no hay participantes.</p>
          )}
        </div>
      </div>
    </main>
  )
}
