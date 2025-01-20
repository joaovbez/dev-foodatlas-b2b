export function emailVerificationTemplate({ code }: { code: string }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; text-align: center;">Verifique seu email</h1>
      <p style="color: #666; text-align: center;">
        Use o código abaixo para verificar seu email no FoodAtlas:
      </p>
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${code}</span>
      </div>
      <p style="color: #666; text-align: center;">
        Este código expira em 30 minutos.
      </p>
    </div>
  `
} 