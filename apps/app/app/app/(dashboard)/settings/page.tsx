import { type Metadata } from "next"
import { Settings } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { BreadcrumbBar } from "@/components/breadcrumb-bar"

export const metadata: Metadata = {
  title: "Configurações",
  description: "Configurações do sistema",
}

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <BreadcrumbBar
        items={[
          { label: "Início", href: "/app" },
        ]}
        currentPage="Configurações"
      />

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Settings className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              Configurações
            </h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Em breve você poderá gerenciar as configurações do sistema aqui.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
