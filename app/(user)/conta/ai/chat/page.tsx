'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Send, Bot, Store, Sparkles } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function AIChatPage() {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const suggestions = [
    {
      icon: "📊",
      title: "Análise de Vendas",
      questions: [
        "Qual foi o produto mais vendido na última semana?",
        "Qual é o ticket médio do restaurante?",
      ]
    },
    {
      icon: "⏰",
      title: "Análise de Tempo",
      questions: [
        "Qual é o melhor horário de vendas?",
        "Quais dias da semana têm maior faturamento?",
      ]
    },
    {
      icon: "💰",
      title: "Análise Financeira",
      questions: [
        "Qual categoria de produtos tem melhor margem de lucro?",
        "Quais produtos têm baixa rotatividade?",
      ]
    }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setIsTyping(true)
    // Simular resposta após 1 segundo
    setTimeout(() => setIsTyping(false), 1000)
  }

  return (
    <div className="container mx-auto p-4">
      <div className="lg:grid lg:grid-cols-[280px_1fr] gap-6 relative">
        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-4 max-h-[calc(100vh-2rem)]">
            <Card className="p-4 mb-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Store className="w-4 h-4 text-primary" />
                <p className="text-muted-foreground text-sm font-medium">
                  Restaurante Selecionado
                </p>
              </div>
              <p className="text-sm font-medium truncate">Nome do Restaurante</p>
            </Card>

            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="space-y-4 pr-4">
                {suggestions.map((category, idx) => (
                  <div key={idx} className="space-y-2">
                    <h3 className="flex items-center gap-2 font-medium text-sm">
                      <span>{category.icon}</span>
                      {category.title}
                    </h3>
                    <div className="space-y-1">
                      {category.questions.map((question, qIdx) => (
                        <Button
                          key={qIdx}
                          variant="ghost"
                          className="w-full justify-start h-auto py-2 px-3 text-sm font-normal text-left whitespace-normal hover:bg-muted"
                          onClick={() => setMessage(question)}
                        >
                          <span className="line-clamp-2">{question}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex flex-col h-[calc(100vh-2rem)]">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-6 h-6 text-primary shrink-0" />
            <h1 className="text-xl font-bold truncate">Assistente de Inteligência de Negócio</h1>
          </div>

          {/* Sugestões móveis */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {suggestions.flatMap(cat => cat.questions).map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start h-auto py-2 px-3 text-sm"
                onClick={() => setMessage(suggestion)}
              >
                <span className="line-clamp-2 text-left">{suggestion}</span>
              </Button>
            ))}
          </div>

          <div className="flex-1 mb-4 border rounded-lg overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <Bot className="w-6 h-6 text-primary shrink-0" />
                  <div className="bg-muted/50 rounded-lg p-3 max-w-[80%]">
                    <p className="text-sm">
                      Olá! Sou seu assistente de IA especializado em análise de dados.
                      Como posso ajudar você a entender melhor o desempenho do seu restaurante hoje?
                    </p>
                  </div>
                </div>

                {isTyping && (
                  <div className="flex gap-3">
                    <Bot className="w-6 h-6 text-primary animate-pulse shrink-0" />
                    <div className="bg-muted/50 rounded-lg p-3">
                      <Sparkles className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Digite sua pergunta..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!message.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
