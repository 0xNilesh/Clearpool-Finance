# ExecuteAdapter Transaction Debugging Checklist

## Complete On-Chain Verification Results

### ✅ All Setup Verified Correct
- [x] **Vault Address**: `0xeB8899291d5F9178bF0e42C4d143d356161A1E22` ✅
- [x] **ValuationModule Address**: `0xc095a0a66e9529e8495545e64f84ec905fc57e02` ✅
- [x] **AdapterRegistry Address**: `0xacae0aad329529e908ab857525b0a526b63efed4` ✅
- [x] **Base Asset**: `0x70c3C79d33A9b08F1bc1e7DB113D1588Dad7d8Bc` (USDC) ✅
- [x] **USDC Balance in Vault**: `10000000000000000000` (10 USDC) ✅
- [x] **ETH Price in ValuationModule**: `2500000000000000000000` (2500e18) ✅
- [x] **USDC Price in ValuationModule**: `1000000000000000000` (1e18) ✅
- [x] **DexAdapter Registered**: `0xc5451D068147e30836464425Ed79890b0b294E26` ✅
- [x] **USDC Approval**: `maxUint256` (infinite approval) ✅
- [x] **Curator**: `0x49403ae592c82fc3f861cd0b9738f7524fb1f38c` ✅
- [x] **Governance Enabled**: `true` (1) ✅
- [x] **UniswapV3Integration**: `0x0d5fc84b8c3da1dc48385ee3f9aa74d2a8bc2ff7` ✅
- [x] **UniswapV3Integration Router**: `0x0fd4a5cabcdc2a4e9e6ba53a723e6e399f9ab913` ✅
- [x] **Expected SwapRouter from addresses.json**: `0xE175E3aBa428d028D2CEdE8e1cB338D1f1D50d13` ⚠️ **MISMATCH!**

## ⚠️ ISSUE FOUND: Router Address Mismatch

**Problem**: 
- UniswapV3Integration router: `0x0fd4a5cabcdc2a4e9e6ba53a723e6e399f9ab913`
- Expected router from addresses.json: `0xE175E3aBa428d028D2CEdE8e1cB338D1f1D50d13`
- **These don't match!**

**Impact**: The DexAdapter was initialized with a different router address than expected. This could cause swap failures if:
1. The router at `0x0fd4a5cabcdc2a4e9e6ba53a723e6e399f9ab913` doesn't exist or is incorrect
2. The pool doesn't exist on that router
3. The router doesn't have the expected interface

## Parameter Encoding Verification

### ✅ Verified Correct
- [x] **Inner Params Encoding**: Matches test file pattern
  - `abi.encode(address, address, uint24, uint256, uint256, uint160)`
  - Frontend output matches `cast` command output ✅
- [x] **DexAdapter.execute Encoding**: Matches test file pattern
  - `abi.encodeCall(DexAdapter.execute, (innerParams, vaultAddress))`
  - Frontend output matches `cast` command output ✅
- [x] **Adapter ID**: `0x51489d4263e7aff6c512a83666a144c08d740a160db30b26495ddfc5e7f1c21e` (keccak256("DEX")) ✅
- [x] **Input Parameters**:
  - tokenIn: `0x70c3C79d33A9b08F1bc1e7DB113D1588Dad7d8Bc` (USDC) ✅
  - tokenOut: `0xEF9dA0056f03F0df3BB1b1b8650Fb83b62396ACe` (ETH) ✅
  - fee: `3000` ✅
  - amountIn: `2000000000000000000` (2 USDC) ✅
  - amountOutMin: `490000000000000` (0.00049 ether) ✅
  - sqrtPriceLimitX96: `0` ✅

## Contract Flow Analysis

### AssetVault.executeAdapter Flow
1. ✅ Checks if caller is curator (or has governance approval) - **PASS** (governance enabled)
2. ✅ Gets adapter address from `adapterRegistry.getAdapter(adapterId)` - **PASS** (returns correct address)
3. ⚠️ Calls adapter with `adapter.call(params)` - **NEEDS VERIFICATION**
4. Updates NAV via `valuationModule.calculateNAV()`

### DexAdapter.execute Flow
1. ✅ Decodes params: `(tokenIn, tokenOut, fee, amountIn, amountOutMin, sqrtPriceLimitX96)`
2. ⚠️ Transfers `amountIn` from vault to adapter: `IERC20(tokenIn).safeTransferFrom(vault, address(this), amountIn)` - **SHOULD WORK** (approval exists)
3. ⚠️ Approves UniswapV3Integration: `IERC20(tokenIn).approve(address(uniswapIntegration), amountIn)`
4. ⚠️ Calls `uniswapIntegration.swap(...)` with recipient = vault - **ROUTER MISMATCH ISSUE HERE**
5. Returns `amountOut`

## Most Likely Root Cause

### ❌ Router Address Mismatch
The UniswapV3Integration was initialized with router `0x0fd4a5cabcdc2a4e9e6ba53a723e6e399f9ab913`, but the expected router is `0xE175E3aBa428d028D2CEdE8e1cB338D1f1D50d13`.

