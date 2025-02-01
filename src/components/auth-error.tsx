'use client'

import { useRouter } from 'next/navigation'

const AuthError = () => {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-gray-600 mb-6">
          There was a problem with your authentication. This could be due to an expired session or invalid credentials.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Return to Login
        </button>
      </div>
    </div>
  )
}

export default AuthError


