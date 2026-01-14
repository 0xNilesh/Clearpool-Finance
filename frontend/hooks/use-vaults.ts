"use client"

import { useReadContract, useReadContracts } from 'wagmi'
import { CONTRACTS } from '@/lib/contracts'
import { formatUnits } from 'viem'
import { useMemo, useEffect, useState } from 'react'

// Blacklisted vault addresses (demo/test vaults to exclude from public listings)
const BLACKLISTED_VAULTS: string[] = [
  '0x6b86e2D19dD44f1C044922C61ff095062D7db99c'.toLowerCase(), // Large Cap Funds (demo)
]

// Cache configuration
const CACHE_KEY_VAULT_COUNT = 'clearpool_vault_count'
const CACHE_KEY_VAULT_DATA = 'clearpool_vault_data'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

// Cache utilities with BigInt serialization support
const getCachedData = <T,>(key: string): { data: T; timestamp: number } | null => {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null
    const parsed = JSON.parse(cached, (key, value) => {
      // Handle BigInt serialization (stored as strings)
      if (typeof value === 'string' && value.startsWith('BIGINT:')) {
        return BigInt(value.slice(7))
      }
      return value
    })
    const age = Date.now() - parsed.timestamp
    if (age > CACHE_DURATION) {
      localStorage.removeItem(key)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

const setCachedData = <T,>(key: string, data: T): void => {
  if (typeof window === 'undefined') return
  try {
    // Serialize BigInt values as strings
    const serialized = JSON.stringify({ data, timestamp: Date.now() }, (key, value) => {
      if (typeof value === 'bigint') {
        return `BIGINT:${value.toString()}`
      }
      return value
    })
    localStorage.setItem(key, serialized)
  } catch {
    // Ignore storage errors (e.g., quota exceeded)
  }
}

export interface VaultInfo {
  id: number
  vault: string
  creator: string
  baseAsset: string
  curator: string
  name: string
  symbol: string
  governanceEnabled: boolean
  createdAt: bigint
}

export interface VaultData {
  id: number
  address: string
  name: string
  symbol: string
  baseAsset: string
  curator: string
  governanceEnabled: boolean
  totalAssets?: bigint
  totalSupply?: bigint
  aum?: string
  issuedShares?: string
  perf?: string
}

export function useVaultCount() {
  const [cachedCount, setCachedCount] = useState<number | null>(null)
  
  // Check cache on mount
  useEffect(() => {
    const cached = getCachedData<number>(CACHE_KEY_VAULT_COUNT)
    if (cached) {
      setCachedCount(cached.data)
    }
  }, [])

  const { data: vaultCount, isLoading, error } = useReadContract({
    address: CONTRACTS.VaultFactory.address as `0x${string}`,
    abi: CONTRACTS.VaultFactory.abi,
    functionName: 'vaultCount',
    query: {
      refetchInterval: 300000, // Refetch every 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: cachedCount === null, // Only refetch on mount if no cache
      staleTime: CACHE_DURATION, // Consider data stale after 5 minutes
    },
  })

  // Update cache when data changes
  useEffect(() => {
    if (vaultCount !== undefined) {
      const count = Number(vaultCount)
      setCachedData(CACHE_KEY_VAULT_COUNT, count)
      setCachedCount(count)
    }
  }, [vaultCount])

  return {
    vaultCount: vaultCount ? Number(vaultCount) : (cachedCount ?? 0),
    isLoading: isLoading && cachedCount === null,
    error,
  }
}

export function useVaultInfo(vaultId: number) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.VaultFactory.address as `0x${string}`,
    abi: CONTRACTS.VaultFactory.abi,
    functionName: 'getVaultInfo',
    args: [BigInt(vaultId)],
    query: {
      enabled: vaultId > 0,
    },
  })

  return {
    vaultInfo: data as VaultInfo | undefined,
    isLoading,
    error,
  }
}

