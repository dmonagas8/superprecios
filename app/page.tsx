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
const MONTO_MINIMO = 20000

export default function SorteoPage() {
  const [form, setForm] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    sucursal: '',
    monto: '',
  })
  const [ticket, setTicket] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.nombre || !form.dni || !form.telefono || !form.sucursal || !form.monto) {
      setError('Completá todos los campos para participar.')
      return
    }

    const monto = Number(form.monto)
    if (!Number.isFinite(monto) || monto < MONTO_MINIMO) {
      setError(`El monto de tu compra tiene que ser de $${MONTO_MINIMO.toLocaleString('es-AR')} o más.`)
      return
    }

    if (!ticket) {
      setError('Subí una foto de tu ticket de compra.')
      return
    }

    setLoading(true)

    const ext = ticket.name.split('.').pop() || 'jpg'
    const path = `${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('tickets').upload(path, ticket, {
      contentType: ticket.type || 'image/jpeg',
    })

    if (uploadError) {
      setLoading(false)
      setError('No pudimos subir la foto del ticket. Probá de nuevo.')
      return
    }

    const { error: rpcError } = await supabase.rpc('enviar_participacion_orden_compra', {
      p_nombre: form.nombre,
      p_dni: form.dni,
      p_telefono: form.telefono,
      p_sucursal: form.sucursal,
      p_monto: monto,
      p_ticket_path: path,
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

    setEnviado(true)
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
            Ganate una orden de compra de $50.000
          </h1>
          <p className="mt-4 px-4 text-sm text-white/80">
            Comprá $20.000 o más en cualquiera de nuestras sucursales, subí tu ticket y quedás
            participando.
          </p>
          {!enviado && (
            <a
              href="#form"
              className="mt-7 inline-block rounded-full bg-white px-8 py-3.5 text-base font-bold text-brand-orange shadow-lg transition hover:scale-[1.03]"
            >
              Quiero participar
            </a>
          )}
        </div>
      </section>

      {/* Prize card */}
      <div className="relative z-10 mx-auto -mt-10 max-w-md px-5">
        <div className="overflow-hidden rounded-3xl bg-white p-6 text-center shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-orange">
            🎫 El premio
          </p>
          <p className="font-display mt-1 text-5xl text-brand-ink">$50.000</p>
          <p className="mt-1 text-sm font-bold text-brand-ink/70">en orden de compra</p>
          <p className="mt-3 text-xs text-brand-ink/50">
            Un ganador por sucursal · Comprá $20.000 o más y subí tu ticket
          </p>
        </div>
      </div>

      {enviado ? (
        <div className="mx-auto mb-12 mt-8 max-w-md px-5">
          <div className="rounded-3xl bg-white p-8 text-center shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
            <p className="text-5xl">✅</p>
            <h2 className="font-display mt-3 text-3xl text-brand-ink">¡Listo!</h2>
            <p className="mt-2 text-sm text-brand-ink/60">
              Recibimos tu ticket. Lo vamos a revisar y, si está todo en orden, quedás
              participando del sorteo.
            </p>
            <a
              href={INSTAGRAM_URL}
              className="mt-6 inline-block w-full rounded-full bg-brand-orange py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#e8410c]"
            >
              Seguinos en Instagram para ver al ganador
            </a>
          </div>
        </div>
      ) : (
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

            <p className="mb-2 mt-6 text-sm font-bold text-brand-ink">Tu compra</p>
            <input
              name="monto"
              placeholder="Monto de tu compra ($20.000 o más)"
              inputMode="numeric"
              value={form.monto}
              onChange={handleChange}
              className="w-full rounded-xl border-2 border-black/5 bg-brand-cream px-4 py-3 text-sm text-brand-ink placeholder:text-brand-ink/40 transition focus:border-brand-orange focus:outline-none"
            />

            <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border-2 border-dashed border-brand-orange/40 bg-brand-cream px-4 py-3 text-sm text-brand-ink transition hover:border-brand-orange">
              <span>{ticket ? `📎 ${ticket.name}` : '📷 Subir foto del ticket'}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => setTicket(e.target.files?.[0] ?? null)}
              />
            </label>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-full bg-brand-orange py-4 text-lg font-bold text-white shadow-[0_10px_25px_-8px_rgba(255,75,18,0.6)] transition hover:bg-[#e8410c] disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviar ticket y participar'}
            </button>

            <p className="mt-4 text-center text-xs text-brand-ink/40">
              🔒 Revisamos cada ticket antes de confirmar tu participación
            </p>
          </form>
        </div>
      )}

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
