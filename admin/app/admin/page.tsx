import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Users, TrendingUp, CreditCard, DollarSign } from 'lucide-react'

export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies })
  
  // Queries reais (seguras via RLS de admin)
  const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: premiumCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active')
  
  // Dados mockados para exemplo visual
  const mrr = (premiumCount || 0) * 9.99
  const affiliateRevenue = 1250.00

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Geral</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Total Usuários" value={usersCount || 0} icon={<Users className="text-blue-500" />} />
        <Card title="Assinantes Premium" value={premiumCount || 0} icon={<CreditCard className="text-gold-500" />} />
        <Card title="MRR Estimado" value={`R$ ${mrr.toFixed(2)}`} icon={<TrendingUp className="text-green-500" />} />
        <Card title="Receita Afiliados" value={`R$ ${affiliateRevenue.toFixed(2)}`} icon={<DollarSign className="text-purple-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Tabela Recente */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-lg mb-4">Últimos Usuários Cadastrados</h3>
            <div className="space-y-3">
                <p className="text-gray-500 text-sm">Carregando dados em tempo real...</p>
                {/* Aqui viria uma lista mapeada */}
            </div>
         </div>

         {/* Afiliados Top */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-lg mb-4">Top Parceiros (Mês)</h3>
            <div className="flex justify-between items-center border-b py-2">
                <span>Growth Supplements</span>
                <span className="font-bold text-teal-700">R$ 850,00</span>
            </div>
            <div className="flex justify-between items-center border-b py-2">
                <span>Amazon</span>
                <span className="font-bold text-teal-700">R$ 320,00</span>
            </div>
         </div>
      </div>
    </div>
  )
}

function Card({ title, value, icon }: { title: string, value: string | number, icon: any }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
        </div>
    )
}