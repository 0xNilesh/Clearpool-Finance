import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-foreground text-background relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold mb-4">
              <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center text-foreground font-bold text-xs">
                C
              </div>
              <span>Clearpool</span>
            </div>
            <p className="text-sm opacity-80">Decentralized investing made simple and transparent.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link href="#" className="hover:text-primary transition">
                  Vaults
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition">
                  Strategies
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link href="#" className="hover:text-primary transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link href="#" className="hover:text-primary transition">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition">
                  Docs
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/20 pt-8 text-center text-sm opacity-70">
          <p>&copy; 2026 Clearpool Finance. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
