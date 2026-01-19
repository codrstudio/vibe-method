"use client"

import { Variable } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TemplateVariable {
  key: string
  label: string
  example?: string
  required?: boolean
}

interface VariablePickerProps {
  variables: TemplateVariable[]
  onInsert: (variable: string) => void
}

export function VariablePicker({ variables, onInsert }: VariablePickerProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Variable className="h-4 w-4" />
          Variaveis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {variables.map((variable) => (
          <TooltipProvider key={variable.key} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 font-mono text-xs"
                  onClick={() => onInsert(`{{${variable.key}}}`)}
                >
                  <span className="rounded bg-muted px-1 py-0.5">
                    {`{{${variable.key}}}`}
                  </span>
                  {variable.required && (
                    <span className="text-destructive">*</span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{variable.label}</p>
                  {variable.example && (
                    <p className="text-xs text-muted-foreground">
                      Exemplo: {variable.example}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        {/* Global variables */}
        <div className="mt-3 border-t pt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Variaveis globais
          </p>
          {[
            { key: "app_name", label: "Nome do app" },
            { key: "app_url", label: "URL do app" },
            { key: "current_year", label: "Ano atual" },
            { key: "support_email", label: "Email de suporte" },
          ].map((v) => (
            <Button
              key={v.key}
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 font-mono text-xs"
              onClick={() => onInsert(`{{${v.key}}}`)}
            >
              <span className="rounded bg-muted px-1 py-0.5">
                {`{{${v.key}}}`}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
