'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import SorteoEnVivo from './SorteoEnVivo'
import Configuracion from './Configuracion'
import { generarTarjetaGanador } from './generarGanador'
import { getTema } from '@/lib/temas'

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

type Historial = {
  id: string
  titulo: string
  premio_monto: string
  premio_texto: string | null
  total_participantes: number
  ganador_nombre: string | null
  ganador_sucursal: string | null
  cerrado_at: string
}

export default function EstadisticasPage() {
  const [clave, setClave] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sorteoEnVivo, setSorteoEnVivo] = useState(false)
  const [ganadores, setGanadores] = useState<Ganador[]>([])
  const [contactoAbierto, setContactoAbierto] = useState<string | null>(null)
  const [tab, setTab] = useState<'stats' | 'config' | 'historial'>('stats')
  const [exportando, setExportando] = useState(false)
  const [premioActual, setPremioActual] = useState({
    tema: 'naranja',
    premio_monto: '$50.000',
    premio_texto: 'en orden de compra',
  })
  const [generandoTarjeta, setGenerandoTarjeta] = useState<string | null>(null)
  const [historial, setHistorial] = useState<Historial[] | null>(null)
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [confirmandoCierre, setConfirmandoCierre] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [ganadorCierre, setGanadorCierre] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    sucursal: '',
  })

  useEffect(() => {
    supabase
      .from('sorteo_config')
      .select('tema, premio_monto, premio_texto')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) setPremioActual(data as typeof premioActual)
      })
  }, [])

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

  const cargarHistorial = async () => {
    setCargandoHistorial(true)
    const { data } = await supabase.rpc('admin_historial_oc', { p_clave: clave })
    setCargandoHistorial(false)
    setHistorial((data as Historial[]) ?? [])
  }

  const irAHistorial = () => {
    setTab('historial')
    cargarHistorial()
  }

  const descargarTarjetaGanador = async (g: Ganador) => {
    const key = g.dni + g.sucursal
    setGenerandoTarjeta(key)
    try {
      const dataUrl = await generarTarjetaGanador({
        nombre: g.nombre,
        sucursal: g.sucursal,
        premio_monto: premioActual.premio_monto,
        premio_texto: premioActual.premio_texto,
        tema: getTema(premioActual.tema),
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `ganador-${g.nombre.replace(/\s+/g, '-').toLowerCase()}.png`
      a.click()
    } finally {
      setGenerandoTarjeta(null)
    }
  }

  const abrirConfirmacionCierre = () => {
    const ultimo = ganadores[ganadores.length - 1]
    setGanadorCierre(
      ultimo
        ? {
            nombre: ultimo.nombre,
            dni: ultimo.dni,
            telefono: ultimo.telefono,
            sucursal: ultimo.sucursal,
          }
        : { nombre: '', dni: '', telefono: '', sucursal: '' },
    )
    setConfirmandoCierre(true)
  }

  const cerrarSorteo = async () => {
    setCerrando(true)
    const { error: rpcError } = await supabase.rpc('admin_cerrar_sorteo_oc', {
      p_clave: clave,
      p_ganador_nombre: ganadorCierre.nombre || null,
      p_ganador_dni: ganadorCierre.dni || null,
      p_ganador_telefono: ganadorCierre.telefono || null,
      p_ganador_sucursal: ganadorCierre.sucursal || null,
    })
    setCerrando(false)

    if (rpcError) {
      setError('No pudimos cerrar el sorteo. Probá de nuevo.')
      return
    }

    setConfirmandoCierre(false)
    setGanadores([])
    cargarStats(clave)
  }

  const exportarCSV = async () => {
    setExportando(true)
    const { data, error: rpcError } = await supabase.rpc('admin_exportar_participantes_oc', {
      p_clave: clave,
    })
    setExportando(false)

    if (rpcError || !data) {
      setError('No pudimos exportar. Probá de nuevo.')
      return
    }

    const filas = data as {
      nombre: string
      dni: string
      telefono: string
      sucursal: string
      created_at: string
    }[]

    const escapar = (v: string) => `"${v.replace(/"/g, '""')}"`
    const encabezado = ['Nombre', 'DNI', 'Teléfono', 'Sucursal', 'Fecha'].join(',')
    const lineas = filas.map((f) =>
      [
        escapar(f.nombre),
        escapar(f.dni),
        escapar(f.telefono),
        escapar(f.sucursal),
        escapar(new Date(f.created_at).toLocaleString('es-AR')),
      ].join(','),
    )
    const csv = '﻿' + [encabezado, ...lineas].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `participantes-sorteo-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
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

          <div className="flex gap-2">
            <button
              onClick={() => setTab('stats')}
              className={`flex-1 rounded-full py-2.5 text-sm font-bold transition ${
                tab === 'stats' ? 'bg-brand-orange text-white' : 'bg-white text-brand-ink/50'
              }`}
            >
              📊 Estadísticas
            </button>
            <button
              onClick={() => setTab('config')}
              className={`flex-1 rounded-full py-2.5 text-sm font-bold transition ${
                tab === 'config' ? 'bg-brand-orange text-white' : 'bg-white text-brand-ink/50'
              }`}
            >
              ⚙️ Configuración
            </button>
            <button
              onClick={irAHistorial}
              className={`flex-1 rounded-full py-2.5 text-sm font-bold transition ${
                tab === 'historial' ? 'bg-brand-orange text-white' : 'bg-white text-brand-ink/50'
              }`}
            >
              🗂️ Historial
            </button>
          </div>

          {tab === 'config' && <Configuracion clave={clave} onClaveCambiada={setClave} />}

          {tab === 'historial' && (
            <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-ink/40">
                Sorteos anteriores
              </p>
              {cargandoHistorial ? (
                <p className="text-sm text-brand-ink/50">Cargando...</p>
              ) : historial && historial.length > 0 ? (
                <div className="space-y-3">
                  {historial.map((h) => (
                    <div key={h.id} className="rounded-2xl bg-brand-cream p-4">
                      <p className="text-sm font-bold text-brand-ink">{h.titulo}</p>
                      <p className="text-xs text-brand-ink/50">
                        {new Date(h.cerrado_at).toLocaleDateString('es-AR')} ·{' '}
                        {h.total_participantes} participantes
                      </p>
                      <p className="mt-1 text-sm text-brand-ink">
                        {h.premio_monto} {h.premio_texto ?? ''}
                      </p>
                      {h.ganador_nombre ? (
                        <p className="mt-1 text-sm font-bold text-brand-orange">
                          🏆 {h.ganador_nombre} — {h.ganador_sucursal}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-brand-ink/40">Sin ganador registrado</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-brand-ink/50">
                  Todavía no cerraste ningún sorteo. Cuando cierres uno desde Estadísticas, va a
                  quedar acá.
                </p>
              )}
            </div>
          )}

          {tab === 'stats' && (
            <>
          {/* Total */}
          <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">
              Total de participantes
            </p>
            <p className="font-display mt-1 text-5xl text-brand-orange">
              {stats?.total_aprobados ?? 0}
            </p>
            <button
              onClick={exportarCSV}
              disabled={exportando || (stats?.total_aprobados ?? 0) === 0}
              className="mt-4 w-full rounded-full border-2 border-brand-orange py-2.5 text-sm font-bold text-brand-orange transition hover:bg-brand-orange hover:text-white disabled:opacity-40"
            >
              {exportando ? 'Exportando...' : '📄 Exportar participantes a CSV'}
            </button>
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
                    <button
                      onClick={() => descargarTarjetaGanador(g)}
                      disabled={generandoTarjeta === g.dni + g.sucursal}
                      className="mt-2 ml-4 text-sm font-bold text-brand-orange underline disabled:opacity-50"
                    >
                      {generandoTarjeta === g.dni + g.sucursal
                        ? 'Generando...'
                        : '📸 Tarjeta para Instagram'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cerrar sorteo */}
          <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-ink/40">
              Cerrar sorteo
            </p>
            <p className="mb-3 text-sm text-brand-ink/60">
              Archiva este sorteo en el historial, vacía la lista de participantes y desactiva el
              sorteo. Usalo cuando ya entregaste el premio y vas a arrancar uno nuevo. Exportá el
              CSV antes si querés guardar el detalle.
            </p>

            {!confirmandoCierre ? (
              <button
                onClick={abrirConfirmacionCierre}
                disabled={(stats?.total_aprobados ?? 0) === 0}
                className="w-full rounded-full border-2 border-brand-orange py-3 font-bold text-brand-orange transition hover:bg-brand-orange hover:text-white disabled:opacity-40"
              >
                🔒 Cerrar sorteo y archivar
              </button>
            ) : (
              <div className="space-y-3 rounded-2xl bg-brand-cream p-4">
                <p className="text-xs font-bold text-brand-ink/60">
                  Datos del ganador (opcional, para el historial)
                </p>
                <input
                  placeholder="Nombre"
                  value={ganadorCierre.nombre}
                  onChange={(e) => setGanadorCierre({ ...ganadorCierre, nombre: e.target.value })}
                  className="w-full rounded-xl border-2 border-black/5 bg-white px-4 py-2.5 text-sm text-brand-ink focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="DNI"
                    value={ganadorCierre.dni}
                    onChange={(e) => setGanadorCierre({ ...ganadorCierre, dni: e.target.value })}
                    className="w-full rounded-xl border-2 border-black/5 bg-white px-4 py-2.5 text-sm text-brand-ink focus:outline-none"
                  />
                  <input
                    placeholder="Teléfono"
                    value={ganadorCierre.telefono}
                    onChange={(e) =>
                      setGanadorCierre({ ...ganadorCierre, telefono: e.target.value })
                    }
                    className="w-full rounded-xl border-2 border-black/5 bg-white px-4 py-2.5 text-sm text-brand-ink focus:outline-none"
                  />
                </div>
                <input
                  placeholder="Sucursal"
                  value={ganadorCierre.sucursal}
                  onChange={(e) =>
                    setGanadorCierre({ ...ganadorCierre, sucursal: e.target.value })
                  }
                  className="w-full rounded-xl border-2 border-black/5 bg-white px-4 py-2.5 text-sm text-brand-ink focus:outline-none"
                />
                <p className="text-xs font-bold text-red-600">
                  Esto borra a los {stats?.total_aprobados ?? 0} participantes actuales. No se
                  puede deshacer.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmandoCierre(false)}
                    className="flex-1 rounded-full bg-white py-2.5 text-sm font-bold text-brand-ink/60"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={cerrarSorteo}
                    disabled={cerrando}
                    className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {cerrando ? 'Cerrando...' : 'Confirmar cierre'}
                  </button>
                </div>
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
            </>
          )}
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
