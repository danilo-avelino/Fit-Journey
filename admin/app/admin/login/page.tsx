'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (!error) {
      router.push('/admin')
      router.refresh()
    } else {
      alert('Erro ao logar: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h1 className="text-2xl font-bold text-teal-900 mb-6 text-center">Admin Console</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              required 
            />
          </div>
          <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 transition">
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}