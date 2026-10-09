# Agente de voz — configuração

A conversa roda numa plataforma de áudio em tempo real (sem as pausas do
sistema atual). As decisões do negócio continuam aqui: a agenda, o lead,
o e-mail.

**Plataforma escolhida: Vapi.** Cadastro aberto, US$ 5 de crédito grátis para
testar, e importa o número do Twilio com SID e token — sem porta­bilidade.

A Phonely foi descartada: só libera conta depois de reunião com vendedor.

Custo depois do crédito: cerca de US$ 0,09 a 0,14 por minuto, somando a
plataforma, a transcrição, o modelo, a voz e a telefonia. A ~400 minutos/mês
dá algo entre US$ 36 e US$ 56.

---

## 1. Antes de tudo: a chave

No Netlify → Environment variables, criar:

```
AGENT_API_KEY = <uma sequência longa e aleatória>
```

Gere com qualquer coisa, por exemplo:
`openssl rand -hex 24`

Depois, **Trigger deploy**. Sem isso os endpoints ficam abertos na internet —
e eles gastam dinheiro (escrevem na agenda e mandam e-mail).

## 2. Número

Na Vapi: **Phone Numbers → Import from Twilio**. Informe o Account SID e o
Auth Token, e o número (218) 357-5938.

A Vapi assume o atendimento das ligações. O número continua sendo seu, no
Twilio, com o registro A2P válido — e o SMS continua vindo para o nosso
`/api/sms`, que já funciona.

## 3. Primeira fala do agente

```
Thanks for calling Dany Clean Pro! I can get your cleaning estimate
started. What's your name?
```

## 4. Instruções do agente

```
You are the phone receptionist for Dany Clean Pro, a residential and
commercial cleaning company in Connecticut.

Collect, one at a time, in this order: name, town, type of cleaning,
number of bedrooms, number of bathrooms.

Then call the tool "get_slots" and offer the customer the times it returns,
in plain words. When the customer accepts one, call "hold_slot" with that
slot's id. Tell them it is reserved and the team will confirm shortly.

Before ending the call, always call "save_lead" with everything you learned.

RULES
- Never quote or estimate a price. Pricing is confirmed by the team after
  reviewing the home. If pressed, say exactly that and move on.
- Never invent a fact about the business. If you do not know, say a team
  member will confirm.
- Never promise a time that did not come from get_slots.
- One question per turn, under 18 words. Use contractions. Acknowledge what
  they said in two or three words before asking the next thing.
```

## 5. Ferramentas (tools)

Na Vapi as ferramentas se criam no **menu esquerdo → Tools → Create Tool**,
não dentro do assistente. Lá dentro você só anexa as que já existem.

Tipo: **Function tool**. Campos: *Tool Name*, *Description*, *Parameters*,
*Server URL*.

O painel da Vapi **não tem campo de header** para esse tipo de ferramenta, por
isso a chave vai na própria URL:

```
...?key=<o valor de AGENT_API_KEY>
```

Os endpoints aceitam a chave de três formas — header `X-Agent-Key`, bearer
token, ou `?key=` — então outras plataformas podem usar o header, que é o
jeito mais seguro.

### get_slots — horários livres
```
POST https://danycleanpro.com/api/agent/slots?key=SUA_CHAVE
```
Parâmetros: `service_type` (texto, opcional)

Retorna `slots: [{ id, when }]`. O campo `when` é para falar; o `id` é para
devolver no hold.

### hold_slot — segura o horário
```
POST https://danycleanpro.com/api/agent/hold?key=SUA_CHAVE
```
Parâmetros: `slot_id` (obrigatório), `name`, `phone`, `city`, `service_type`

Se o horário tiver acabado de ser pego, a resposta diz isso e instrui a
oferecer outro. O horário fica **pendente** até alguém aprovar no dashboard.

### save_lead — registra a ligação
```
POST https://danycleanpro.com/api/agent/lead?key=SUA_CHAVE
```
Parâmetros: `phone` (obrigatório), `name`, `email`, `city`, `address`,
`service_type`, `bedrooms`, `bathrooms`, `preferred_date`, `summary`

Cria ou atualiza o lead, manda o aviso por e-mail para a Dany e, se houver
e-mail do cliente, a confirmação para ele.

## 6. Conferir

```bash
curl -X POST "https://danycleanpro.com/api/agent/slots?key=SUA_CHAVE" \
  -H "Content-Type: application/json" \
  -d '{"service_type":"Deep cleaning"}'
```

Deve devolver horários reais. Se vier `401`, a chave está errada.

---

## Trocar de plataforma depois

Retell, Bland e Synthflow usam o mesmo desenho: prompt + ferramentas HTTP. Os
três endpoints acima servem igual — muda só onde você cola. Nada aqui precisa
ser reescrito.

Referência rápida, a ~400 minutos/mês:

| Plataforma | Custo/mês | Cadastro aberto |
|---|---|---|
| Vapi | US$ 36–56 | sim, US$ 5 de crédito |
| Bland | ~US$ 36 | sim |
| Retell | ~US$ 46 | sim, exige tronco SIP para o número |
| Synthflow | ~US$ 60 | sim |
| Goodcall | US$ 79 fixo | sim |
| Phonely | — | **não**, só por reunião |
