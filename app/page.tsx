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
    <main className="min-h-screen bg-brand-cream flex flex-col items-center">
      {/* Hero */}
      <div className="relative w-full max-w-md">
        <div className="relative h-64 overflow-hidden rounded-b-[2.5rem] shadow-lg">
          <img
            src="/hero.jpg"
            alt="Sorteo Superprecios"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-cream via-transparent to-black/10" />
        </div>

        <div className="px-6 -mt-2 text-center">
          <img
            src="/logo.png"
            alt="Superprecios"
            className="w-14 h-14 mx-auto -mt-8 relative z-10 drop-shadow-lg"
          />
          <p className="text-brand-orange font-bold tracking-tight text-sm mt-3">
            Primavera en el Súper
          </p>
          <h1 className="font-display text-brand-ink text-4xl leading-[0.95] mt-1">
            Ganate el combo de primavera
          </h1>
          <p className="text-brand-ink/60 text-sm mt-2 px-4">
            Termo Stanley + pava eléctrica. Cargá tus datos y quedás participando.
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="w-full max-w-md px-5 mt-6 mb-10">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]"
        >
          <div className="space-y-3">
            <input
              name="nombre"
              placeholder="Nombre y apellido"
              value={form.nombre}
              onChange={handleChange}
              className="w-full bg-brand-cream rounded-xl px-4 py-3 text-sm text-brand-ink placeholder:text-brand-ink/40 border-2 border-transparent focus:border-brand-orange focus:outline-none transition"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                name="dni"
                placeholder="DNI"
                value={form.dni}
                onChange={handleChange}
                className="w-full bg-brand-cream rounded-xl px-4 py-3 text-sm text-brand-ink placeholder:text-brand-ink/40 border-2 border-transparent focus:border-brand-orange focus:outline-none transition"
              />
              <input
                name="telefono"
                placeholder="Teléfono"
                value={form.telefono}
                onChange={handleChange}
                className="w-full bg-brand-cream rounded-xl px-4 py-3 text-sm text-brand-ink placeholder:text-brand-ink/40 border-2 border-transparent focus:border-brand-orange focus:outline-none transition"
              />
            </div>
          </div>

          <p className="text-brand-ink font-bold text-sm mt-5 mb-2">
            ¿En qué sucursal participás?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SUCURSALES.map((s) => {
              const selected = form.sucursal === s.name
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setForm({ ...form, sucursal: s.name })}
                  style={{
                    backgroundColor: s.bg,
                    color: s.text,
                    outline: selected ? `3px solid ${s.bg}` : 'none',
                    outlineOffset: '2px',
                  }}
                  className={`rounded-xl py-2.5 px-2 text-sm font-bold text-center transition ${
                    selected ? 'scale-[1.04] shadow-md' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {s.name}
                </button>
              )
            })}
          </div>

          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-orange hover:bg-[#e8410c] disabled:opacity-60 text-white font-bold text-lg py-4 rounded-full mt-6 transition shadow-[0_10px_25px_-8px_rgba(255,75,18,0.6)]"
          >
            {loading ? 'Enviando...' : 'Confirmar participación'}
          </button>

          <p className="text-center text-brand-ink/40 text-xs mt-4">
            Al confirmar, te llevamos a nuestro Instagram — seguinos para ver al ganador
          </p>
        </form>
      </div>
    </main>
  )
}
