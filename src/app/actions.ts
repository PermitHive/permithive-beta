"use server";

interface AnalyzeDocumentResponse {
  analysis?: string;
  error?: string;
}

export async function analyzeDocument(
  text: string
): Promise<AnalyzeDocumentResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error analyzing document:", error);
    return {
      error: "Failed to analyze document. Please try again.",
    };
  }
}
