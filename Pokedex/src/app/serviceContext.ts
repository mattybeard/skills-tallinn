import { createContext, useContext } from 'react'
import type { AppServices, ServiceProvider } from './ServiceProvider'

export const ServiceContext = createContext<ServiceProvider | null>(null)

export function useService<K extends keyof AppServices>(key: K): AppServices[K] {
  const provider = useContext(ServiceContext)
  if (provider === null) {
    throw new Error('useService must be used inside a ServiceContext provider.')
  }
  return provider.get(key)
}
