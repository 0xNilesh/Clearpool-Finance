---
sidebar_position: 7
---

# Frequently Asked Questions (FAQs)

Common questions and answers about Clearpool Finance.

## General Questions

### What is Clearpool Finance?

Clearpool Finance is a decentralized investment platform that allows users to invest in professionally managed funds with complete transparency, security, and instant access to their funds.

### How does Clearpool Finance differ from traditional investment platforms?

- **Decentralized**: Built on blockchain with smart contracts
- **Transparent**: All transactions and fund performance are on-chain
- **Instant Withdrawals**: No lock-in periods, withdraw anytime
- **Lower Fees**: Reduced fees through automation
- **Global Access**: Available to anyone with internet and a wallet

### What blockchain does Clearpool Finance use?

Currently deployed on Mantle Testnet for testing. Mainnet deployment will be announced when ready.

### Do I need to know about blockchain to use Clearpool Finance?

Basic understanding helps, but the platform is designed to be user-friendly. You mainly need:
- A Web3 wallet (MetaMask, Rainbow, etc.)
- Basic understanding of connecting wallets
- Understanding of transaction confirmations

## Getting Started

### How do I connect my wallet?

1. Click "Sign In" or "Get Started"
2. Select your wallet from the modal
3. Approve the connection request
4. Ensure you're on the correct network (Mantle Testnet for testing)

### Which wallets are supported?

Any WalletConnect-compatible wallet, including:
- MetaMask
- Rainbow
- Coinbase Wallet
- Trust Wallet
- And many more

### What tokens do I need?

For testing on Mantle Testnet, you'll need testnet tokens. For mainnet (when available), you'll need ETH or the specific tokens accepted by the funds.

### How do I get started with investing?

See our [Get Started](/docs/get-started) guide for step-by-step instructions.

## Investment Questions

### How do I invest in a fund?

1. Browse available funds on the dashboard
2. Click on a fund to view details
3. Enter the amount you want to invest
4. Review and confirm the transaction
5. Approve in your wallet

### What is the minimum investment?

Minimum investment varies by fund. Check each fund's details page for specific requirements.

### Are there any lock-in periods?

No! You can withdraw your investment at any time, instantly.

### How are returns calculated?

Returns are calculated based on the fund's Net Asset Value (NAV). See [Calculating NAV](/docs/important-concepts/calculating-nav) for detailed information.

### What fees are charged?

Fees vary by fund but typically include:
- Management fees (annual percentage)
- Performance fees (if applicable, on profits only)
- Withdrawal fees (minimal, typically 0.1-0.5%)
- Gas fees (blockchain transaction costs)

All fees are transparently displayed before you invest.

## NAV & Performance

### What is NAV?

NAV (Net Asset Value) is the per-share value of a fund. It represents the total value of all assets in the fund divided by the number of shares.

### How often is NAV updated?

NAV is updated in real-time as asset prices change. You'll always see the current NAV.

### How do I track my investment performance?

- View your portfolio in the Portfolio section
- See current value, returns, and XIRR
- Check individual fund performance
- View historical performance charts

### What is XIRR?

XIRR (Extended Internal Rate of Return) is a measure of your portfolio's annualized return, accounting for the timing of investments and withdrawals.

## Withdrawals

### How do I withdraw my investment?

1. Go to your Portfolio
2. Select the fund you want to withdraw from
3. Enter the amount or number of shares
4. Review and confirm
5. Approve in your wallet

See [Withdrawal Management](/docs/important-concepts/withdrawal-management) for detailed information.

### Are withdrawals instant?

Yes, withdrawals are processed instantly through smart contracts once your transaction is confirmed on the blockchain.

### Are there withdrawal fees?

Yes, most funds charge a small withdrawal fee (typically 0.1-0.5%). You also pay gas fees for the blockchain transaction.

### Can I withdraw partially?

Yes, you can withdraw any portion of your investment. You'll keep the remaining shares and continue earning returns on them.

## Security

### Is my investment secure?

Clearpool Finance uses multiple security layers:
- Audited smart contracts
- Multi-signature controls
- Timelock mechanisms
- Complete transparency
- On-chain verification

See [Funds Control](/docs/security/funds-control) for detailed security information.

### Who controls my funds?

You do! Funds are held in smart contracts, not by a central entity. You maintain full control and can withdraw at any time.

### What happens if a smart contract has a bug?

All contracts are audited before deployment. If a vulnerability is discovered:
- Emergency pause mechanisms can freeze affected contracts
- Bug bounty programs reward responsible disclosure
- Insurance may cover losses in extreme cases

### Are the contracts audited?

Yes, all smart contracts undergo rigorous security audits before deployment. Audit reports will be published on our website.

## Technical Questions

### What are the contract addresses?

Contract addresses will be published after mainnet deployment. For testnet, check the [Contracts](/docs/contracts) documentation.

### Can I verify transactions on a block explorer?

Yes! All transactions are on-chain and can be verified on block explorers like Etherscan or Mantle Explorer.

### How do I integrate with Clearpool Finance contracts?

See our [Contracts](/docs/contracts) documentation for integration guides and SDK usage.

### Where can I find the smart contract source code?

Source code will be available on GitHub and verified on block explorers.

## Troubleshooting

### My transaction failed. What should I do?

Common reasons for failed transactions:
- Insufficient gas: Increase gas limit
- Insufficient balance: Ensure you have enough tokens
- Network issues: Check blockchain status
- Contract paused: Check if contract is paused

### I can't see my investment in my portfolio.

- Ensure your wallet is connected
- Check you're on the correct network
- Refresh the page
- Check transaction status on block explorer

### The NAV seems incorrect.

NAV is calculated in real-time. If it seems off:
- Check recent market movements
- Verify oracle price feeds
- Check for recent large transactions in the fund
- Contact support if persistent issues

### I can't connect my wallet.

- Ensure your wallet extension is installed and unlocked
- Try refreshing the page
- Try disconnecting and reconnecting
- Try a different browser
- Clear browser cache

## Support

### Where can I get help?

- **Documentation**: Check our comprehensive docs
- **Discord**: Join our community Discord
- **GitHub**: Open an issue for technical questions
- **Email**: Contact support@clearpool.finance

### How do I report a bug?

- Open an issue on GitHub
- Describe the bug clearly
- Include steps to reproduce
- Add screenshots if relevant

### Can I suggest a feature?

Yes! We welcome feature suggestions:
- Open a discussion on GitHub
- Post in our Discord
- Contact us directly

## Additional Resources

- [Get Started Guide](/docs/get-started)
- [Features Overview](/docs/features)
- [NAV Calculation](/docs/important-concepts/calculating-nav)
- [Withdrawal Guide](/docs/important-concepts/withdrawal-management)
- [Security Information](/docs/security/funds-control)
- [Smart Contracts](/docs/contracts)

---

Still have questions? Join our [Discord community](https://discord.gg/clearpool) or [contact support](mailto:support@clearpool.finance).
