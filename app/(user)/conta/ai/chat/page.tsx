"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Send, Bot, Store, Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

import { BarChartMock } from "@/components/barchartmock"
import ReactMarkdown from 'react-markdown'

interface Restaurant {
  id: string
  name: string
  cnpj: string
}

interface Message {
  id: string;
  content: string;
  role: 'assistant' | 'user';
  timestamp: Date;
  chart?: boolean; // se true, exibir gráfico
}

export default function AIChatPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)  // ref para o elemento dummy no final do chat
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    content: 'Olá! Sou seu assistente de IA especializado em análise de dados. Como posso ajudar você a entender melhor o desempenho do seu restaurante hoje?',
    role: 'assistant',
    timestamp: new Date() 
  }])

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

  // Auto-scroll: sempre que messages mudar, o elemento dummy (bottomRef) é rolado para a vista
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const response = await fetch('/api/restaurants')
        if (!response.ok) {
          const errorData = await response.text()
          throw new Error(errorData)
        }
        const data = await response.json()
        setRestaurants(data)
        
        if (data.length > 0) {
          setSelectedRestaurant(data[0].id)
        }
      } catch (error) {
        console.error('Erro ao carregar restaurantes:', error)
        toast({
          variant: "destructive",
          title: "Erro",
          description: error instanceof Error ? error.message : "Não foi possível carregar seus restaurantes",
        })
      } finally {
        setLoading(false)
      }
    } 

    loadRestaurants()
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedRestaurant) return;
    
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("gráfico") || lowerMessage.includes("chart")) {
      // 1. Cria mensagem do usuário
      const userMessage: Message = {
        id: Date.now().toString(),
        content: message,
        role: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setMessage("");
  
      // 2. Ativa animação de digitação e, após 3 segundos, exibe o gráfico mock
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const chartMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "",
          role: "assistant",
          timestamp: new Date(),
          chart: true,
        }
        setMessages((prev) => [...prev, chartMessage]);
      }, 3000);
      return;
    }
    
    setIsTyping(true);
    try {
      // Mensagem do usuário
      const userMessage: Message = {
        id: Date.now().toString(),
        content: message,
        role: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
  
      // Chama o endpoint de chat (que retorna stream)
      const response = await fetch(`/api/restaurants/${selectedRestaurant}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.content }),
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: "Falha ao processar mensagem (stream)" };
        }
        throw new Error(errorData.error || 'Falha ao processar mensagem');
      }
  
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Não foi possível ler o stream do servidor.");
      }
  
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let finalText = "";
      const partialAssistantMsgId = "assistant-stream";
      setMessages(prev => [
        ...prev,
        {
          id: partialAssistantMsgId,
          content: "",
          role: "assistant",
          timestamp: new Date()
        }
      ]);
  
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunkValue = decoder.decode(value);
          finalText += chunkValue;
          setMessages(prev => {
            const updated = [...prev];
            const index = updated.findIndex((m) => m.id === partialAssistantMsgId);
            if (index !== -1) {
              updated[index] = {
                ...updated[index],
                content: updated[index].content + chunkValue,
              }
            }
            return updated;
          });
        }
      }
  
      setMessages(prev => {
        const updated = prev.filter((m) => m.id !== partialAssistantMsgId);
        updated.push({
          id: (Date.now() + 1).toString(),
          content: finalText,
          role: "assistant",
          timestamp: new Date()
        });
        return updated;
      });
  
    } catch (error) {
      console.error("Erro no streaming:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível processar sua mensagem: " + error,
      });
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="space-y-2 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (restaurants.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="rounded-lg border-2 border-dashed p-8 text-center">
          <Store className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium">Nenhum restaurante encontrado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Você precisa cadastrar um restaurante para usar o chat de IA
          </p>
          <Button onClick={() => (window.location.href = '/conta/restaurants/add')} className="mt-4">
            Adicionar Restaurante
          </Button>
        </div>
      </div>
    )
  }

  function RestaurantSelector({
    value,
    onValueChange,
    restaurants,
  }: {
    value: string
    onValueChange: (value: string) => void
    restaurants: Restaurant[]
  }) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            {restaurants.find(r => r.id === value)?.name || "Selecione um restaurante"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Seus Restaurantes</SelectLabel>
            {restaurants.map((restaurant) => (
              <SelectItem key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="lg:grid lg:grid-cols-[300px_1fr] gap-6 relative">
        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-4 space-y-4">
            <Card className="p-4 border-primary/20">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">Restaurante Selecionado</p>
                </div>
                <RestaurantSelector
                  value={selectedRestaurant}
                  onValueChange={setSelectedRestaurant}
                  restaurants={restaurants}
                />
              </div>
            </Card>

            <Card className="p-4 border-primary/20">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">Sugestões de Perguntas</p>
                </div>
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  <div className="space-y-4 pr-4">
                    {suggestions.map((category, idx) => (
                      <div key={idx} className="space-y-2">
                        <h3 className="flex items-center gap-2 font-medium text-sm text-primary">
                          <span>{category.icon}</span>
                          {category.title}
                        </h3>
                        <div className="space-y-1.5">
                          {category.questions.map((question, qIdx) => (
                            <Button
                              key={qIdx}
                              variant="ghost"
                              className="w-full justify-start h-auto py-2 px-3 text-sm font-normal text-left whitespace-normal hover:bg-primary/10 hover:text-primary"
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
            </Card>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex flex-col h-[calc(100vh-2rem)]">
          <Card className="p-4 mb-4 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot className="w-8 h-8 text-primary" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">Assistente IA</h1>
                <p className="text-sm text-muted-foreground">Análise inteligente de dados</p>
              </div>
            </div>
          </Card>

          {/* Sugestões móveis */}
          <div className="lg:hidden space-y-4 mb-4">
            <Card className="p-4 border-primary/20">
              <RestaurantSelector
                value={selectedRestaurant}
                onValueChange={setSelectedRestaurant}
                restaurants={restaurants}
              />
            </Card>

            <Card className="p-4 border-primary/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.flatMap(cat => cat.questions).slice(0, 4).map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start h-auto py-2 px-3 text-sm hover:bg-primary/10 hover:text-primary"
                    onClick={() => setMessage(suggestion)}
                  >
                    <span className="line-clamp-2 text-left">{suggestion}</span>
                  </Button>
                ))}
              </div>
            </Card>
          </div>

          <Card className="flex-1 mb-4 border-primary/20 relative overflow-hidden">
            <ScrollArea className="h-full">
              <div ref={scrollRef} className="flex flex-col gap-4 p-4">
                {messages.map((msg) => {
                  const isAssistant = msg.role === "assistant";
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                    >
                      {isAssistant && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div
                        className={`rounded-lg p-3 max-w-[80%] ${
                          isAssistant
                            ? "bg-muted/50"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {msg.chart ? (
                          <div className="text-sm">
                            <BarChartMock />
                          </div>
                        ) : (
                          <ReactMarkdown
                            components={{
                              h1: ({...props }) => <h1 className="text-2xl font-bold my-2" {...props} />,
                              h2: ({...props }) => <h2 className="text-xl font-semibold my-2" {...props} />,
                              h3: ({...props }) => <h3 className="text-lg font-semibold my-2" {...props} />,
                              ul: ({...props }) => <ul className="list-disc list-inside my-2" {...props} />,
                              li: ({...props }) => <li className="ml-4 mb-1" {...props} />,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-xs text-primary-foreground">EU</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary animate-pulse" />
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                {/* Elemento dummy para auto-scroll */}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
          </Card>

          <Card className="border-primary/20 p-2">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                placeholder="Digite sua pergunta..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!message.trim()} className="bg-primary hover:bg-primary/90">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
