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
import { Edit, Square, Eye, ChevronDown, ChevronUp, Plus, Loader2 } from "lucide-react"
import { useAllVaults } from "@/hooks/use-vaults"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { CONTRACTS, CONTRACT_ADDRESSES } from "@/lib/contracts"
import { toast } from "sonner"
import { useAccount } from "wagmi"

export default function VaultManagement() {
  const [expandedVaults, setExpandedVaults] = useState<Set<number>>(new Set())
  const [rebalanceDialogOpen, setRebalanceDialogOpen] = useState(false)
  const [stopFundDialogOpen, setStopFundDialogOpen] = useState(false)
  const [createVaultDialogOpen, setCreateVaultDialogOpen] = useState(false)
  const [selectedVaultId, setSelectedVaultId] = useState<number | null>(null)
  const [selectedToken, setSelectedToken] = useState<string>("")
  const [amount, setAmount] = useState<string>("")

  // Create vault form state
  const [vaultName, setVaultName] = useState("")
  const [vaultSymbol, setVaultSymbol] = useState("")
  const [governanceEnabled, setGovernanceEnabled] = useState(false)
  const { address: connectedAddress } = useAccount()

  // Fetch vaults dynamically from contract
  const { vaults, isLoading } = useAllVaults()

  // Fixed base asset - USDC
  const baseAsset = "0x70c3C79d33A9b08F1bc1e7DB113D1588Dad7d8Bc" // USDC address

  // Write contract for creating vault
  const {
    data: hash,
    writeContract,
    isPending: isCreating,
    error: createError,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  // Mock fund tokens data
  const fundTokens = [
    { token: "ETH", value: "2.5", usdValue: "$6,250" },
    { token: "BTC", value: "0.15", usdValue: "$9,750" },
    { token: "USDC", value: "10,000", usdValue: "$10,000" },
    { token: "MATIC", value: "5,000", usdValue: "$4,500" },
  ]

  const availableTokens = ["ETH", "BTC", "USDC", "MATIC", "LINK", "UNI"]
  const usdcBalance = "50,000" // Mock USDC balance

  const toggleVault = (vaultId: number) => {
    const newExpanded = new Set(expandedVaults)
    if (newExpanded.has(vaultId)) {
      newExpanded.delete(vaultId)
    } else {
      newExpanded.add(vaultId)
    }
    setExpandedVaults(newExpanded)
  }

  const handleRebalance = (vaultId: number) => {
    setSelectedVaultId(vaultId)
    setRebalanceDialogOpen(true)
  }

  const handleExecuteRebalance = () => {
    // TODO: Implement rebalance functionality
    console.log("Executing rebalance:", {
      vaultId: selectedVaultId,
      token: selectedToken,
      amount: amount,
    })
    setRebalanceDialogOpen(false)
    setSelectedToken("")
    setAmount("")
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
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>
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
                <div className="mt-6 pt-6 border-t space-y-4">
                  <h4 className="font-semibold text-foreground mb-4">Current Fund Holdings</h4>
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
                      {fundTokens.map((holding, index) => (
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
                      onClick={() => handleRebalance(vault.id)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Rebalance Fund
                    </Button>
                  </div>
                </div>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Available USDC Balance</label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-lg font-semibold">${usdcBalance} USDC</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Token</label>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a token" />
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.map((token) => (
                    <SelectItem key={token} value={token}>
                      {token}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
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
              disabled={!selectedToken || !amount}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Execute
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
