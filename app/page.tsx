'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getTema } from '@/lib/temas'

const SUCURSALES = [
  { name: 'Pronto', bg: '#C1272D', text: '#FFFFFF' },
  { name: 'Sempre', bg: '#F2994A', text: '#FFFFFF' },
  { name: 'Mercadinho', bg: '#2D5F3E', text: '#FFFFFF' },
  { name: 'Tu Super', bg: '#FFD23F', text: '#7A1F1F' },
  { name: 'Super Más', bg: '#4FB0D8', text: '#FFFFFF' },
  { name: 'Mercado da Onda', bg: '#4A2E83', text: '#FFC629' },
]

const PREMIOS_URL = 'https://qichpcaconpxfgwpfyzl.supabase.co/storage/v1/object/public/premios/'

type Config = {
  titulo: string
  subtitulo: string
  premio_badge: string
  premio_monto: string
  premio_texto: string
  premio_nota: string
  imagen_premio_path: string | null
  sorteo_activo: boolean
  tema: string
  link_destino: string
  footer_texto: string
  cta_hero_texto: string
  boton_texto: string
  mensaje_inactivo_titulo: string
  mensaje_inactivo_texto: string
  mensaje_inactivo_boton: string
}

const CONFIG_DEFAULT: Config = {
  titulo: 'Ganate una orden de compra de $50.000',
  subtitulo: 'Cargá tus datos y quedás participando.',
  premio_badge: '🎫 El premio',
  premio_monto: '$50.000',
  premio_texto: 'en orden de compra',
  premio_nota: 'Un ganador entre todas las sucursales',
  imagen_premio_path: null,
  sorteo_activo: true,
  tema: 'naranja',
  link_destino: 'https://www.instagram.com/superprecioslaplata/',
  footer_texto: '@superprecioslaplata',
  cta_hero_texto: 'Quiero participar',
  boton_texto: 'Confirmar participación',
  mensaje_inactivo_titulo: 'Por ahora no hay sorteo activo',
  mensaje_inactivo_texto: 'Seguinos para enterarte del próximo.',
  mensaje_inactivo_boton: '@superprecioslaplata',
}

