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

const TICKETS_URL = 'https://qichpcaconpxfgwpfyzl.supabase.co/storage/v1/object/public/tickets/'

type Stats = {
  total_aprobados: number
  total_pendientes: number
  por_sucursal: Record<string, number>
  ultimos: { nombre: string; sucursal: string; monto: number; created_at: string }[]
}

type Pendiente = {
  id: string
  nombre: string
  dni: string
  telefono: string
  sucursal: string
  monto: number
  ticket_path: string
  created_at: string
}

type Ganador = { nombre: string; dni: string; telefono: string; sucursal: string; monto: number }

export default function EstadisticasPage() {
  const [clave, setClave] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [pendientes, setPendientes] = useState<Pendiente[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [revisando, setRevisando] = useState<string | null>(null)
  const [sorteoEnVivo, setSorteoEnVivo] = useState(false)
  const [ganadores, setGanadores] = useState<Ganador[]>([])
  const [contactoAbierto, setContactoAbierto] = useState<string | null>(null)

  const cargarTodo = async (claveInput: string) => {
    setLoading(true)
    setError('')
    const [{ data: statsData, error: e1 }, { data: pendData, error: e2 }] = await Promise.all([
      supabase.rpc('admin_stats_oc', { p_clave: claveInput }).single(),
      supabase.rpc('admin_listar_pendientes_oc', { p_clave: claveInput }),
    ])

    setLoading(false)

    if (e1 || e2 || !statsData) {
      setError('Clave incorrecta.')
      return
    }

    setAutenticado(true)
    setStats(statsData as Stats)
    setPendientes((pendData as Pendiente[]) ?? [])
  }

  const handleEntrar = (e: React.FormEvent) => {
    e.preventDefault()
    cargarTodo(clave)
  }

  const revisar = async (id: string, aprobar: boolean) => {
    setRevisando(id)
    await supabase.rpc('admin_revisar_oc', { p_clave: clave, p_id: id, p_aprobar: aprobar })
    setRevisando(null)
    cargarTodo(clave)
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

          {/* Totales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">
                Aprobados
              </p>
              <p className="font-display mt-1 text-4xl text-brand-orange">
                {stats?.total_aprobados ?? 0}
              </p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">
                Por revisar
              </p>
              <p className="font-display mt-1 text-4xl text-brand-ink">
                {stats?.total_pendientes ?? 0}
              </p>
            </div>
          </div>

          {/* Cola de revisión */}
          <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-ink/40">
              Tickets por revisar ({pendientes.length})
            </p>
            {pendientes.length === 0 ? (
              <p className="text-sm text-brand-ink/50">No hay tickets pendientes.</p>
            ) : (
              <div className="space-y-4">
                {pendientes.map((p) => (
                  <div key={p.id} className="overflow-hidden rounded-2xl border border-black/5">
                    <a href={TICKETS_URL + p.ticket_path} target="_blank" rel="noreferrer">
                      <img
                        src={TICKETS_URL + p.ticket_path}
                        alt={`Ticket de ${p.nombre}`}
                        className="max-h-80 w-full object-contain bg-black/5"
                      />
                    </a>
                    <div className="p-4">
                      <p className="text-sm font-bold text-brand-ink">{p.nombre}</p>
                      <p className="text-xs text-brand-ink/50">
                        DNI {p.dni} · {p.telefono} · {p.sucursal}
                      </p>
                      <p className="mt-1 text-sm font-bold text-brand-orange">
                        ${p.monto.toLocaleString('es-AR')}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => revisar(p.id, true)}
                          disabled={revisando === p.id}
                          className="flex-1 rounded-full bg-brand-orange py-2 text-sm font-bold text-white transition hover:bg-[#e8410c] disabled:opacity-60"
                        >
                          ✓ Aprobar
                        </button>
                        <button
                          onClick={() => revisar(p.id, false)}
                          disabled={revisando === p.id}
                          className="flex-1 rounded-full border-2 border-black/10 py-2 text-sm font-bold text-brand-ink/60 transition hover:bg-black/5 disabled:opacity-60"
                        >
                          ✕ Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Por sucursal */}
          <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-ink/40">
              Aprobados por sucursal
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
              Un ganador por sucursal. Abrí el sorteo en vivo y elegí la sucursal antes de
              arrancar.
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

          {/* Últimos aprobados */}
          <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-ink/40">
              Últimos aprobados
            </p>
            {stats?.ultimos?.length ? (
              <div className="space-y-2">
                {stats.ultimos.map((u, i) => (
                  <div
                    key={i}
                    className="flex justify-between border-b border-black/5 pb-2 text-sm last:border-0"
                  >
                    <span className="text-brand-ink">{u.nombre}</span>
                    <span className="text-brand-ink/50">
                      {u.sucursal} · ${u.monto.toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-brand-ink/50">Todavía no hay aprobados.</p>
            )}
          </div>
        </div>
      </main>
      {sorteoEnVivo && (
        <SorteoEnVivo
          clave={clave}
          onClose={() => {
            setSorteoEnVivo(false)
            cargarTodo(clave)
          }}
          onGanador={(g) => setGanadores((prev) => [...prev, g])}
        />
      )}
    </>
  )
}
