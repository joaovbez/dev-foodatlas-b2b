"use client"

import { ResetPasswordForm } from "@/components/reset-password-form"
import logo_1 from "@/public/foodatlas_LOGOS-09.svg"
import logo_2 from "@/public/foodatlas_LOGOS_Prancheta 1 cópia 3.svg"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function Page() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) {
      toast({
        variant: "destructive",
        title: "Link inválido",
        description: "Este link de recuperação de senha é inválido ou expirou.",
      })
      router.push("/login")
    }
  }, [searchParams, router, toast])

  return (
    <div className="grid min-h-svh lg:grid-cols-2">  
      
      <div className="flex flex-1 flex-col items-center gap-4 justify-center">        
        
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-black text-primary-foreground">
          <img
            src={logo_1.src}
            alt="Custom Icon"
            className="h-14 w-14"
          />
        </div>                                    
        <div className="w-full max-w-xs">
          <ResetPasswordForm />
        </div>      

      </div>
      
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 z-10 bg-black flex items-center justify-center">
          <img
            src={logo_2.src}
            alt="Logo"
            className="h-auto w-auto object-contain"
          />
        </div>
      </div>

    </div>
  )
} 