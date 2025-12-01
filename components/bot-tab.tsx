"use client"

import { MessageCircleIcon, SendIcon } from "@/components/icons"
import { useState } from "react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { 
  MiniKit, 
  tokenToDecimals, 
  Tokens, 
  PayCommandInput 
} from "@worldcoin/minikit-js"

// Simple markdown renderer for basic formatting
function renderMarkdown(text: string): React.ReactNode {
  // Process text character by character to handle nested formatting
  const processText = (str: string, startIdx: number = 0): React.ReactNode[] => {
    const result: React.ReactNode[] = []
    let i = startIdx
    let keyCounter = 0
    
    while (i < str.length) {
      // Check for bold: **text** or __text__
      if ((str[i] === '*' && str[i + 1] === '*') || (str[i] === '_' && str[i + 1] === '_')) {
        const marker = str.substring(i, i + 2)
        const endIndex = str.indexOf(marker, i + 2)
        
        if (endIndex !== -1) {
          // Add text before bold
          if (i > startIdx) {
            result.push(str.substring(startIdx, i))
          }
          
          // Recursively process content inside bold (for nested formatting)
          const boldContent = processText(str.substring(i + 2, endIndex), 0)
          result.push(<strong key={`bold-${keyCounter++}`}>{boldContent}</strong>)
          
          i = endIndex + 2
          startIdx = i
          continue
        }
      }
      
      i++
    }
    
    // Add remaining text
    if (startIdx < str.length) {
      result.push(str.substring(startIdx))
    }
    
    return result
  }
  
  const processed = processText(text)
  return processed.length > 0 ? <>{processed}</> : text
}

// Payment wallet address
const PAYMENT_WALLET = "0x07376EAaE128ED29ef9fF00317131Ac1C4aBaC33"

export function BotTab() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const processPayment = async (): Promise<boolean> => {
    // Check if MiniKit is installed
    let isInstalled = false
    try {
      if (typeof MiniKit === 'undefined' || !MiniKit || typeof MiniKit.isInstalled !== 'function') {
        alert("Please open this app in World App to ask questions.")
        return false
      }
      isInstalled = MiniKit.isInstalled()
    } catch (error) {
      alert("Please open this app in World App to ask questions.")
      return false
    }

    if (!isInstalled) {
      alert("Please open this app in World App to ask questions.")
      return false
    }

    try {
      // Step 1: Initiate payment and get reference ID
      const initiateRes = await fetch('/api/initiate-payment', {
        method: 'POST',
      })
      
      if (!initiateRes.ok) {
        throw new Error('Failed to initiate payment')
      }
      
      const { id } = await initiateRes.json()

      // Step 2: Prepare payment payload
      // 0.01 USDC payment
      const payload: PayCommandInput = {
        reference: id,
        to: PAYMENT_WALLET,
        tokens: [
          {
            symbol: Tokens.USDC,
            token_amount: tokenToDecimals(0.01, Tokens.USDC).toString(),
          },
        ],
        description: 'Ask a question about manhood - 0.01 USDC',
      }

      // Step 3: Send payment command
      const { finalPayload } = await MiniKit.commandsAsync.pay(payload)

      if (finalPayload.status === 'success') {
        // Step 4: Verify payment on backend
        const confirmRes = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: finalPayload }),
        })
        
        const payment = await confirmRes.json()
        
        if (payment.success) {
          // Payment successful!
          return true
        } else {
          throw new Error(payment.error || 'Payment verification failed')
        }
      } else {
        throw new Error(finalPayload.detail || 'Payment was cancelled or failed')
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      alert(error.message || 'Payment failed. Please try again.')
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)

    // First, process payment before sending the question
    const paymentSuccess = await processPayment()
    
    if (!paymentSuccess) {
      setIsLoading(false)
      return
    }

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

    try {
      // Call the API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error:", response.status, errorText)
        
        // Handle specific error cases
        if (response.status === 503) {
          throw new Error("Service temporarily unavailable. Please check your connection and try again.")
        }
        
        // Truncate very long error messages (like HTML error pages)
        const shortError = errorText.length > 200 
          ? errorText.substring(0, 200) + '...' 
          : errorText
        
        throw new Error(`Failed to get response: ${response.status}. ${shortError}`)
      }

      // Handle text streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ""

      // Add assistant message placeholder
      setMessages((prev) => [...prev, { role: "assistant", content: "" }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          assistantMessage += chunk
          
          // Update the last message (assistant message) with accumulated text
          setMessages((prev) => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1].content = assistantMessage
            return newMessages
          })
        }
      }
    } catch (error) {
      console.error("Error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="space-y-2 pb-4">
        <h2 className="text-2xl font-bold">Be a MAN and ask questions</h2>
        <p className="text-base text-muted-foreground leading-relaxed">Ask questions and get personalized guidance (0.01 USDC per question)</p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <MessageCircleIcon className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Start a conversation with the bot</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] p-3 rounded-lg ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-3 rounded-lg bg-muted text-foreground">
              <p className="text-sm leading-relaxed">Thinking...</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder="Type your message..."
          className="min-h-[80px] resize-none"
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          size="icon"
          className="h-[80px] w-12 shrink-0"
        >
          <SendIcon className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