**This could cause**:
- Swap to fail if the router doesn't exist
- Swap to fail if the router doesn't have the expected pool
- Swap to fail if the router interface is different

## Additional Notes

### DexAdapter Owner
- **DexAdapter Owner**: `0xec47b6539d3e5d27a4d6200657a54f91a78ff3a2` (different vault)
- **Note**: This shouldn't matter for transfers since the vault has approved the DexAdapter. The owner is only for access control on the adapter itself.

## Debug Commands (All Verified)

```bash
# Get ValuationModule address
cast call 0xeB8899291d5F9178bF0e42C4d143d356161A1E22 "valuationModule()" --rpc-url https://endpoints.omniatech.io/v1/mantle/sepolia/public
# Result: 0xc095a0a66e9529e8495545e64f84ec905fc57e02 ✅

# Check ETH price
cast call 0xc095a0a66e9529e8495545e64f84ec905fc57e02 "prices(address)(uint256)" 0xEF9dA0056f03F0df3BB1b1b8650Fb83b62396ACe --rpc-url https://endpoints.omniatech.io/v1/mantle/sepolia/public
# Result: 2500000000000000000000 (2500e18) ✅

# Check USDC price
cast call 0xc095a0a66e9529e8495545e64f84ec905fc57e02 "prices(address)(uint256)" 0x70c3C79d33A9b08F1bc1e7DB113D1588Dad7d8Bc --rpc-url https://endpoints.omniatech.io/v1/mantle/sepolia/public
# Result: 1000000000000000000 (1e18) ✅

# Get AdapterRegistry address
cast call 0xeB8899291d5F9178bF0e42C4d143d356161A1E22 "adapterRegistry()" --rpc-url https://endpoints.omniatech.io/v1/mantle/sepolia/public
# Result: 0xacae0aad329529e908ab857525b0a526b63efed4 ✅

# Check DexAdapter registration
cast call 0xacae0aad329529e908ab857525b0a526b63efed4 "getAdapter(bytes32)(address)" 0x51489d4263e7aff6c512a83666a144c08d740a160db30b26495ddfc5e7f1c21e --rpc-url https://endpoints.omniatech.io/v1/mantle/sepolia/public
# Result: 0xc5451D068147e30836464425Ed79890b0b294E26 ✅

# Check curator
cast call 0xeB8899291d5F9178bF0e42C4d143d356161A1E22 "curator()" --rpc-url https://endpoints.omniatech.io/v1/mantle/sepolia/public
# Result: 0x49403ae592c82fc3f861cd0b9738f7524fb1f38c ✅

# Check USDC approval
cast call 0x70c3C79d33A9b08F1bc1e7DB113D1588Dad7d8Bc "allowance(address,address)(uint256)" 0xeB8899291d5F9178bF0e42C4d143d356161A1E22 0xc5451D068147e30836464425Ed79890b0b294E26 --rpc-url https://endpoints.omniatech.io/v1/mantle/sepolia/public
# Result: maxUint256 ✅

# Check UniswapV3Integration router
cast call 0xc5451D068147e30836464425Ed79890b0b294E26 "uniswapIntegration()" --rpc-url https://endpoints.omniatech.io/v1/mantle/sepolia/public
# Result: 0x0d5fc84b8c3da1dc48385ee3f9aa74d2a8bc2ff7 ✅

cast call 0x0d5fc84b8c3da1dc48385ee3f9aa74d2a8bc2ff7 "router()" --rpc-url https://endpoints.omniatech.io/v1/mantle/sepolia/public
# Result: 0x0fd4a5cabcdc2a4e9e6ba53a723e6e399f9ab913 ⚠️ MISMATCH with expected 0xE175E3aBa428d028D2CEdE8e1cB338D1f1D50d13
```

## Final Summary

### ✅ Everything Verified Correct
- [x] Parameter encoding matches test file exactly ✅
- [x] ETH price: 2500e18 ✅
- [x] USDC price: 1e18 ✅
- [x] DexAdapter registered correctly ✅
- [x] USDC approval: maxUint256 ✅
- [x] Vault balance: 10 USDC (sufficient) ✅
- [x] Curator set correctly ✅
- [x] Governance enabled ✅

### ⚠️ Issue Found
- [ ] **Router Address Mismatch**: UniswapV3Integration uses router `0x0fd4a5cabcdc2a4e9e6ba53a723e6e399f9ab913` but expected is `0xE175E3aBa428d028D2CEdE8e1cB338D1f1D50d13`

### 🔧 Next Steps
1. **Verify Router**: Check if router `0x0fd4a5cabcdc2a4e9e6ba53a723e6e399f9ab913` is valid and has the expected interface
2. **Check Pool Exists**: Verify USDC/ETH pool exists on that router with fee tier 3000
3. **Check Transaction Error**: Look at actual revert reason in transaction receipt
4. **Verify Caller**: Ensure the wallet calling is the curator or has governance approval
