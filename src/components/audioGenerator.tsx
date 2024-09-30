'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Download, Play } from "lucide-react"

export default function AudioGenerator() {
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Check if text input is empty
    if (!text.trim()) {
      setError('Text is required to generate audio.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      console.log("API Response Status:", response.status)
      const data = await response.json()
      console.log("API Response Data:", data)

      if (!response.ok) {
        throw new Error(`Failed to generate audio. Status: ${response.status}`)
      }

      setAudioUrl(`/api/audio/${data.fileName}`)
    } catch (err) {
      setError('An error occurred while generating the audio.')
      console.error("Error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <a className="flex items-center justify-center" href="#">
          <span className="sr-only">Audio Generator</span>
          <Play className="h-6 w-6" />
          <span className="ml-2 text-lg font-semibold">Audio Generator</span>
        </a>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Generate Audio from Text
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Enter your text below and we'll convert it to speech using advanced AI technology.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
                  <Textarea
                    placeholder="Enter your text here"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Audio
                      </>
                    ) : (
                      'Generate Audio'
                    )}
                  </Button>
                </form>
              </div>
              {error && (
                <p className="text-red-500">{error}</p>
              )}
              {audioUrl && (
                <div className="flex flex-col items-center space-y-2">
                  <audio controls src={audioUrl} className="w-full max-w-md" />
                  <a
                    href={audioUrl}
                    download
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Audio
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 Audio Generator. All rights reserved.</p>
      </footer>
    </div>
  )
}
