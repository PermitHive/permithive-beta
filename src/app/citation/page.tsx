'use client'

import React, { useState, useEffect, useRef } from 'react'

const decryptText = (hash: string): string => {
  try {
    const decodedHash = decodeURIComponent(hash)
    const decodedText = atob(decodedHash)
    return decodeURIComponent(decodedText)
  } catch (err) {
    console.error('Decryption error:', err)
    return 'Invalid encrypted text'
  }
}

export default function CitationPage() {
  const [citation, setCitation] = useState<string>('')
  const [error, setError] = useState<string>('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Adjust textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [citation])

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const encryptedText = urlParams.get('text')
      
      if (encryptedText) {
        const decryptedText = decryptText(encryptedText)
        setCitation(decryptedText)
      } else {
        setError('No citation text provided. Add ?text=EncryptedText to the URL.')
      }
    } catch (err) {
      setError('Error parsing citation: ' + (err instanceof Error ? err.message : String(err)))
    }
  }, [])

  return (
    <div className="p-8">
      <div className="min-h-screen max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-heading font-bold animate-fadeIn">
          Citation
        </h1>
        <div className="animate-slideIn animation-delay-300">
          <div className="rounded-lg border bg-card p-6 shadow-custom-md">
            <textarea
              ref={textareaRef}
              value={citation}
              readOnly
              className="w-full bg-background/50 rounded-md p-4 text-foreground resize-none overflow-hidden"
              aria-label="Citation text"
              style={{ minHeight: '0' }}
            />
            {error && (
              <p className="mt-2 text-destructive text-sm">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
 