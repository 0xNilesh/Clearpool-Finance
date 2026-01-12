---
sidebar_position: 1
sidebar_label: Calculating NAV
---

# Calculating NAV (Net Asset Value)

Understanding how Net Asset Value (NAV) is calculated is crucial for investors using Clearpool Finance. NAV represents the per-share value of a fund and is calculated in real-time.

## What is NAV?

Net Asset Value (NAV) is the value per share of a fund. It represents the total value of all assets in the fund divided by the number of shares outstanding.

## NAV Calculation Formula

```
NAV = (Total Assets - Total Liabilities) / Total Shares Outstanding
```

### Components

1. **Total Assets**: The current market value of all assets held by the fund
2. **Total Liabilities**: All debts, fees, and obligations of the fund
3. **Total Shares Outstanding**: The total number of shares issued by the fund

## Real-time Updates

Clearpool Finance calculates NAV in real-time based on:

- **Current Market Prices**: All assets are valued at their current market prices
- **On-chain Data**: Asset values are pulled from on-chain oracles and DEX prices
- **Automatic Updates**: NAV is updated continuously as asset prices change

## How NAV Affects Your Investment

### When You Invest

When you invest in a fund:
- You purchase shares at the current NAV
- Your investment amount ÷ NAV = Number of shares you receive
- Example: If you invest $1000 and NAV is $10, you receive 100 shares

### When NAV Increases

If the fund performs well and NAV increases:
- The value of your shares increases proportionally
- Your investment value = Number of shares × Current NAV
- Example: If NAV increases to $12, your 100 shares are now worth $1200

### When NAV Decreases

If the fund underperforms and NAV decreases:
- The value of your shares decreases proportionally
- Your investment value = Number of shares × Current NAV
- Example: If NAV decreases to $8, your 100 shares are now worth $800

## NAV Display in Clearpool Finance

In the Clearpool Finance platform, you can see:

- **Current NAV**: Real-time NAV for each fund
- **NAV History**: Historical NAV values displayed in charts
- **Your Share Value**: Current value based on your shares × NAV

## Important Considerations

### Price Impact

Large investments or withdrawals may temporarily affect NAV due to:
- Transaction fees
- Market impact on underlying assets
- Slippage on DEX trades

### Fee Deductions

Fund management fees are deducted from NAV:
- Performance fees (if applicable)
- Management fees
- These are reflected in the NAV calculation

## Calculation Example

Let's say a fund has:
- Total Assets: $1,000,000 (in various tokens)
- Total Liabilities: $50,000 (fees, debts)
- Total Shares Outstanding: 100,000

```
NAV = ($1,000,000 - $50,000) / 100,000
NAV = $950,000 / 100,000
NAV = $9.50 per share
```

If you own 1,000 shares, your investment value is: 1,000 × $9.50 = $9,500

## Transparency

All NAV calculations are:
- **On-chain Verifiable**: You can verify calculations on the blockchain
- **Transparent**: Complete breakdown of assets and liabilities
- **Real-time**: Updated continuously as market conditions change

For more information, see [Withdrawal Management](/docs/important-concepts/withdrawal-management) to understand how NAV affects withdrawals.
