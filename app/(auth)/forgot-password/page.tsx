import { ForgotPasswordForm } from "@/components/forgot-password-form"
import logo1 from "@/public/foodatlas_LOGOS-09.svg"
import logo2 from "@/public/foodatlas_LOGOS_Prancheta 1 cópia 3.svg"
export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">  
      
      <div className="flex flex-1 flex-col items-center gap-4 justify-center">        
        
        <img
          src={logo1.src}
          alt="Custom Icon"
          className="h-14 w-14"
        />                                   
        <div className="w-full max-w-xs">
          <ForgotPasswordForm />
        </div>      

      </div>
      
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 z-10 bg-black flex items-center justify-center">
          <img
            src={logo2.src}
            alt="Logo"
            className="h-auto w-auto object-contain"
          />
        </div>
      </div>

    </div>
  )
}
