export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const response = await fetch(
      'https://lebbwqejvqdenzytubpp.supabase.co/functions/v1/read-pdf',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(body)
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Edge function error: ${response.status} ${response.statusText}\n${errorText}`)
    }
    
    const data = await response.json()
    return Response.json(data)
  } catch (error: any) {
    console.error('PDF processing error:', error)
    return Response.json(
      { error: error.message || 'Failed to process PDF' },
      { status: 500 }
    )
  }
}