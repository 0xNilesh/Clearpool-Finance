"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Edit, Square, ChevronDown, ChevronUp, Plus, Loader2 } from "lucide-react"
import { useAllVaults } from "@/hooks/use-vaults"
import { useWriteContract, useWaitForTransactionReceipt, useReadContracts, useReadContract } from "wagmi"
import { createPublicClient, http, defineChain } from "viem"
import { NETWORK_CONFIG } from "@/lib/contracts"
import { CONTRACTS, CONTRACT_ADDRESSES } from "@/lib/contracts"
import { toast } from "sonner"
import { useAccount } from "wagmi"
import { formatUnits, parseUnits, encodeFunctionData, keccak256, toHex, encodeAbiParameters, parseAbiParameters } from "viem"
import { useMemo } from "react"
import addresses from "@/../addresses.json"


// Component for displaying USDC balance in vault
function USDCBalanceDisplay({ vaultAddress }: { vaultAddress: string }) {
  const usdcAddress = addresses.testTokens.USDC.address as `0x${string}`
  
  const { data: balance, isLoading } = useReadContract({
    address: usdcAddress,
    abi: [
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      },
    ] as const,
    functionName: "balanceOf",
    args: [vaultAddress as `0x${string}`],
  })

  if (isLoading) {
    return <span>Loading...</span>
  }

  if (!balance) {
    return <span>$0.00 USDC</span>
  }

  const balanceFormatted = formatUnits(balance, 18)
  return <>${Number(balanceFormatted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</>
}

// Component for displaying vault holdings
function VaultHoldings({
  vaultAddress,
  totalAssets,
  TOKEN_MAP,
  tokenAddresses,
  handleBuy,
  handleSell,
  handleRebalance,
}: {
  vaultAddress: string
  totalAssets?: bigint
  TOKEN_MAP: Map<string, { name: string; symbol: string; decimals: number }>
  tokenAddresses: `0x${string}`[]
  handleBuy: (token: string) => void
  handleSell: (token: string) => void
  handleRebalance: () => void
}) {
  // Get balances for all tokens in the vault
  const balanceContracts = useMemo(() => {
    if (!vaultAddress) return []
    return tokenAddresses.map((tokenAddr) => ({
      address: tokenAddr,
      abi: [
        {
          name: "balanceOf",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ name: "", type: "uint256" }],
        },
      ] as const,
      functionName: "balanceOf" as const,
      args: [vaultAddress as `0x${string}`],
    }))
  }, [vaultAddress, tokenAddresses])

  const { data: balanceResults, isLoading: balancesLoading } = useReadContracts({
    contracts: balanceContracts,
    query: {
      enabled: balanceContracts.length > 0 && !!vaultAddress,
    },
  })

  // Calculate vault holdings
  const vaultHoldings = useMemo(() => {
    if (!balanceResults || !totalAssets) return []
    
    const holdings: Array<{ token: string; value: string; usdValue: string }> = []
    
    balanceResults.forEach((result, index) => {
      if (result.status === "success" && result.result) {
        const balance = result.result as bigint
        const tokenAddress = tokenAddresses[index]
        const tokenInfo = TOKEN_MAP.get(tokenAddress.toLowerCase())
        
        if (tokenInfo && balance > BigInt(0)) {
          const balanceFormatted = formatUnits(balance, tokenInfo.decimals)
          const balanceValue = Number(balanceFormatted)
          
          // Format value
          const value = balanceValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })
          
          // Format USD value (simplified - would need actual token prices)
          const usdValue = `$${(balanceValue).toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}`
          
          holdings.push({
            token: tokenInfo.symbol,
            value,
            usdValue,
          })
        }
      }
    })
    
    // Sort by token symbol
    return holdings.sort((a, b) => a.token.localeCompare(b.token))
  }, [balanceResults, totalAssets, tokenAddresses, TOKEN_MAP])

  return (
    <div className="mt-6 pt-6 border-t space-y-4">
      <h4 className="font-semibold text-foreground mb-4">Current Fund Holdings</h4>
      {balancesLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading holdings...</span>
        </div>
      ) : vaultHoldings.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>USD Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vaultHoldings.map((holding, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{holding.token}</TableCell>
                  <TableCell>{holding.value}</TableCell>
                  <TableCell>{holding.usdValue}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBuy(holding.token)}
                        className="bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/20"
                      >
                        Buy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSell(holding.token)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-500/20"
                      >
                        Sell
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="pt-4">
            <Button
              onClick={handleRebalance}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Rebalance Fund
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground py-4">No holdings found</p>
      )}
    </div>
  )
}

