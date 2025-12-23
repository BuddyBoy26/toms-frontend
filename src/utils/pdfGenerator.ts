// src/utils/pdfGenerator.ts

const API_BASE = "https://mlkkk63swrqairyiahlk357sui0argkn.lambda-url.ap-south-1.on.aws"
// const API_BASE = "awslink"

export const generatePDF = async (payload: any, mode: 'preview' | 'download' = 'download', filename: string = 'report.pdf') => {
  const res = await fetch(`${API_BASE}/render.pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("PDF API error:", err)
    throw new Error(err || "PDF generation failed")
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)

  if (mode === 'preview') {
    window.open(url, "_blank")
  } else {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}