import { useEffect, useState } from 'react'

// Cuenta de 0 hasta el valor en menos de un segundo. Si el valor no es un número (por ejemplo "—"), lo muestra tal cual.
// Con "reducir movimiento" activado en el sistema, muestra el valor final sin animar.
function ContadorAnimado({ valor, duracion = 900 }) {
  const numero = typeof valor === 'number' ? valor : null
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [mostrado, setMostrado] = useState(0)

  useEffect(() => {
    if (numero === null || reducir) return undefined
    const control = { cuadro: 0 }
    const inicio = performance.now()
    const paso = (ahora) => {
      const avance = Math.min((ahora - inicio) / duracion, 1)
      setMostrado(Math.round(numero * (1 - (1 - avance) ** 3)))
      if (avance < 1) control.cuadro = requestAnimationFrame(paso)
    }
    control.cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(control.cuadro)
  }, [numero, reducir, duracion])

  if (numero === null) return valor
  return reducir ? numero : mostrado
}

export default ContadorAnimado
