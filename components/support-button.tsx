"use client"

import type { FC } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"

interface WhatsAppButtonProps {
  phoneNumber: string
  message?: string
  size?: "sm" | "default" | "lg" | "icon" | "support"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export const WhatsAppButton: FC<WhatsAppButtonProps> = ({
  phoneNumber,
  message = "",
  size = "icon",
  variant = "default",
}) => {
  const handleClick = () => {
    const formattedPhone = phoneNumber.replace(/\D/g, "")
    const whatsappUrl = `https://wa.me/${formattedPhone}${message ? `?text=${encodeURIComponent(message)}` : ""}`
    window.open(whatsappUrl, "_blank")
  }

  return (
    <Button
      onClick={handleClick}
      size={size}
      variant={variant}
      className="rounded-full aspect-square flex items-center justify-center"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="sr-only">Contato via WhatsApp</span>
    </Button>
  )
}

