import './globals.css'
import Link from 'next/link'
import { LayoutDashboard, Users, ShoppingBag, Settings, LogOut } from 'lucide-react'

export const metadata = {
  title: 'FitJourney Admin',
  description: 'Painel Administrativo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-100 min-h-screen flex">
        {/* Sidebar Simplificada */}
        <aside className="w-64 bg-teal-900 text-white flex flex-col fixed h-full z-10">
            <div className="p-6 border-b border-teal-800">
                <h1 className="font-bold text-xl text-white">FitJourney <span className="text-gold-500">ADMIN</span></h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <NavItem href="/admin" icon={<LayoutDashboard size={20}/>} label="Dashboard" />
                <NavItem href="/admin/users" icon={<Users size={20}/>} label="Usuários" />
                <NavItem href="/admin/affiliates" icon={<ShoppingBag size={20}/>} label="Afiliados" />
                <NavItem href="/admin/settings" icon={<Settings size={20}/>} label="Configurações" />
            </nav>
            <div className="p-4 border-t border-teal-800">
                <Link href="/admin/login" className="flex items-center gap-3 text-red-400 hover:text-red-300 transition px-4 py-2">
                    <LogOut size={20} /> Sair
                </Link>
            </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
            {children}
        </main>
      </body>
    </html>
  )
}

function NavItem({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
    return (
        <Link href={href} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-teal-800 text-gray-300 hover:text-white transition">
            {icon}
            <span className="font-medium">{label}</span>
        </Link>
    )
}