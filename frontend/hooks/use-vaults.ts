"use client"

import { useReadContract, useReadContracts } from 'wagmi'
import { CONTRACTS } from '@/lib/contracts'
import { formatUnits } from 'viem'
import { useMemo } from 'react'

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
  const { data: vaultCount, isLoading, error } = useReadContract({
    address: CONTRACTS.VaultFactory.address as `0x${string}`,
    abi: CONTRACTS.VaultFactory.abi,
    functionName: 'vaultCount',
  })

  return {
    vaultCount: vaultCount ? Number(vaultCount) : 0,
    isLoading,
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
    },
  })

  // Filter valid vaults and prepare contracts for vault data fetching
  const validVaults = useMemo(() => {
    if (!vaultInfos) return []
    
    return vaultInfos
      .map((info, index) => {
        if (info.status === 'success' && info.result) {
          const vaultInfo = info.result as VaultInfo
          // Only include vaults with valid addresses
          if (vaultInfo.vault && vaultInfo.vault !== '0x0000000000000000000000000000000000000000') {
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
    },
  })

  // Combine all data
  const vaults = useMemo(() => {
    if (validVaults.length === 0 || !vaultDataResults) return []

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

    return result
  }, [validVaults, vaultDataResults])

  return {
    vaults,
    isLoading: countLoading || infosLoading || dataLoading,
    vaultCount,
  }
}
