import { ForgotPasswordForm } from "@/components/forgot-password-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">  
      
      <div className="flex flex-1 flex-col items-center gap-4 justify-center">        
        
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
          <img
           src="foodatlas_LOGOS-09.svg"
            alt="Custom Icon"
            className="h-14 w-14"
           />
        </div>                                    
        <div className="w-full max-w-xs">
          <ForgotPasswordForm />
        </div>      

      </div>
      
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 z-10 bg-black flex items-center justify-center">
          <img
            src="foodatlas_LOGOS_Prancheta 1 cópia 3.svg"
            alt="Logo"
            className="h-auto w-auto object-contain"
          />
        </div>
      </div>

    </div>
  )
}
