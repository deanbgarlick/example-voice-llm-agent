import React, { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface Message {
  id: string
  role: "user" | "assistant"
  text: string
  status?: string
  timestamp: string
  isFinal?: boolean
}

interface ConversationSectionProps {
  conversation: Message[]
}

export function ConversationSection({ conversation }: ConversationSectionProps) {
  const conversationRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of conversation when it updates
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight
    }
  }, [conversation])

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h2 className="text-xl font-semibold">Conversation</h2>
        <div ref={conversationRef} className="h-[200px] overflow-y-auto">
          {conversation.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-2`}>
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {msg.text}
                {msg.status === "speaking" && <span className="ml-2 animate-pulse">●</span>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
