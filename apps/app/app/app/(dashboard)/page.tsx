import { type Metadata } from "next"
import Link from "next/link"
import { BoxesIcon, SettingsIcon, ActivityIcon, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BreadcrumbBar } from "@/components/breadcrumb-bar"

export const metadata: Metadata = {
  title: "Início",
  description: "Plataforma base para desenvolvimento de aplicações",
}

export default function AppHomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <BreadcrumbBar
        items={[]}
        currentPage="Início"
      />

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="flex max-w-lg flex-col items-center gap-6 text-center">
          {/* Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <BoxesIcon className="h-8 w-8 text-muted-foreground" />
          </div>

          {/* Title and Description */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Plataforma Pronta
            </h1>
            <p className="text-muted-foreground">
              Esta é uma base estruturada para desenvolvimento.
              A infraestrutura está configurada — autenticação, navegação,
              temas e componentes. O próximo passo é construir as funcionalidades
              do seu produto.
            </p>
          </div>

          {/* Infrastructure Card */}
          <Card className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Infraestrutura disponível</CardTitle>
              <CardDescription>
                Recursos prontos para uso
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Autenticação e sessões
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Sistema de navegação
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Componentes UI (shadcn)
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Temas claro/escuro
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Layout responsivo
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                Perfil
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/settings">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/system/health">
                <ActivityIcon className="mr-2 h-4 w-4" />
                Status do Sistema
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
