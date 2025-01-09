import { ForgotPasswordForm } from "@/components/forgot-password-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">  
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <img
                src="foodatlas_LOGOS-09.svg"
                alt="Custom Icon"
                className="h-6 w-6"
              />
            </div>
            FoodAtlas
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <ForgotPasswordForm />
          </div>
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
