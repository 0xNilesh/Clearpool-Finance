import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { User, LogOut } from "lucide-react"

export default function AdminNavbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <Image
              src="/logo.png"
              alt="Clearpool Finance"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            Admin
          </Link>
          <div className="flex gap-4">
            <Button size="icon" variant="ghost">
              <User className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
