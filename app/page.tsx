"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Send, Edit3, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

const markdownToHtml = (markdown: string): string => {
  return markdown
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/^(?!<[h|l])/gm, '<p class="mb-2">')
    .replace(/<p class="mb-2">(<[h|l])/g, "$1")
}

export default function MeetingNotesSummarizer() {
  const [transcript, setTranscript] = useState("")
  const [customPrompt, setCustomPrompt] = useState(
    "Please summarize this meeting transcript, highlighting key decisions, action items, and important discussion points.",
  )
  const [summary, setSummary] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [email, setEmail] = useState("aish.work008@gmail.com")
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "text/plain") {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setTranscript(content)
        toast({
          title: "File uploaded successfully",
          description: "Your transcript has been loaded and is ready for processing.",
        })
      }
      reader.readAsText(file)
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt file containing your meeting transcript.",
        variant: "destructive",
      })
    }
  }

  const generateSummary = async () => {
    if (!transcript.trim()) {
      toast({
        title: "No transcript provided",
        description: "Please upload a transcript file or paste your meeting notes.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          customPrompt,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate summary")
      }

      const data = await response.json()
      setSummary(data.summary)
      toast({
        title: "Summary generated!",
        description: "Your meeting summary has been created successfully.",
      })
    } catch (error) {
      toast({
        title: "Error generating summary",
        description: "There was an issue processing your transcript. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const sendEmail = async () => {
    if (!email.trim() || !summary.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide an email address and generate a summary first.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          summary,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send email")
      }

      const data = await response.json()

      if (data.isSimulated) {
        toast({
          title: "Email simulated",
          description: data.message,
          variant: "default",
        })
      } else {
        toast({
          title: "Email sent!",
          description: `Meeting summary has been sent to ${email}`,
        })
      }
    } catch (error) {
      toast({
        title: "Error sending email",
        description: "There was an issue sending the email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">AI Meeting Notes Summarizer</h1>
          <p className="text-muted-foreground">Upload your meeting transcript and get an AI-powered summary</p>
        </div>

        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Transcript
            </CardTitle>
            <CardDescription>
              Upload a .txt file containing your meeting transcript or paste it directly below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Choose file</Label>
              <Input id="file-upload" type="file" accept=".txt" onChange={handleFileUpload} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="transcript">Or paste your transcript here</Label>
              <Textarea
                id="transcript"
                placeholder="Paste your meeting transcript here..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="min-h-[200px] mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Custom Prompt Section */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Instructions</CardTitle>
            <CardDescription>Customize how you want the AI to summarize your meeting</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter custom instructions for the AI..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Generate Summary Button */}
        <div className="flex justify-center">
          <Button
            onClick={generateSummary}
            disabled={isGenerating || !transcript.trim()}
            size="lg"
            className="w-full max-w-md"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Summary...
              </>
            ) : (
              "Generate AI Summary"
            )}
          </Button>
        </div>

        {/* Summary Section */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Generated Summary
                <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  {isEditing ? "Save" : "Edit"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} className="min-h-[300px]" />
              ) : (
                <div
                  className="bg-muted p-4 rounded-md prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(summary) }}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Email Sharing Section */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Share Summary
              </CardTitle>
              <CardDescription>Send the summary via email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Currently using Resend free tier - emails can only be sent to aish.work008@gmail.com. To send to other
                  recipients, verify a domain at resend.com/domains.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button onClick={sendEmail} disabled={isSending || !email.trim()} className="w-full">
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Summary
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
