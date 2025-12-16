'use client'
import React, { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error) {
      router.push('/admin')
      router.refresh()
    } else {
      setErrorMsg(error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-teal-900 mb-2 text-center">FitJourney Admin</h1>
        <p className="text-gray-500 text-center mb-6 text-sm">Acesso restrito a administradores</p>
        
        {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-200">
                {errorMsg}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 outline-none"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 outline-none"
              required 
            />
          </div>
          <button type="submit" className="w-full bg-teal-900 text-white py-3 rounded-lg hover:bg-teal-800 transition font-bold">
            Entrar no Painel
          </button>
        </form>
      </div>
    </div>
  )
}