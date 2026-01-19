"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"
type Step = "email" | "cpf" | "password" | "otp"
type OtpMethod = "email" | "whatsapp"

const allowCpfCnpj = process.env.NEXT_PUBLIC_UI_ALLOW_CPF_CNPJ === "true"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/app'
  const [step, setStep] = React.useState<Step>("email")
  const [identifier, setIdentifier] = React.useState("")
  const [identifierType, setIdentifierType] = React.useState<"email" | "cpf">("email")
  const [password, setPassword] = React.useState("")
  const [otpMethod, setOtpMethod] = React.useState<OtpMethod>("email")
  const [otpValue, setOtpValue] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState("")

  function handleBack() {
    if (step === "password" || step === "otp") {
      setStep(identifierType)
    }
  }

  function handleContinueToPassword() {
    if (identifier.trim()) {
      setStep("password")
    }
  }

  function handleSwitchToEmail() {
    setIdentifier("")
    setIdentifierType("email")
    setStep("email")
  }

  function handleSwitchToCpf() {
    setIdentifier("")
    setIdentifierType("cpf")
    setStep("cpf")
  }

  async function handleSendOtp(method: OtpMethod) {
    if (method === "whatsapp") {
      setError("OTP via WhatsApp ainda nao disponivel")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao enviar codigo')
        setIsLoading(false)
        return
      }

      setOtpMethod(method)
      setOtpValue("")
      setStep("otp")
    } catch (err) {
      setError('Erro de conexao. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogin() {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Erro ao fazer login')
        setIsLoading(false)
        return
      }

      // Full page refresh to ensure cookies are sent
      window.location.href = callbackUrl
    } catch (err) {
      setError('Erro de conexao. Tente novamente.')
      setIsLoading(false)
    }
  }

  async function handleVerifyOtp() {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, code: otpValue }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        const errorMsg = data.error || 'Codigo invalido'
        const attemptsMsg = data.attemptsRemaining !== undefined
          ? ` (${data.attemptsRemaining} tentativas restantes)`
          : ''
        setError(errorMsg + attemptsMsg)
        setIsLoading(false)
        return
      }

      // Full page refresh to ensure cookies are sent
      window.location.href = callbackUrl
    } catch (err) {
      setError('Erro de conexao. Tente novamente.')
      setIsLoading(false)
    }
  }

  // Tela #1: Email
  if (step === "email") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Bem-vindo</CardTitle>
            <CardDescription className="text-center">
              Entre com seu email para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleContinueToPassword()}
                autoFocus
              />
            </div>
            <Button
              className="w-full"
              onClick={handleContinueToPassword}
              disabled={!identifier.trim()}
            >
              Continuar
            </Button>
            {allowCpfCnpj && (
              <div className="text-center">
                <Button variant="link" onClick={handleSwitchToCpf}>
                  Entrar com CPF/CNPJ
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela #2: CPF/CNPJ
  if (step === "cpf" && allowCpfCnpj) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Bem-vindo</CardTitle>
            <CardDescription className="text-center">
              Entre com seu CPF ou CNPJ para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF/CNPJ</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleContinueToPassword()}
                autoFocus
              />
            </div>
            <Button
              className="w-full"
              onClick={handleContinueToPassword}
              disabled={!identifier.trim()}
            >
              Continuar
            </Button>
            <div className="text-center">
              <Button variant="link" onClick={handleSwitchToEmail}>
                Entrar com email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela #3: Senha
  if (step === "password") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit -ml-2 mb-2"
              onClick={handleBack}
              tabIndex={-1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <CardTitle className="text-2xl font-bold text-center">Digite sua senha</CardTitle>
            <CardDescription className="text-center">
              {identifier}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="pr-10"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onMouseDown={() => setShowPassword(true)}
                  onMouseUp={() => setShowPassword(false)}
                  onMouseLeave={() => setShowPassword(false)}
                  onTouchStart={() => setShowPassword(true)}
                  onTouchEnd={() => setShowPassword(false)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button
              className="w-full"
              onClick={handleLogin}
              disabled={isLoading || !password}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="space-y-2 pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Outras formas de autenticar
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleSendOtp("email")}
                >
                  Código via email
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleSendOtp("whatsapp")}
                >
                  Código via WhatsApp
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela #4: OTP
  if (step === "otp") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit -ml-2 mb-2"
              onClick={() => setStep("password")}
              tabIndex={-1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <CardTitle className="text-2xl font-bold text-center">Digite o código</CardTitle>
            <CardDescription className="text-center">
              Enviamos um código para {otpMethod === "email" ? "seu email" : "seu WhatsApp"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Codigo</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpValue}
                  onChange={(value) => setOtpValue(value)}
                  disabled={isLoading}
                  autoFocus
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button
              className="w-full"
              onClick={handleVerifyOtp}
              disabled={isLoading || otpValue.length < 6}
            >
              {isLoading ? "Verificando..." : "Verificar"}
            </Button>
            <div className="text-center">
              <Button variant="link" onClick={() => setStep("password")}>
                Entrar com senha
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
