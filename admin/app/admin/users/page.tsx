import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function UsersPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createServerComponentClient({ cookies })
  const query = searchParams.q || ''

  let dbQuery = supabase
    .from('profiles')
    .select('id, name, level, is_premium, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  if (query) {
    dbQuery = dbQuery.ilike('name', `%${query}%`)
  }

  const { data: users } = await dbQuery

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
        <form className="flex gap-2">
            <input 
                name="q"
                placeholder="Buscar por nome..." 
                className="border border-gray-300 rounded-lg px-4 py-2"
                defaultValue={query}
            />
            <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg">Buscar</button>
        </form>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                <tr>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Nível</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Cadastro</th>
                    <th className="px-6 py-4">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {users?.map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{user.name}</td>
                        <td className="px-6 py-4">Lvl {user.level}</td>
                        <td className="px-6 py-4">
                            {user.is_premium ? (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">PREMIUM</span>
                            ) : (
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">FREE</span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                            <button className="text-teal-600 font-medium hover:underline">Detalhes</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  )
}