export default function SorteoPage() {
  const [config, setConfig] = useState<Config>(CONFIG_DEFAULT)
  const [form, setForm] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    sucursal: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('sorteo_config')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) setConfig(data as Config)
      })
  }, [])

  const tema = getTema(config.tema)
  const temaVars = {
    '--tema-primary': tema.primary,
    '--tema-primary-dark': tema.primaryDark,
  } as React.CSSProperties

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.nombre || !form.dni || !form.telefono || !form.sucursal) {
      setError('Completá todos los campos para participar.')
      return
    }

    setLoading(true)
    const { error: rpcError } = await supabase.rpc('enviar_participacion_orden_compra', {
      p_nombre: form.nombre,
      p_dni: form.dni,
      p_telefono: form.telefono,
      p_sucursal: form.sucursal,
    })
    setLoading(false)

    if (rpcError) {
      if (rpcError.code === '23505') {
        setError('Ya participaste con ese DNI en esa sucursal.')
      } else {
        setError('Hubo un error al registrar tu participación. Probá de nuevo.')
      }
      return
    }

    window.location.href = config.link_destino
  }

  if (!config.sorteo_activo) {
    return (
      <main
        style={temaVars}
        className="flex min-h-screen items-center justify-center bg-brand-cream px-5 text-center"
      >
        <div className="max-w-sm">
          <img
            src="/logo.png"
            alt="Superprecios"
            className="mx-auto h-16 w-16 rounded-full ring-4 ring-[var(--tema-primary)]/25"
          />
          <h1 className="font-display mt-4 text-3xl text-brand-ink">
            {config.mensaje_inactivo_titulo}
          </h1>
          <p className="mt-2 text-sm text-brand-ink/60">{config.mensaje_inactivo_texto}</p>
          <a
            href={config.link_destino}
            className="mt-6 inline-block rounded-full bg-[var(--tema-primary)] px-8 py-3.5 text-sm font-bold text-white shadow-lg"
          >
            {config.mensaje_inactivo_boton}
          </a>
        </div>
      </main>
    )
  }

  return (
    <main style={temaVars} className="min-h-screen bg-brand-cream">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--tema-primary)] to-[var(--tema-primary-dark)] px-5 pb-20 pt-12 text-center">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-12 h-72 w-72 rounded-full bg-black/10 blur-3xl" />

        <div className="relative mx-auto max-w-md">
          <img
            src="/logo.png"
            alt="Superprecios"
            className="mx-auto h-16 w-16 rounded-full ring-4 ring-white/25 drop-shadow-lg"
          />
          <span className="mt-5 inline-block rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
            🎉 Sorteo activo
          </span>
          <h1 className="font-display mt-4 text-5xl leading-[0.95] text-white">{config.titulo}</h1>
          <p className="mt-4 px-4 text-sm text-white/80">{config.subtitulo}</p>
          <a
            href="#form"
            className="mt-7 inline-block rounded-full bg-white px-8 py-3.5 text-base font-bold text-[var(--tema-primary)] shadow-lg transition hover:scale-[1.03]"
          >
            {config.cta_hero_texto}
          </a>
        </div>
      </section>

      {/* Prize card */}
      <div className="relative z-10 mx-auto -mt-10 max-w-md px-5">
        {config.imagen_premio_path ? (
          <div className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_45px_-15px_rgba(0,0,0,0.2)]">
            <div className="relative">
              <img
                src={PREMIOS_URL + config.imagen_premio_path}
                alt="El premio del sorteo"
                className="aspect-[10/9] w-full object-cover"
              />
              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--tema-primary)] shadow-sm">
                {config.premio_badge}
              </span>
            </div>
            <div className="p-4 text-center">
              <p className="font-display text-3xl text-brand-ink">{config.premio_monto}</p>
              <p className="mt-1 text-sm font-bold text-brand-ink/70">{config.premio_texto}</p>
              <p className="mt-2 text-xs text-brand-ink/50">{config.premio_nota}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white p-6 text-center shadow-[0_20px_45px_-15px_rgba(0,0,0,0.2)]">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--tema-primary)]">
              {config.premio_badge}
            </p>
            <p className="font-display mt-1 text-5xl text-brand-ink">{config.premio_monto}</p>
            <p className="mt-1 text-sm font-bold text-brand-ink/70">{config.premio_texto}</p>
            <p className="mt-3 text-xs text-brand-ink/50">{config.premio_nota}</p>
          </div>
        )}
      </div>

      {/* Form card */}
      <div id="form" className="mx-auto mb-12 mt-8 max-w-md scroll-mt-6 px-5">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.2)]"
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-ink/40">
            Tus datos
          </p>
          <div className="space-y-3">
            <input
              name="nombre"
              placeholder="Nombre y apellido"
              value={form.nombre}
              onChange={handleChange}
              className="w-full rounded-xl border-2 border-black/5 bg-brand-cream px-4 py-3 text-sm text-brand-ink placeholder:text-brand-ink/40 transition focus:border-[var(--tema-primary)] focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                name="dni"
                placeholder="DNI"
                inputMode="numeric"
                value={form.dni}
                onChange={handleChange}
                className="w-full rounded-xl border-2 border-black/5 bg-brand-cream px-4 py-3 text-sm text-brand-ink placeholder:text-brand-ink/40 transition focus:border-[var(--tema-primary)] focus:outline-none"
              />
              <input
                name="telefono"
                placeholder="Teléfono"
                inputMode="tel"
                value={form.telefono}
                onChange={handleChange}
                className="w-full rounded-xl border-2 border-black/5 bg-brand-cream px-4 py-3 text-sm text-brand-ink placeholder:text-brand-ink/40 transition focus:border-[var(--tema-primary)] focus:outline-none"
              />
            </div>
          </div>

          <p className="mb-2 mt-6 text-sm font-bold text-brand-ink">¿En qué sucursal participás?</p>
          <div className="grid grid-cols-2 gap-2">
            {SUCURSALES.map((s) => {
              const selected = form.sucursal === s.name
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setForm({ ...form, sucursal: s.name })}
                  style={{ backgroundColor: s.bg, color: s.text }}
                  className={`relative rounded-xl px-2 py-2.5 text-center text-sm font-bold transition ${
                    selected ? 'scale-[1.04] shadow-lg ring-[3px] ring-white' : 'opacity-75 hover:opacity-100'
                  }`}
                >
                  {selected && (
                    <span
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] shadow"
                      style={{ color: s.bg }}
                    >
                      ✓
                    </span>
                  )}
                  {s.name}
                </button>
              )
            })}
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-[var(--tema-primary)] py-4 text-lg font-bold text-white shadow-[0_10px_25px_-8px_rgba(0,0,0,0.35)] transition hover:brightness-90 disabled:opacity-60"
          >
            {loading ? 'Enviando...' : config.boton_texto}
          </button>

          <p className="mt-4 text-center text-xs text-brand-ink/40">
            🔒 Al confirmar, te redirigimos — seguinos para ver al ganador
          </p>
        </form>
      </div>

      <footer className="px-5 pb-8 text-center">
        <p className="text-xs text-brand-ink/40">
          Superprecios · La Plata ·{' '}
          <a
            href={config.link_destino}
            className="underline hover:text-[var(--tema-primary)]"
          >
            {config.footer_texto}
          </a>
        </p>
      </footer>
    </main>
  )
}
