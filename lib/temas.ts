export type TemaKey = 'naranja' | 'azul' | 'verde' | 'morado' | 'rojo'

export type Tema = {
  key: TemaKey
  nombre: string
  primary: string
  primaryDark: string
  gold: string
}

export const TEMAS: Record<TemaKey, Tema> = {
  naranja: {
    key: 'naranja',
    nombre: 'Naranja Superprecios',
    primary: '#FF4B12',
    primaryDark: '#C1272D',
    gold: '#FFD23F',
  },
  azul: {
    key: 'azul',
    nombre: 'Azul',
    primary: '#2563EB',
    primaryDark: '#1E3A8A',
    gold: '#FFD23F',
  },
  verde: {
    key: 'verde',
    nombre: 'Verde',
    primary: '#16A34A',
    primaryDark: '#14532D',
    gold: '#FFD23F',
  },
  morado: {
    key: 'morado',
    nombre: 'Morado',
    primary: '#7C3AED',
    primaryDark: '#4C1D95',
    gold: '#FFD23F',
  },
  rojo: {
    key: 'rojo',
    nombre: 'Rojo',
    primary: '#DC2626',
    primaryDark: '#7F1D1D',
    gold: '#FFD23F',
  },
}

export function getTema(key: string | null | undefined): Tema {
  return TEMAS[(key as TemaKey) ?? 'naranja'] ?? TEMAS.naranja
}
