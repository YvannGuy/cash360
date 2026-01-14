'use client'

import { useEffect, useRef } from 'react'

/**
 * Composant d'instrumentation pour déboguer les problèmes de performance
 * 
 * UTILISATION:
 * 1. Ajouter <PerformanceDebugger /> dans app/layout.tsx (temporairement)
 * 2. Ouvrir la console et observer les logs
 * 3. Retirer le composant une fois les problèmes identifiés
 * 
 * Pour activer: Ajouter dans app/layout.tsx après les providers
 * Pour désactiver: Commenter ou retirer le composant
 */

export default function PerformanceDebugger() {
  const renderCountRef = useRef(0)
  const intervalCountRef = useRef(0)
  const timeoutCountRef = useRef(0)
  const rafCountRef = useRef(0)
  
  useEffect(() => {
    // Compteur de renders
    renderCountRef.current++
    if (renderCountRef.current % 10 === 0) {
      console.log(`[PERF] PerformanceDebugger render #${renderCountRef.current}`)
    }
    
    // Détecter les intervals actifs
    const originalSetInterval = window.setInterval
    const originalClearInterval = window.clearInterval
    const activeIntervals = new Set<number>()
    
    window.setInterval = function(handler: TimerHandler, timeout?: number, ...args: any[]): number {
      const id = originalSetInterval(handler, timeout, ...args) as unknown as number
      activeIntervals.add(id)
      intervalCountRef.current++
      console.warn(`[PERF] ⚠️ setInterval créé #${intervalCountRef.current} (total actifs: ${activeIntervals.size})`, {
        id,
        delay: timeout,
        stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
      })
      return id
    } as typeof window.setInterval
    
    window.clearInterval = function(id: number | undefined): void {
      if (id !== undefined) {
        activeIntervals.delete(id)
        console.log(`[PERF] ✅ clearInterval appelé (restants: ${activeIntervals.size})`)
      }
      return originalClearInterval(id)
    } as typeof window.clearInterval
    
    // Détecter les timeouts actifs
    const originalSetTimeout = window.setTimeout
    const originalClearTimeout = window.clearTimeout
    const activeTimeouts = new Set<number>()
    
    window.setTimeout = function(handler: TimerHandler, timeout?: number, ...args: any[]): number {
      const id = originalSetTimeout(handler, timeout, ...args) as unknown as number
      activeTimeouts.add(id)
      timeoutCountRef.current++
      if (timeoutCountRef.current % 20 === 0) {
        console.warn(`[PERF] ⚠️ setTimeout créé #${timeoutCountRef.current} (total actifs: ${activeTimeouts.size})`)
      }
      return id
    } as typeof window.setTimeout
    
    window.clearTimeout = function(id: number | undefined): void {
      if (id !== undefined) {
        activeTimeouts.delete(id)
      }
      return originalClearTimeout(id)
    } as typeof window.clearTimeout
    
    // Détecter les requestAnimationFrame
    const originalRAF = window.requestAnimationFrame
    const originalCAF = window.cancelAnimationFrame
    const activeRAFs = new Set<number>()
    
    window.requestAnimationFrame = function(callback: FrameRequestCallback): number {
      const id = originalRAF(callback)
      activeRAFs.add(id)
      rafCountRef.current++
      if (rafCountRef.current % 50 === 0) {
        console.warn(`[PERF] ⚠️ requestAnimationFrame créé #${rafCountRef.current} (total actifs: ${activeRAFs.size})`)
      }
      return id
    }
    
    window.cancelAnimationFrame = function(id: number) {
      activeRAFs.delete(id)
      return originalCAF.apply(window, [id])
    }
    
    // Surveiller les event listeners
    const originalAddEventListener = EventTarget.prototype.addEventListener
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener
    const activeListeners = new Map<string, Set<string>>()
    
    EventTarget.prototype.addEventListener = function(type: string, listener: any, options?: any) {
      const key = `${this.constructor.name}.${type}`
      if (!activeListeners.has(key)) {
        activeListeners.set(key, new Set())
      }
      activeListeners.get(key)!.add(listener.toString().slice(0, 50))
      
      if (type === 'scroll' || type === 'resize' || type === 'mousemove') {
        console.warn(`[PERF] ⚠️ addEventListener('${type}') sur ${this.constructor.name}`, {
          total: activeListeners.get(key)!.size,
          stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
        })
      }
      
      return originalAddEventListener.apply(this, [type, listener, options])
    }
    
    EventTarget.prototype.removeEventListener = function(type: string, listener: any, options?: any) {
      const key = `${this.constructor.name}.${type}`
      if (activeListeners.has(key)) {
        activeListeners.get(key)!.delete(listener.toString().slice(0, 50))
        if (activeListeners.get(key)!.size === 0) {
          activeListeners.delete(key)
        }
      }
      return originalRemoveEventListener.apply(this, [type, listener, options])
    }
    
    // Rapport périodique
    const reportInterval = setInterval(() => {
      console.group('[PERF] 📊 Rapport de performance')
      console.log(`Intervals actifs: ${activeIntervals.size}`)
      console.log(`Timeouts actifs: ${activeTimeouts.size}`)
      console.log(`RAFs actifs: ${activeRAFs.size}`)
      console.log(`Event listeners:`, Array.from(activeListeners.entries()).map(([k, v]) => `${k}: ${v.size}`))
      const memory = (performance as any).memory
      if (memory) {
        console.log(`Memory: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`)
      }
      console.groupEnd()
    }, 10000) // Toutes les 10 secondes
    
    // Cleanup
    return () => {
      clearInterval(reportInterval)
      
      // Restaurer les fonctions originales
      window.setInterval = originalSetInterval
      window.clearInterval = originalClearInterval
      window.setTimeout = originalSetTimeout
      window.clearTimeout = originalClearTimeout
      window.requestAnimationFrame = originalRAF
      window.cancelAnimationFrame = originalCAF
      EventTarget.prototype.addEventListener = originalAddEventListener
      EventTarget.prototype.removeEventListener = originalRemoveEventListener
    }
  }, [])
  
  return null // Ce composant ne render rien
}

