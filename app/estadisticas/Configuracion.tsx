'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { generarTarjetaQR } from './generarQR'
import { TEMAS, TemaKey, getTema } from '@/lib/temas'

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
  tema: TemaKey
  link_destino: string
  footer_texto: string
  cta_hero_texto: string
  boton_texto: string
  mensaje_inactivo_titulo: string
  mensaje_inactivo_texto: string
  mensaje_inactivo_boton: string
}

export default function Configuracion({ clave }: { clave: string }) {
  const [config, setConfig] = useState<Config | null>(null)
  const [imagenNueva, setImagenNueva] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [generandoQR, setGenerandoQR] = useState(false)
  const [mensaje, setMensaje] = useState('')

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

  if (!config) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
        <p className="text-sm text-brand-ink/50">Cargando configuración...</p>
      </div>
    )
  }

  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig({ ...config, [key]: value })

  const guardar = async () => {
    setGuardando(true)
    setMensaje('')

    let path = config.imagen_premio_path

    if (imagenNueva) {
      const ext = imagenNueva.name.split('.').pop() || 'jpg'
      const nuevoPath = `${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('premios')
        .upload(nuevoPath, imagenNueva, { contentType: imagenNueva.type || 'image/jpeg' })
      if (uploadError) {
        setGuardando(false)
        setMensaje('No pudimos subir la imagen. Probá de nuevo.')
        return
      }
      path = nuevoPath
    }

    const { error } = await supabase.rpc('admin_set_sorteo_config', {
      p_clave: clave,
      p_titulo: config.titulo,
      p_subtitulo: config.subtitulo,
      p_premio_badge: config.premio_badge,
      p_premio_monto: config.premio_monto,
      p_premio_texto: config.premio_texto,
      p_premio_nota: config.premio_nota,
      p_imagen_premio_path: path,
      p_sorteo_activo: config.sorteo_activo,
      p_tema: config.tema,
      p_link_destino: config.link_destino,
      p_footer_texto: config.footer_texto,
      p_cta_hero_texto: config.cta_hero_texto,
      p_boton_texto: config.boton_texto,
      p_mensaje_inactivo_titulo: config.mensaje_inactivo_titulo,
      p_mensaje_inactivo_texto: config.mensaje_inactivo_texto,
      p_mensaje_inactivo_boton: config.mensaje_inactivo_boton,
    })

    setGuardando(false)

    if (error) {
      setMensaje('Hubo un error al guardar.')
      return
    }

    setConfig({ ...config, imagen_premio_path: path })
    setImagenNueva(null)
    setMensaje('✓ Guardado. Ya se ve así en la página.')
  }

  const descargarQR = async () => {
    setGenerandoQR(true)
    try {
      const dataUrl = await generarTarjetaQR({
        titulo: config.titulo,
        premio_monto: config.premio_monto,
        premio_nota: config.premio_nota,
        tema: getTema(config.tema),
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'qr-sorteo.png'
      a.click()
    } finally {
      setGenerandoQR(false)
    }
  }

  const temaActual = getTema(config.tema)
  const inputClass =
    'w-full rounded-xl border-2 border-black/5 bg-brand-cream px-4 py-3 text-sm text-brand-ink placeholder:text-brand-ink/40 transition focus:outline-none'
  const labelClass = 'mb-1.5 mt-4 block text-xs font-bold uppercase tracking-widest text-brand-ink/40'

  return (
    <div className="space-y-6">
      {/* Tema */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-ink/40">
          Tema de color
        </p>
        <div className="grid grid-cols-5 gap-2">
          {Object.values(TEMAS).map((t) => (
            <button
              key={t.key}
              onClick={() => set('tema', t.key)}
              title={t.nombre}
              className={`flex flex-col items-center gap-1.5 rounded-xl p-2 transition ${
                config.tema === t.key ? 'bg-brand-cream ring-2 ring-brand-ink/20' : ''
              }`}
            >
              <span
                className="h-9 w-9 rounded-full border-2 border-white shadow"
                style={{
                  background: `linear-gradient(135deg, ${t.primary}, ${t.primaryDark})`,
                }}
              />
              {config.tema === t.key && <span className="text-[10px]">✓</span>}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-brand-ink/50">{temaActual.nombre}</p>
      </div>

      {/* Textos */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">
            Textos de la landing
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-brand-ink">
            <input
              type="checkbox"
              checked={config.sorteo_activo}
              onChange={(e) => set('sorteo_activo', e.target.checked)}
              className="h-4 w-4 accent-brand-orange"
            />
            Sorteo activo
          </label>
        </div>

        <label className={labelClass}>Título principal</label>
        <input value={config.titulo} onChange={(e) => set('titulo', e.target.value)} className={inputClass} />

        <label className={labelClass}>Texto debajo del título</label>
        <input
          value={config.subtitulo}
          onChange={(e) => set('subtitulo', e.target.value)}
          className={inputClass}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Botón del hero</label>
            <input
              value={config.cta_hero_texto}
              onChange={(e) => set('cta_hero_texto', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Botón de enviar</label>
            <input
              value={config.boton_texto}
              onChange={(e) => set('boton_texto', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <label className={labelClass}>Texto del pie de página (link)</label>
        <input
          value={config.footer_texto}
          onChange={(e) => set('footer_texto', e.target.value)}
          className={inputClass}
        />

        <label className={labelClass}>Adónde redirige (Instagram, WhatsApp, tu web...)</label>
        <input
          value={config.link_destino}
          onChange={(e) => set('link_destino', e.target.value)}
          placeholder="https://..."
          className={inputClass}
        />
      </div>

      {/* Premio */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">Premio</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Etiqueta del premio</label>
            <input
              value={config.premio_badge}
              onChange={(e) => set('premio_badge', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Monto / premio</label>
            <input
              value={config.premio_monto}
              onChange={(e) => set('premio_monto', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Texto del premio</label>
            <input
              value={config.premio_texto}
              onChange={(e) => set('premio_texto', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Nota (quién gana)</label>
            <input
              value={config.premio_nota}
              onChange={(e) => set('premio_nota', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <label className={labelClass}>Imagen del premio (opcional)</label>
        {config.imagen_premio_path && !imagenNueva && (
          <img
            src={PREMIOS_URL + config.imagen_premio_path}
            alt="Premio actual"
            className="mb-2 h-32 w-full rounded-xl object-cover"
          />
        )}
        <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-dashed border-brand-orange/40 bg-brand-cream px-4 py-3 text-sm text-brand-ink transition hover:border-brand-orange">
          <span>{imagenNueva ? `📎 ${imagenNueva.name}` : '📷 Subir / cambiar imagen'}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setImagenNueva(e.target.files?.[0] ?? null)}
          />
        </label>
        {config.imagen_premio_path && (
          <button
            onClick={() => {
              set('imagen_premio_path', null)
              setImagenNueva(null)
            }}
            className="mt-2 text-xs text-brand-ink/40 underline"
          >
            Sacar imagen (volver al premio en texto)
          </button>
        )}
      </div>

      {/* Mensaje cuando está inactivo */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">
          Mensaje cuando el sorteo está inactivo
        </p>
        <label className={labelClass}>Título</label>
        <input
          value={config.mensaje_inactivo_titulo}
          onChange={(e) => set('mensaje_inactivo_titulo', e.target.value)}
          className={inputClass}
        />
        <label className={labelClass}>Texto</label>
        <input
          value={config.mensaje_inactivo_texto}
          onChange={(e) => set('mensaje_inactivo_texto', e.target.value)}
          className={inputClass}
        />
        <label className={labelClass}>Texto del botón</label>
        <input
          value={config.mensaje_inactivo_boton}
          onChange={(e) => set('mensaje_inactivo_boton', e.target.value)}
          className={inputClass}
        />
      </div>

      {mensaje && (
        <p className="text-center text-sm font-bold text-brand-orange">{mensaje}</p>
      )}
      <button
        onClick={guardar}
        disabled={guardando}
        className="w-full rounded-full bg-brand-orange py-3.5 font-bold text-white shadow-lg transition hover:bg-[#e8410c] disabled:opacity-60"
      >
        {guardando ? 'Guardando...' : 'Guardar cambios'}
      </button>

      <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-ink/40">
          QR para imprimir
        </p>
        <p className="mb-3 text-sm text-brand-ink/60">
          Se genera con el título, el premio y el tema de arriba. Guardá los cambios primero si
          acabás de editar algo.
        </p>
        <button
          onClick={descargarQR}
          disabled={generandoQR}
          className="w-full rounded-full border-2 border-brand-orange py-3 font-bold text-brand-orange transition hover:bg-brand-orange hover:text-white disabled:opacity-60"
        >
          {generandoQR ? 'Generando...' : '📥 Descargar QR para imprimir'}
        </button>
      </div>
    </div>
  )
}
