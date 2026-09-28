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
  bases_condiciones: string
  fecha_cierre: string | null
}

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(local: string): string | null {
  if (!local) return null
  return new Date(local).toISOString()
}

export default function Configuracion({
  clave,
  onClaveCambiada,
}: {
  clave: string
  onClaveCambiada: (nueva: string) => void
}) {
  const [config, setConfig] = useState<Config | null>(null)
  const [imagenNueva, setImagenNueva] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [generandoQR, setGenerandoQR] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [claveActual, setClaveActual] = useState('')
  const [claveNueva, setClaveNueva] = useState('')
  const [claveNuevaConfirmar, setClaveNuevaConfirmar] = useState('')
  const [cambiandoClave, setCambiandoClave] = useState(false)
  const [mensajeClave, setMensajeClave] = useState('')

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
      p_bases_condiciones: config.bases_condiciones,
      p_fecha_cierre: config.fecha_cierre,
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

  const cambiarClave = async () => {
    setMensajeClave('')
    if (claveNueva.length < 4) {
      setMensajeClave('La clave nueva tiene que tener al menos 4 caracteres.')
      return
    }
    if (claveNueva !== claveNuevaConfirmar) {
      setMensajeClave('Las claves nuevas no coinciden.')
      return
    }
    setCambiandoClave(true)
    const { error } = await supabase.rpc('admin_cambiar_clave', {
      p_clave_actual: claveActual,
      p_clave_nueva: claveNueva,
    })
    setCambiandoClave(false)

    if (error) {
      setMensajeClave('Clave actual incorrecta.')
      return
    }

    onClaveCambiada(claveNueva)
    setClaveActual('')
    setClaveNueva('')
    setClaveNuevaConfirmar('')
    setMensajeClave('✓ Clave actualizada.')
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

        <label className={labelClass}>Cierre automático (opcional)</label>
        <input
          type="datetime-local"
          value={toLocalInput(config.fecha_cierre)}
          onChange={(e) => set('fecha_cierre', fromLocalInput(e.target.value))}
          className={inputClass}
        />
        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-xs text-brand-ink/50">
            Llegada esa fecha, el sorteo se cierra solo, aunque no entres a apagarlo.
          </p>
          {config.fecha_cierre && (
            <button
              onClick={() => set('fecha_cierre', null)}
              className="ml-2 shrink-0 text-xs text-brand-ink/40 underline"
            >
              Sacar fecha
            </button>
          )}
        </div>
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

      {/* Bases y condiciones */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">
          Bases y condiciones
        </p>
        <p className="mt-1 text-xs text-brand-ink/50">
          Se muestra en un link abajo del formulario. Si lo dejás vacío, el link no aparece.
        </p>
        <textarea
          value={config.bases_condiciones}
          onChange={(e) => set('bases_condiciones', e.target.value)}
          rows={8}
          placeholder="Quiénes pueden participar, cómo se sortea, cuándo, cómo se contacta al ganador, etc."
          className={`${inputClass} resize-y`}
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

      {/* Cambiar clave */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_-15px_rgba(255,75,18,0.35)]">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-ink/40">
          Cambiar clave del panel
        </p>
        <label className={labelClass}>Clave actual</label>
        <input
          type="password"
          value={claveActual}
          onChange={(e) => setClaveActual(e.target.value)}
          className={inputClass}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Clave nueva</label>
            <input
              type="password"
              value={claveNueva}
              onChange={(e) => setClaveNueva(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Confirmar clave nueva</label>
            <input
              type="password"
              value={claveNuevaConfirmar}
              onChange={(e) => setClaveNuevaConfirmar(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        {mensajeClave && (
          <p className="mt-3 text-sm font-bold text-brand-orange">{mensajeClave}</p>
        )}
        <button
          onClick={cambiarClave}
          disabled={cambiandoClave || !claveActual || !claveNueva}
          className="mt-4 w-full rounded-full border-2 border-brand-orange py-3 font-bold text-brand-orange transition hover:bg-brand-orange hover:text-white disabled:opacity-40"
        >
          {cambiandoClave ? 'Cambiando...' : 'Cambiar clave'}
        </button>
      </div>
    </div>
  )
}
