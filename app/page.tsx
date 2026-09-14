'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const SUCURSALES = [
  { name: 'Pronto', bg: '#C1272D', text: '#FFFFFF' },
  { name: 'Sempre', bg: '#F2994A', text: '#FFFFFF' },
  { name: 'Mercadinho', bg: '#2D5F3E', text: '#FFFFFF' },
  { name: 'Tu Super', bg: '#FFD23F', text: '#7A1F1F' },
  { name: 'Super Más', bg: '#4FB0D8', text: '#FFFFFF' },
  { name: 'Mercado da Onda', bg: '#4A2E83', text: '#FFC629' },
]

const INSTAGRAM_URL = 'https://www.instagram.com/superprecioslaplata/'

export default function SorteoPage() {
  const [form, setForm] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    sucursal: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    const { error: insertError } = await supabase.from('participantes_sorteo').insert([form])
    setLoading(false)

    if (insertError) {
      setError('Hubo un error al registrar tu participación. Probá de nuevo.')
      return
    }

    window.location.href = INSTAGRAM_URL
  }

  return (
    <main className="min-h-screen bg-brand-cream">
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-orange px-5 pb-20 pt-12 text-center">
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
          <h1 className="font-display mt-4 text-5xl leading-[0.95] text-white">
            Ganate el combo de primavera
          </h1>
          <p className="mt-4 px-4 text-sm text-white/80">
            Termo Stanley + pava eléctrica. Cargá tus datos y quedás participando.
          </p>
          <a
            href="#form"
            className="mt-7 inline-block rounded-full bg-white px-8 py-3.5 text-base font-bold text-brand-orange shadow-lg transition hover:scale-[1.03]"
          >
            Quiero participar
          </a>
        </div>
      </section>

      {/* Prize card */}
      <div className="relative z-10 mx-auto -mt-10 max-w-md px-5">
        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
          <div className="relative">
            <img
              src="/premio.jpg"
              alt="Termo Stanley y pava eléctrica, el premio del sorteo"
              className="aspect-[10/9] w-full object-cover"
            />
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-orange shadow-sm">
              🎁 El premio
            </span>
          </div>
          <div className="p-4 text-left">
            <p className="text-sm font-bold text-brand-ink">Termo Stanley + Pava eléctrica</p>
            <p className="mt-0.5 text-xs text-brand-ink/50">Un ganador sorteado entre todos los participantes</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div id="form" className="mx-auto mb-12 mt-8 max-w-md scroll-mt-6 px-5">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]"
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
              className="w-full rounded-xl border-2 border-black/5 bg-brand-cream px-4 py-3 text-sm text-brand-ink placeholder:text-brand-ink/40 transition focus:border-brand-orange focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                name="dni"
                placeholder="DNI"
                inputMode="numeric"
                value={form.dni}
                onChange={handleChange}
                className="w-full rounded-xl border-2 border-black/5 bg-brand-cream px-4 py-3 text-sm text-brand-ink placeholder:text-brand-ink/40 transition focus:border-brand-orange focus:outline-none"
              />
              <input
                name="telefono"
                placeholder="Teléfono"
                inputMode="tel"
                value={form.telefono}
                onChange={handleChange}
                className="w-full rounded-xl border-2 border-black/5 bg-brand-cream px-4 py-3 text-sm text-brand-ink placeholder:text-brand-ink/40 transition focus:border-brand-orange focus:outline-none"
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
            className="mt-6 w-full rounded-full bg-brand-orange py-4 text-lg font-bold text-white shadow-[0_10px_25px_-8px_rgba(255,75,18,0.6)] transition hover:bg-[#e8410c] disabled:opacity-60"
          >
            {loading ? 'Enviando...' : 'Confirmar participación'}
          </button>

          <p className="mt-4 text-center text-xs text-brand-ink/40">
            🔒 Al confirmar, te llevamos a nuestro Instagram — seguinos para ver al ganador
          </p>
        </form>
      </div>

      <footer className="px-5 pb-8 text-center">
        <p className="text-xs text-brand-ink/40">
          Superprecios · La Plata ·{' '}
          <a href={INSTAGRAM_URL} className="underline hover:text-brand-orange">
            @superprecioslaplata
          </a>
        </p>
      </footer>
    </main>
  )
}
