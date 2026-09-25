'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import SorteoEnVivo from './SorteoEnVivo'

const SUCURSALES = [
  'Pronto',
  'Sempre',
  'Mercadinho',
  'Tu Super',
  'Super Más',
  'Mercado da Onda',
]

type Stats = {
  total_aprobados: number
  total_pendientes: number
  por_sucursal: Record<string, number>
  ultimos: { nombre: string; sucursal: string; monto: number | null; created_at: string }[]
}

type Ganador = { nombre: string; dni: string; telefono: string; sucursal: string; monto: number }

export default function EstadisticasPage() {
  const [clave, setClave] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sorteoEnVivo, setSorteoEnVivo] = useState(false)
  const [ganadores, setGanadores] = useState<Ganador[]>([])
  const [contactoAbierto, setContactoAbierto] = useState<string | null>(null)

  const cargarStats = async (claveInput: string) => {
    setLoading(true)
    setError('')
    const { data, error: rpcError } = await supabase
      .rpc('admin_stats_oc', { p_clave: claveInput })
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

  if (!autenticado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-cream px-5">
        <form
          onSubmit={handleEntrar}
          className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]"
        >
          <h1 className="font-display text-2xl text-brand-ink">Orden de compra $50.000</h1>
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
    <>
      <main className="min-h-screen bg-brand-cream px-5 py-10">
        <div className="mx-auto max-w-2xl space-y-6">
          <h1 className="font-display text-3xl text-brand-ink">Orden de compra $50.000</h1>

          {/* Total */}
          <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">
              Total de participantes
            </p>
            <p className="font-display mt-1 text-5xl text-brand-orange">
              {stats?.total_aprobados ?? 0}
            </p>
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
            <p className="mb-3 text-sm text-brand-ink/60">
              Un solo ganador entre todas las sucursales. Abrí el sorteo en vivo cuando estés
              listo.
            </p>
            <button
              onClick={() => setSorteoEnVivo(true)}
              disabled={(stats?.total_aprobados ?? 0) === 0}
              className="w-full rounded-full bg-brand-orange py-3 font-bold text-white transition hover:bg-[#e8410c] disabled:opacity-60"
            >
              🎥 Sorteo en vivo
            </button>
          </div>

          {/* Ganadores */}
          {ganadores.length > 0 && (
            <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-ink/40">
                🏆 Ganadores sorteados
              </p>
              <div className="space-y-3">
                {ganadores.map((g, i) => (
                  <div key={i} className="rounded-2xl bg-brand-cream p-4">
                    <p className="text-sm font-bold text-brand-ink">{g.nombre}</p>
                    <p className="text-xs text-brand-ink/50">Sucursal {g.sucursal}</p>
                    {contactoAbierto === g.dni + g.sucursal ? (
                      <div className="mt-2">
                        <p className="text-sm text-brand-ink">
                          DNI {g.dni} · {g.telefono}
                        </p>
                        <a
                          href={`tel:${g.telefono}`}
                          className="mt-1 inline-block text-sm font-bold text-brand-orange underline"
                        >
                          📞 Llamar ahora
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={() => setContactoAbierto(g.dni + g.sucursal)}
                        className="mt-2 text-sm font-bold text-brand-orange underline"
                      >
                        Contactar ganador
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Últimos participantes */}
          <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-ink/40">
              Últimos en participar
            </p>
            {stats?.ultimos?.length ? (
              <div className="space-y-2">
                {stats.ultimos.map((u, i) => (
                  <div
                    key={i}
                    className="flex justify-between border-b border-black/5 pb-2 text-sm last:border-0"
                  >
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
      {sorteoEnVivo && (
        <SorteoEnVivo
          clave={clave}
          onClose={() => {
            setSorteoEnVivo(false)
            cargarStats(clave)
          }}
          onGanador={(g) => setGanadores((prev) => [...prev, g])}
        />
      )}
    </>
  )
}
