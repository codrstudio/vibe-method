import Ajv from 'ajv'
import addFormats from 'ajv-formats'

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// Mapeamento de campos para nomes amigáveis
const fieldLabels: Record<string, string> = {
  brand: 'Identificador do brand',
  title: 'Nome',
  description: 'Descrição',
  slogan: 'Slogan',
  themes: 'Temas',
  'themes/light': 'Tema claro',
  'themes/dark': 'Tema escuro',
  'themes/light/palette': 'Paleta do tema claro',
  'themes/dark/palette': 'Paleta do tema escuro',
  'themes/light/tokens': 'Tokens do tema claro',
  'themes/dark/tokens': 'Tokens do tema escuro',
  'themes/light/custom': 'Custom do tema claro',
  'themes/dark/custom': 'Custom do tema escuro',
  'palette/background': 'Cor de fundo',
  'palette/foreground': 'Cor do texto',
  'palette/card': 'Cor de card',
  'palette/primary': 'Cor primária',
  'palette/secondary': 'Cor secundária',
  'palette/muted': 'Cor muted',
  'palette/accent': 'Cor de destaque',
  'palette/border': 'Cor de borda',
  'palette/input': 'Cor de input',
  'palette/ring': 'Cor de ring',
}

// Traduz o caminho do erro para um nome legível
function translateFieldPath(path: string): string {
  // Remove o "/" inicial
  const cleanPath = path.startsWith('/') ? path.slice(1) : path

  // Tenta encontrar correspondência exata ou parcial
  if (fieldLabels[cleanPath]) {
    return fieldLabels[cleanPath]
  }

  // Procura por correspondência parcial
  for (const [key, label] of Object.entries(fieldLabels)) {
    if (cleanPath.endsWith(key)) {
      return label
    }
  }

  // Se não encontrar, formata o caminho de forma legível
  return cleanPath
    .replace(/\//g, ' > ')
    .replace(/-/g, ' ')
}

// Traduz mensagens de erro do AJV para português amigável
function translateError(error: { keyword: string; message?: string; instancePath: string; params?: Record<string, unknown> }): string {
  const field = translateFieldPath(error.instancePath)
  const params = error.params || {}

  switch (error.keyword) {
    case 'required':
      return `O campo "${fieldLabels[params.missingProperty as string] || params.missingProperty}" é obrigatório`

    case 'type':
      return `${field} precisa ser do tipo correto`

    case 'pattern':
      if (error.instancePath.includes('palette') || error.instancePath.includes('tokens')) {
        return `${field} deve ser uma cor válida (ex: #FF5500)`
      }
      if (error.instancePath.includes('brand')) {
        return `O identificador deve conter apenas letras minúsculas, números e hífens (ex: minha-marca)`
      }
      return `${field} está em formato inválido`

    case 'minLength':
      return `${field} é muito curto (mínimo: ${params.limit} caracteres)`

    case 'maxLength':
      return `${field} é muito longo (máximo: ${params.limit} caracteres)`

    case 'additionalProperties':
      return `Campo desconhecido encontrado: "${params.additionalProperty}"`

    case 'oneOf':
      if (error.instancePath.includes('tokens')) {
        return `${field} deve ser uma cor (#RRGGBB) ou referência ({nome-da-cor})`
      }
      return `${field} não corresponde ao formato esperado`

    default:
      return error.message || `Erro em ${field}`
  }
}

export async function fetchSchema(): Promise<object> {
  const response = await fetch('/api/schema', {
    cache: 'no-store'  // Sempre busca versão mais recente
  })
  if (!response.ok) {
    throw new Error('Não foi possível carregar o schema de validação')
  }
  return response.json()
}

export async function validateBrand(data: unknown): Promise<ValidationResult> {
  try {
    const schema = await fetchSchema()
    const ajv = new Ajv({ allErrors: true, verbose: true })
    addFormats(ajv)

    const validate = ajv.compile(schema)
    const valid = validate(data)

    if (valid) {
      return { valid: true, errors: [] }
    }

    const errors: ValidationError[] = (validate.errors || []).map(error => ({
      field: error.instancePath || '/',
      message: translateError(error as { keyword: string; message?: string; instancePath: string; params?: Record<string, unknown> })
    }))

    // Remove duplicatas
    const uniqueErrors = errors.filter((error, index, self) =>
      index === self.findIndex(e => e.message === error.message)
    )

    return { valid: false, errors: uniqueErrors }

  } catch (err) {
    return {
      valid: false,
      errors: [{ field: '/', message: String(err) }]
    }
  }
}

export function parseJsonSafely(text: string): { data: unknown | null; error: string | null } {
  try {
    const data = JSON.parse(text)
    return { data, error: null }
  } catch (err) {
    // Mensagem amigável para erros de JSON
    const error = err as SyntaxError
    const message = error.message

    if (message.includes('Unexpected token')) {
      return { data: null, error: 'O arquivo não está no formato JSON correto. Verifique se há vírgulas faltando ou caracteres inválidos.' }
    }
    if (message.includes('Unexpected end')) {
      return { data: null, error: 'O arquivo JSON está incompleto. Verifique se há chaves ou colchetes faltando.' }
    }

    return { data: null, error: 'O arquivo não é um JSON válido. Verifique o conteúdo e tente novamente.' }
  }
}