export default function VaultManagement() {
  const [expandedVaults, setExpandedVaults] = useState<Set<number>>(new Set())
  const [rebalanceDialogOpen, setRebalanceDialogOpen] = useState(false)
  const [stopFundDialogOpen, setStopFundDialogOpen] = useState(false)
  const [createVaultDialogOpen, setCreateVaultDialogOpen] = useState(false)
  const [selectedVaultId, setSelectedVaultId] = useState<number | null>(null)
  const [selectedToken, setSelectedToken] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [tokenPrices, setTokenPrices] = useState<Map<string, bigint>>(new Map())

  // Create vault form state
  const [vaultName, setVaultName] = useState("")
  const [vaultSymbol, setVaultSymbol] = useState("")
  const [governanceEnabled, setGovernanceEnabled] = useState(false)
  const { address: connectedAddress } = useAccount()
  
  // Create public client for reading contract data
  const getPublicClient = () => {
    const chain = defineChain({
      id: NETWORK_CONFIG.chainId,
      name: NETWORK_CONFIG.name,
      nativeCurrency: {
        decimals: 18,
        name: "Mantle",
        symbol: "MNT",
      },
      rpcUrls: {
        default: {
          http: [NETWORK_CONFIG.rpcUrl],
        },
      },
    })
    return createPublicClient({
      chain,
      transport: http(),
    })
  }

  // Fetch vaults dynamically from contract
  const { vaults, isLoading } = useAllVaults()

  // Fixed base asset - USDC
  const baseAsset = "0x70c3C79d33A9b08F1bc1e7DB113D1588Dad7d8Bc" // USDC address

  // Write contract for creating vault and executing adapter
  const {
    data: hash,
    writeContract,
    isPending: isCreating,
    error: createError,
  } = useWriteContract()
  
  const {
    data: rebalanceHash,
    writeContract: writeRebalance,
    isPending: isRebalancing,
    error: rebalanceError,
  } = useWriteContract()
  
  const { isLoading: isRebalanceConfirming, isSuccess: isRebalanceSuccess } = useWaitForTransactionReceipt({
    hash: rebalanceHash,
  })


  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  const availableTokens = ["ETH", "BTC", "SOL", "HYPE", "WMNT"]

  // Create token address to name mapping from addresses.json
  const TOKEN_MAP = useMemo(() => {
    const tokenMap = new Map<string, { name: string; symbol: string; decimals: number }>()
    
    // Add tokens from testTokens
    Object.entries(addresses.testTokens).forEach(([key, token]: [string, any]) => {
      tokenMap.set(token.address.toLowerCase(), {
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
      })
    })
    
    // Add WMNT from contracts
    tokenMap.set(addresses.contracts.WPC.toLowerCase(), {
      name: "WMNT",
      symbol: "WMNT",
      decimals: 18,
    })
    
    // Add tokens from pools (token0 and token1)
    Object.values(addresses.pools).forEach((pool: any) => {
      const token0Lower = pool.token0.toLowerCase()
      if (!tokenMap.has(token0Lower)) {
        tokenMap.set(token0Lower, {
          name: pool.token0Symbol,
          symbol: pool.token0Symbol,
          decimals: 18,
        })
      }
      
      const token1Lower = pool.token1.toLowerCase()
      if (!tokenMap.has(token1Lower)) {
        tokenMap.set(token1Lower, {
          name: pool.token1Symbol,
          symbol: pool.token1Symbol,
          decimals: 18,
        })
      }
    })
    
    return tokenMap
  }, [])

  // Get all unique token addresses
  const tokenAddresses = useMemo(() => {
    return Array.from(TOKEN_MAP.keys()).map(addr => addr as `0x${string}`)
  }, [TOKEN_MAP])

  const toggleVault = (vaultId: number) => {
    const newExpanded = new Set(expandedVaults)
    if (newExpanded.has(vaultId)) {
      newExpanded.delete(vaultId)
    } else {
      newExpanded.add(vaultId)
    }
    setExpandedVaults(newExpanded)
  }

  const handleRebalance = async (vaultId: number) => {
    setSelectedVaultId(vaultId)
    setRebalanceDialogOpen(true)
    
    // Fetch prices for all tokens when dialog opens
    const selectedVault = vaults.find(v => v.id === vaultId)
    if (!selectedVault) return
    
    try {
      // Step 1: Get vault address (proxy)
      const vaultAddress = selectedVault.address as `0x${string}`
      const publicClient = getPublicClient()
      
      // Step 2: Read ValuationModule address from vault (proxy)
      // Vault proxy has a view function that returns the ValuationModule address
      const valuationModuleAddress = await publicClient.readContract({
        address: vaultAddress,
        abi: CONTRACTS.AssetVault.abi,
        functionName: "valuationModule",
      }) as `0x${string}`
      
      // Step 3: Fetch prices for all available tokens from ValuationModule (proxy)
      // ValuationModule proxy has the prices mapping
      const priceMap = new Map<string, bigint>()
      
      for (const token of availableTokens) {
        let tokenAddress: string | null = null
        const tokenInfo = Object.entries(addresses.testTokens).find(
          ([key, value]: [string, any]) => value.symbol === token || value.name === token
        )
        if (tokenInfo) {
          tokenAddress = (tokenInfo[1] as any).address
        } else if (token === "WMNT") {
          tokenAddress = addresses.contracts.WPC
        }
        
        if (tokenAddress) {
          try {
            // Read price from ValuationModule proxy's prices mapping
            const price = await publicClient.readContract({
              address: valuationModuleAddress,
              abi: CONTRACTS.ValuationModule.abi,
              functionName: "prices",
              args: [tokenAddress as `0x${string}`],
            }) as bigint
            if (price && price > BigInt(0)) {
              priceMap.set(token, price)
            }
          } catch (error) {
            // Price not set, will show N/A
          }
        }
      }
      
      setTokenPrices(priceMap)
    } catch (error) {
      console.error("Failed to fetch token prices:", error)
    }
  }

  const handleExecuteRebalance = async () => {
    if (!selectedVaultId || !selectedToken || !amount) {
      toast.error("Please fill in all fields")
      return
    }

    const selectedVault = vaults.find(v => v.id === selectedVaultId)
    if (!selectedVault) {
      toast.error("Vault not found")
      return
    }

    try {
      const vaultAddress = selectedVault.address as `0x${string}`
      // Get token address from addresses.json
      let tokenOutAddress: string | null = null
      const tokenInfo = Object.entries(addresses.testTokens).find(
        ([key, value]: [string, any]) => value.symbol === selectedToken || value.name === selectedToken
      )
      if (tokenInfo) {
        tokenOutAddress = (tokenInfo[1] as any).address
      } else if (selectedToken === "WMNT") {
        tokenOutAddress = addresses.contracts.WPC
      }

      if (!tokenOutAddress) {
        toast.error(`Token address not found for ${selectedToken}`)
        return
      }

      // USDC address (tokenIn)
      const usdcAddress = addresses.testTokens.USDC.address as `0x${string}`
      const tokenOutAddr = tokenOutAddress as `0x${string}`
      
      // Parse amount from dollars to wei
      // User enters amount like "2" for 2 USDC, parseUnits converts to wei (18 decimals)
      // Example: "2" -> 2000000000000000000 wei
      const amountIn = parseUnits(amount, 18)
      
      // Step 1: Get vault address (proxy)
      // Step 2: Read ValuationModule address from vault (proxy)
      // Vault proxy has a view function that returns the ValuationModule address
      const publicClient = getPublicClient()
      
      const valuationModuleAddress = await publicClient.readContract({
        address: vaultAddress,
        abi: CONTRACTS.AssetVault.abi,
        functionName: "valuationModule",
      }) as `0x${string}`
      
      // Step 3: Get price of output token from ValuationModule (proxy)
      // ValuationModule proxy has the prices mapping
      // Price is stored as: priceInBase (1e18 = 1 base asset unit)
      // Example: if ETH price = 2500e18, it means 1 ETH = 2500 USDC
      // const tokenPrice = await publicClient.readContract({
      //   address: valuationModuleAddress,
      //   abi: CONTRACTS.ValuationModule.abi,
      //   functionName: "prices",
      //   args: [tokenOutAddr],
      // }) as bigint
      
      // Hardcode amountOutMin to 0.00049 ether
      // 0.00049 ether = 0.00049 * 10^18 = 490000000000000 wei
      const amountOutMin = BigInt(0)
      
      const fee = 3000 // 0.3% fee tier (uint24)
      const sqrtPriceLimitX96 = BigInt(0) // No price limit (uint160)

      // Replicate exact encoding from test file:
      // abi.encodeCall(DexAdapter.execute, (abi.encode(...), address(vault)))
      //
      // Step 1: Encode inner parameters using abi.encode
      // This encodes: (address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint256 amountOutMin, uint160 sqrtPriceLimitX96)
      console.log("📦 Inner Parameters (before encoding):", {
        tokenIn: usdcAddress,
        tokenOut: tokenOutAddr,
        fee: fee,
        amountIn: amountIn.toString(),
        amountOutMin: amountOutMin.toString(),
        sqrtPriceLimitX96: sqrtPriceLimitX96.toString(),
      })
      
      // abi.encode(tokenIn, tokenOut, fee, amountIn, amountOutMin, sqrtPriceLimitX96)
      const innerParams = encodeAbiParameters(
        parseAbiParameters("address, address, uint24, uint256, uint256, uint160"),
        [usdcAddress, tokenOutAddr, fee, amountIn, amountOutMin, sqrtPriceLimitX96]
      )
      console.log("📦 Encoded Inner Params (abi.encode):", innerParams)

      // Step 2: Encode function call using abi.encodeCall equivalent
      // abi.encodeCall(DexAdapter.execute, (innerParams, vaultAddress))
      // This is equivalent to encoding: execute(bytes calldata params, address vault)
      // Where params = innerParams and vault = vaultAddress
      const swapParams = encodeFunctionData({
        abi: CONTRACTS.DexAdapter.abi,
        functionName: "execute",
        args: [innerParams, vaultAddress],
      })
      console.log("📦 Encoded Swap Params (abi.encodeCall):", swapParams)

      // Adapter ID is keccak256("DEX")
      const adapterId = keccak256(toHex("DEX"))
      console.log("📦 Adapter ID (keccak256('DEX')):", adapterId)

      // Execute the adapter
      console.log("🚀 executeAdapter Parameters:", {
        vaultAddress: vaultAddress,
        adapterId: adapterId,
        params: swapParams,
      })
      
      writeRebalance({
        address: vaultAddress,
        abi: CONTRACTS.AssetVault.abi,
        functionName: "executeAdapter",
        args: [adapterId, swapParams],
      })

      toast.info("Rebalance transaction submitted. Waiting for confirmation...")
      setRebalanceDialogOpen(false)
      setSelectedToken("")
      setAmount("")
    } catch (error: any) {
      toast.error(`Failed to execute rebalance: ${error?.message || "Unknown error"}`)
    }
  }

  const handleBuy = (token: string) => {
    // TODO: Implement buy functionality
    console.log("Buy:", token)
  }

  const handleSell = (token: string) => {
    // TODO: Implement sell functionality
    console.log("Sell:", token)
  }

  const handleCreateVault = () => {
    setCreateVaultDialogOpen(true)
  }

  const handleCreateVaultSubmit = async () => {
    if (!vaultName || !vaultSymbol || !connectedAddress) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      writeContract({
        address: CONTRACTS.VaultFactory.address as `0x${string}`,
        abi: CONTRACTS.VaultFactory.abi,
        functionName: "createVault",
        args: [
          baseAsset as `0x${string}`, // USDC address (fixed)
          vaultName,
          vaultSymbol,
          governanceEnabled,
          connectedAddress, // curator is the connected address
        ],
      })
      toast.info("Transaction submitted. Waiting for confirmation...")
    } catch (error: any) {
      toast.error(`Failed to create vault: ${error?.message || "Unknown error"}`)
    }
  }

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed && createVaultDialogOpen) {
      toast.success("Vault created successfully!")
      setCreateVaultDialogOpen(false)
      setVaultName("")
      setVaultSymbol("")
      setGovernanceEnabled(false)
      // Vaults will automatically refresh on next render
    }
  }, [isConfirmed, createVaultDialogOpen])

  // Handle transaction error
  useEffect(() => {
    if (createError && createVaultDialogOpen) {
      toast.error(`Transaction failed: ${createError.message}`)
    }
  }, [createError, createVaultDialogOpen])

  // Handle rebalance transaction success
  useEffect(() => {
    if (isRebalanceSuccess) {
      toast.success("Rebalance executed successfully!")
    }
  }, [isRebalanceSuccess])

  // Handle rebalance transaction error
  useEffect(() => {
    if (rebalanceError) {
      toast.error(`Rebalance failed: ${rebalanceError.message}`)
    }
  }, [rebalanceError])

  const handleStopFund = (vaultId: number) => {
    setSelectedVaultId(vaultId)
    setStopFundDialogOpen(true)
  }

  const handleStopFundDone = () => {
    // TODO: Implement stop fund functionality - sell each token pair and convert to USDC
    console.log("Stopping fund:", selectedVaultId)
    setStopFundDialogOpen(false)
    setSelectedVaultId(null)
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Active Vaults</h2>
        <Button 
          onClick={handleCreateVault}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Vault
        </Button>
      </div>
      
      {isLoading ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading vaults...</p>
          </div>
        </Card>
      ) : vaults.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground text-lg">No vaults found</p>
            <Button 
              onClick={handleCreateVault}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Vault
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {vaults.map((vault) => {
          const isExpanded = expandedVaults.has(vault.id)
          return (
            <Card key={vault.id} className="p-6 overflow-hidden">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">{vault.name}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">AUM</p>
                      <p className="font-semibold text-foreground">{vault.aum}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Issued Shares</p>
                      <p className="font-semibold text-foreground">{vault.issuedShares}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Performance</p>
                      <p className="font-semibold text-green-500">{vault.perf}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleVault(vault.id)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <Edit className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStopFund(vault.id)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-500/20"
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Stop Fund
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <VaultHoldings 
                  vaultAddress={vault.address} 
                  totalAssets={vault.totalAssets}
                  TOKEN_MAP={TOKEN_MAP}
                  tokenAddresses={tokenAddresses}
                  handleBuy={handleBuy}
                  handleSell={handleSell}
                  handleRebalance={() => handleRebalance(vault.id)}
                />
              )}
            </Card>
          )
        })}
        </div>
      )}

      <Dialog open={rebalanceDialogOpen} onOpenChange={setRebalanceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Rebalance Fund</DialogTitle>
            <DialogDescription>
              Select token, amount, and execute rebalancing for this fund.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium whitespace-nowrap">Available USDC Balance</label>
              <div className="flex-1">
                <p className="text-lg font-semibold text-primary text-right">
                  {selectedVaultId ? (
                    (() => {
                      const selectedVault = vaults.find(v => v.id === selectedVaultId)
                      return selectedVault ? (
                        <USDCBalanceDisplay vaultAddress={selectedVault.address} />
                      ) : (
                        "Loading..."
                      )
                    })()
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Token</label>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a token" />
                </SelectTrigger>
                  <SelectContent>
                    {availableTokens.map((token) => {
                      // Check testTokens first
                      let tokenAddress: string | null = null
                      const tokenInfo = Object.entries(addresses.testTokens).find(
                        ([key, value]: [string, any]) => value.symbol === token || value.name === token
                      )
                      if (tokenInfo) {
                        tokenAddress = (tokenInfo[1] as any).address
                      } else if (token === "WMNT") {
                        // Check contracts for WMNT
                        tokenAddress = addresses.contracts.WPC
                      }
                      
                      const formatAddress = (addr: string) => {
                        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
                      }
                      
                      // Get price for this token
                      // Price is stored as priceInBase (1e18 = 1 base asset unit)
                      // Example: if price = 2500e18, it means 1 token = 2500 USDC
                      const price = tokenPrices.get(token)
                      let priceDisplay = "N/A"
                      if (price && price > BigInt(0)) {
                        const priceValue = formatUnits(price, 18)
                        // Format to show reasonable decimal places
                        const priceNum = Number(priceValue)
                        if (priceNum >= 1000) {
                          priceDisplay = `$${priceNum.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        } else {
                          priceDisplay = `$${priceNum.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                        }
                      }
                      
                      return (
                        <SelectItem key={token} value={token}>
                          <div className="flex items-center justify-between w-full gap-4">
                            <div className="flex items-center gap-2">
                              <span>{token}</span>
                              <span className="text-xs text-muted-foreground">
                                {priceDisplay}
                              </span>
                            </div>
                            {tokenAddress && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {formatAddress(tokenAddress)}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (in USDC)</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRebalanceDialogOpen(false)
                setSelectedToken("")
                setAmount("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecuteRebalance}
              disabled={!selectedToken || !amount || isRebalancing || isRebalanceConfirming}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {(isRebalancing || isRebalanceConfirming) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isRebalancing
                ? "Submitting..."
                : isRebalanceConfirming
                ? "Confirming..."
                : "Execute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={stopFundDialogOpen} onOpenChange={setStopFundDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Stop Fund</DialogTitle>
            <DialogDescription>
              Before stopping the fund, you must sell each token and convert it to USDC.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
              <p className="text-sm text-red-600 font-medium">
                ⚠️ Note: Before stopping the fund, you MUST sell each token and convert it to USDC.
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Are you sure you want to proceed with stopping this fund?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStopFundDialogOpen(false)
                setSelectedVaultId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStopFundDone}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              DONE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createVaultDialogOpen} onOpenChange={setCreateVaultDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Vault</DialogTitle>
            <DialogDescription>
              Create a new vault with your preferred settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vault-name">Vault Name *</Label>
              <Input
                id="vault-name"
                placeholder="e.g., Tech Growth Fund"
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                disabled={isCreating || isConfirming}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vault-symbol">Vault Symbol *</Label>
              <Input
                id="vault-symbol"
                placeholder="e.g., TGF"
                value={vaultSymbol}
                onChange={(e) => setVaultSymbol(e.target.value.toUpperCase())}
                disabled={isCreating || isConfirming}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base-asset">Base Asset</Label>
              <Input
                id="base-asset"
                value="USDC"
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground font-mono break-all">
                {baseAsset}
              </p>
              <p className="text-xs text-muted-foreground">
                Base asset is fixed to USDC for all vaults
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="curator">Curator Address</Label>
              <Input
                id="curator"
                value={connectedAddress || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Your connected wallet address will be set as the curator
              </p>
            </div>
            <div className={`flex items-center justify-between space-x-2 rounded-md border-2 p-4 transition-colors ${
              governanceEnabled 
                ? 'border-primary bg-primary/10' 
                : 'border-border bg-background'
            }`}>
              <div className="space-y-0.5">
                <Label htmlFor="governance" className="text-base font-semibold">
                  Enable Governance
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow token holders to vote on proposals
                </p>
              </div>
              <Switch
                id="governance"
                checked={governanceEnabled}
                onCheckedChange={setGovernanceEnabled}
                disabled={isCreating || isConfirming}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateVaultDialogOpen(false)
                setVaultName("")
                setVaultSymbol("")
                setGovernanceEnabled(false)
              }}
              disabled={isCreating || isConfirming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateVaultSubmit}
              disabled={
                isCreating ||
                isConfirming ||
                !vaultName ||
                !vaultSymbol ||
                !connectedAddress
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {(isCreating || isConfirming) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isCreating
                ? "Creating..."
                : isConfirming
                ? "Confirming..."
                : "Create Vault"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
