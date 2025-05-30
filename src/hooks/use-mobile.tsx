
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile(): boolean | undefined {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window === 'undefined') {
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Set initial state
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    mql.addEventListener("change", onChange)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile;
}
