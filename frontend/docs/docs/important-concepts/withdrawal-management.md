---
sidebar_position: 2
sidebar_label: Withdrawal Management
---

# Withdrawal Management

Clearpool Finance allows you to withdraw your investments instantly at any time. This guide explains how withdrawals work and what to expect.

## How Withdrawals Work

### Instant Processing

Unlike traditional investment platforms, Clearpool Finance processes withdrawals instantly:

1. **Request Withdrawal**: Enter the amount or number of shares you want to withdraw
2. **Automatic Calculation**: The system calculates the withdrawal amount based on current NAV
3. **Smart Contract Execution**: Withdrawal is processed immediately via smart contract
4. **Funds Transferred**: Your tokens are transferred directly to your wallet

### No Lock-in Periods

- **Anytime Withdrawal**: Withdraw your funds at any time, no waiting periods
- **Partial Withdrawals**: You can withdraw any portion of your investment
- **Full Withdrawal**: Withdraw your entire investment when ready

## Withdrawal Process

### Step 1: Navigate to Portfolio

Go to your Portfolio section in the app to view all your investments.

### Step 2: Select Investment

Choose the fund from which you want to withdraw.

### Step 3: Initiate Withdrawal

- Enter the amount you want to withdraw (in USD or tokens)
- Or enter the number of shares you want to redeem
- Review the estimated amount you'll receive

### Step 4: Confirm Transaction

- Review the withdrawal details:
  - Current NAV
  - Number of shares being redeemed
  - Amount you'll receive
  - Any applicable fees
- Approve the transaction in your wallet
- Wait for blockchain confirmation

### Step 5: Receive Funds

Once confirmed, your funds are immediately available in your wallet.

## Withdrawal Calculation

Withdrawals are calculated based on the current NAV:

```
Withdrawal Amount = Number of Shares × Current NAV - Fees
```

### Example

If you want to withdraw:
- Number of shares: 100
- Current NAV: $12.50
- Fee: 0.5% ($1.25)

```
Withdrawal Amount = 100 × $12.50 - $1.25
Withdrawal Amount = $1,250 - $1.25
Withdrawal Amount = $1,248.75
```

## Withdrawal Fees

Clearpool Finance charges minimal fees for withdrawals:

- **Withdrawal Fee**: Typically 0.1% - 0.5% (varies by fund)
- **Gas Fees**: You pay for blockchain transaction gas
- **No Hidden Fees**: All fees are clearly displayed before confirmation

Fees are deducted from your withdrawal amount automatically.

## Important Considerations

### NAV Impact

- Withdrawals are processed at the **current NAV** when your transaction is confirmed
- NAV may change between when you initiate and when the transaction is confirmed
- This is usually negligible for instant confirmations

### Liquidity

- Most withdrawals are instant due to fund liquidity reserves
- In rare cases of high withdrawal volume, there may be a slight delay
- Large withdrawals may be processed in batches to ensure fund stability

### Partial vs Full Withdrawal

**Partial Withdrawal:**
- Keep remaining shares in the fund
- Continue earning returns on remaining investment
- No additional fees for multiple partial withdrawals

**Full Withdrawal:**
- Redeem all your shares
- Receive full current value of your investment
- Can reinvest anytime in the future

## Withdrawal Status

Track your withdrawal status in real-time:

- **Pending**: Transaction submitted, awaiting confirmation
- **Processing**: Transaction confirmed, executing on blockchain
- **Completed**: Funds successfully transferred to your wallet
- **Failed**: Transaction failed (check for error details)

## Best Practices

1. **Review NAV**: Check current NAV before withdrawing to know the exact amount
2. **Gas Fees**: Ensure you have enough gas (ETH/tokens) for the transaction
3. **Timing**: Withdrawals are instant, so timing is less critical than traditional platforms
4. **Keep Records**: All withdrawals are recorded on-chain for your records

## Troubleshooting

### Withdrawal Failed

If your withdrawal fails:
- Check you have enough gas for the transaction
- Verify your wallet is connected correctly
- Ensure you have sufficient shares to withdraw
- Check blockchain status for network issues

### Amount Different Than Expected

If the withdrawal amount differs:
- NAV may have changed between initiation and confirmation
- Fees may vary based on fund policies
- Check the transaction details for exact breakdown

## Security

All withdrawals are secured by:
- **Smart Contract Verification**: All transactions are verified by smart contracts
- **On-chain Records**: Complete audit trail of all withdrawals
- **Wallet Security**: Funds go directly to your connected wallet

For more information, see [Funds Control](/docs/security/funds-control) to understand fund security.