export function useAllVaults() {
  const { vaultCount, isLoading: countLoading } = useVaultCount()

  // Create array of vault IDs (1-indexed based on contract)
  const vaultIds = useMemo(() => {
    if (!vaultCount || vaultCount === 0) return []
    return Array.from({ length: vaultCount }, (_, i) => i + 1)
  }, [vaultCount])

  // Fetch all vault info in parallel
  const vaultInfoContracts = useMemo(() => {
    if (vaultIds.length === 0) return []
    return vaultIds.map((id) => ({
      address: CONTRACTS.VaultFactory.address as `0x${string}`,
      abi: CONTRACTS.VaultFactory.abi,
      functionName: 'getVaultInfo' as const,
      args: [BigInt(id)] as const,
    }))
  }, [vaultIds])

  const { data: vaultInfos, isLoading: infosLoading } = useReadContracts({
    contracts: vaultInfoContracts,
    query: {
      enabled: vaultIds.length > 0,
      refetchInterval: 300000, // Refetch every 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on mount - use cache
      staleTime: CACHE_DURATION,
    },
  })

  // Filter valid vaults and prepare contracts for vault data fetching
  const validVaults = useMemo(() => {
    if (!vaultInfos) return []
    
    return vaultInfos
      .map((info, index) => {
        if (info.status === 'success' && info.result) {
          const vaultInfo = info.result as VaultInfo
          // Only include vaults with valid addresses and exclude blacklisted vaults
          if (
            vaultInfo.vault && 
            vaultInfo.vault !== '0x0000000000000000000000000000000000000000' &&
            !BLACKLISTED_VAULTS.includes(vaultInfo.vault.toLowerCase())
          ) {
            return {
              id: index + 1,
              vaultInfo,
            }
          }
        }
        return null
      })
      .filter((v): v is { id: number; vaultInfo: VaultInfo } => v !== null)
  }, [vaultInfos])

  // Fetch vault data (totalAssets, totalSupply, name, symbol) for each valid vault
  const vaultDataContracts = useMemo(() => {
    if (validVaults.length === 0) return []
    
    return validVaults.flatMap((v) => [
      {
        address: v.vaultInfo.vault as `0x${string}`,
        abi: CONTRACTS.AssetVault.abi,
        functionName: 'totalAssets' as const,
      },
      {
        address: v.vaultInfo.vault as `0x${string}`,
        abi: CONTRACTS.AssetVault.abi,
        functionName: 'totalSupply' as const,
      },
      {
        address: v.vaultInfo.vault as `0x${string}`,
        abi: CONTRACTS.AssetVault.abi,
        functionName: 'name' as const,
      },
      {
        address: v.vaultInfo.vault as `0x${string}`,
        abi: CONTRACTS.AssetVault.abi,
        functionName: 'symbol' as const,
      },
    ])
  }, [validVaults])

  const { data: vaultDataResults, isLoading: dataLoading } = useReadContracts({
    contracts: vaultDataContracts,
    query: {
      enabled: vaultDataContracts.length > 0,
      refetchInterval: 300000, // Refetch every 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on mount - use cache
      staleTime: CACHE_DURATION,
    },
  })

  // Combine all data with caching
  const vaults = useMemo(() => {
    // Check cache first
    const cached = getCachedData<VaultData[]>(CACHE_KEY_VAULT_DATA)
    if (cached && validVaults.length > 0) {
      // Verify cached data matches current vaults (in case new vaults were created)
      const cachedAddresses = new Set(cached.data.map(v => v.address.toLowerCase()))
      const currentAddresses = new Set(validVaults.map(v => v.vaultInfo.vault.toLowerCase()))
      const addressesMatch = cachedAddresses.size === currentAddresses.size &&
        Array.from(cachedAddresses).every(addr => currentAddresses.has(addr))
      
      if (addressesMatch) {
        return cached.data
      }
    }

    if (validVaults.length === 0 || !vaultDataResults) {
      // Return cached data if available, even if stale
      return cached?.data || []
    }

    const result: VaultData[] = []

    validVaults.forEach((v, vaultIndex) => {
      const dataIndex = vaultIndex * 4

      // Get vault data (4 calls per vault: totalAssets, totalSupply, name, symbol)
      const totalAssetsResult = vaultDataResults[dataIndex]
      const totalSupplyResult = vaultDataResults[dataIndex + 1]
      const nameResult = vaultDataResults[dataIndex + 2]
      const symbolResult = vaultDataResults[dataIndex + 3]

      const totalAssets = totalAssetsResult?.status === 'success' 
        ? (totalAssetsResult.result as bigint) 
        : undefined
      const totalSupply = totalSupplyResult?.status === 'success'
        ? (totalSupplyResult.result as bigint)
        : undefined
      const name = nameResult?.status === 'success'
        ? (nameResult.result as string)
        : v.vaultInfo.name
      const symbol = symbolResult?.status === 'success'
        ? (symbolResult.result as string)
        : v.vaultInfo.symbol

      // Format values
      const aum = totalAssets 
        ? `$${(Number(formatUnits(totalAssets, 18)) / 1e6).toFixed(2)}M`
        : '$0.00M'
      const issuedShares = totalSupply
        ? formatUnits(totalSupply, 18).split('.')[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        : '0'
      
      // Calculate performance (mock for now - would need historical data)
      const perf = '+0.0%'

      result.push({
        id: v.id,
        address: v.vaultInfo.vault,
        name: name || v.vaultInfo.name || `Vault ${v.id}`,
        symbol: symbol || v.vaultInfo.symbol || 'VAULT',
        baseAsset: v.vaultInfo.baseAsset,
        curator: v.vaultInfo.curator,
        governanceEnabled: v.vaultInfo.governanceEnabled,
        totalAssets,
        totalSupply,
        aum,
        issuedShares,
        perf,
      })
    })

    // Cache the result
    if (result.length > 0) {
      setCachedData(CACHE_KEY_VAULT_DATA, result)
    }

    return result
  }, [validVaults, vaultDataResults])

  return {
    vaults,
    isLoading: countLoading || infosLoading || dataLoading,
    vaultCount,
  }
}
