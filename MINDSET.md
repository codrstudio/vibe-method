**MINDSET.md**

# O Pensamento

## O Fundamento

Um sistema existe para resolver um negócio.

```
sistema ↔ negócio
```

Essa é a relação que justifica qualquer sistema. Mas ela esconde uma tensão: quem entende do sistema não entende do negócio. Quem entende do negócio não entende do sistema.

A prática tradicional resolve essa tensão com transferência. O negócio especifica, o engenheiro traduz, a regra entra no código. O engenheiro assume responsabilidade por algo que não é dele. O negócio perde controle sobre algo que é dele.

---

## O Artefato

Existe outra forma de resolver essa tensão: o contrato.

```
sistema ↔ artefato ↔ negócio
```

O artefato é o contrato entre a engenharia de sistema e a engenharia de negócio. Ele permite que os dois lados conversem sem transferência de responsabilidade.

O artefato tem dois aspectos: estrutura e conteúdo.

O engenheiro de sistema define a estrutura. Que forma o artefato tem. Que campos existem. Que validações se aplicam.

O engenheiro de negócio define o conteúdo. Que valores preenchem a estrutura. Que regras se expressam ali.

Cada lado contribui com o que é seu. O artefato é o ponto de encontro.

---

## A Ferramentaria

Mas trabalhar com estrutura é complexo. Produzir conteúdo válido é trabalhoso.

É aqui que entra o ferramenteiro.

```
SISTEMA ↔ motor ↔ ARTEFATO ↔ ferramenta ↔ NEGÓCIO
```

O ferramenteiro reduz complexidade dos dois lados.

Para o sistema: entrega o motor. O motor lê a estrutura, valida o conteúdo, executa. O engenheiro de sistema integra o motor na plataforma sem se preocupar com as regras de negócio que virão.

Para o negócio: entrega a ferramenta. A ferramenta permite produzir conteúdo válido sem conhecer a estrutura por baixo. O engenheiro de negócio opera a ferramenta sem se preocupar com o sistema que vai consumir.

O ferramenteiro não resolve o negócio. Não constrói a plataforma. Ele remove obstáculos para que cada lado trabalhe com autonomia.

---

## O Papel

O ferramenteiro pensa diferente.

Ele não pergunta "como codifico essa regra?"
Ele pergunta "como essa regra vira artefato?"

Ele não pergunta "como resolvo esse requisito?"
Ele pergunta "que ferramenta permite o negócio produzir isso sozinho?"

Ele não pergunta "como o sistema processa isso?"
Ele pergunta "que motor permite o sistema consumir isso?"

O trabalho do ferramenteiro é reduzir complexidade. Do lado do sistema, um motor que abstrai a leitura e validação. Do lado do negócio, uma ferramenta que abstrai a estrutura.

---

## O Efeito

Quando o ferramenteiro faz bem seu trabalho:

O engenheiro de sistema foca em sistema. Define estruturas, integra motores, garante estabilidade. O código não carrega regra de negócio.

O engenheiro de negócio foca em negócio. Usa a ferramenta, produz conteúdo, testa na hora. Não espera engenheiro de sistema. Não transfere responsabilidade.

O artefato fica legível, versionável, auditável. Estrutura clara, conteúdo explícito. Quer entender o que o sistema faz? Leia os artefatos. Quer mudar? Mude o conteúdo.

---

## A Pergunta

Você está aumentando complexidade ou reduzindo?

Se está codificando regra de negócio, está transferindo responsabilidade pro lugar errado.

Se está entregando motor e ferramenta, está pensando como ferramenteiro.