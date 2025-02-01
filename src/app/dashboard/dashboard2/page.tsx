'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import AuthError from '@/components/auth-error'
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Dashboard() {
  const [hash, setHash] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirect to login if there's no session
        router.push('/login');
        return;
      }

      setHash(window.location.hash);
      setIsLoading(false);
    };

    checkUser();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (hash.includes('error')) {
    return (
      <AuthError />
    )
  }

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Your dashboard content */}
    </div>
  )
}