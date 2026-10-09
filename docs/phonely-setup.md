# Phonely — configuração do agente de voz

A conversa roda na Phonely (áudio em tempo real, sem as pausas do sistema
atual). As decisões do negócio continuam aqui: a agenda, o lead, o e-mail.

Plano grátis: 100 minutos/mês, ~50 ligações, sem cartão.

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

Na Phonely, pegue o número gratuito do plano e **encaminhe** o
(218) 357-5938 para ele no console do Twilio
(Voice → "A call comes in" → Forward to / ou o número da Phonely).

O número publicado no site não muda, e o registro A2P continua valendo.

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

Nas três, adicionar o cabeçalho:

```
X-Agent-Key: <o mesmo valor de AGENT_API_KEY>
```

### get_slots — horários livres
```
POST https://danycleanpro.com/api/agent/slots
```
Parâmetros: `service_type` (texto, opcional)

Retorna `slots: [{ id, when }]`. O campo `when` é para falar; o `id` é para
devolver no hold.

### hold_slot — segura o horário
```
POST https://danycleanpro.com/api/agent/hold
```
Parâmetros: `slot_id` (obrigatório), `name`, `phone`, `city`, `service_type`

Se o horário tiver acabado de ser pego, a resposta diz isso e instrui a
oferecer outro. O horário fica **pendente** até alguém aprovar no dashboard.

### save_lead — registra a ligação
```
POST https://danycleanpro.com/api/agent/lead
```
Parâmetros: `phone` (obrigatório), `name`, `email`, `city`, `address`,
`service_type`, `bedrooms`, `bathrooms`, `preferred_date`, `summary`

Cria ou atualiza o lead, manda o aviso por e-mail para a Dany e, se houver
e-mail do cliente, a confirmação para ele.

## 6. Conferir

```bash
curl -X POST https://danycleanpro.com/api/agent/slots \
  -H "X-Agent-Key: SUA_CHAVE" -H "Content-Type: application/json" \
  -d '{"service_type":"Deep cleaning"}'
```

Deve devolver horários reais. Se vier `401`, a chave está errada.

---

## Trocar de plataforma depois

Vapi, Retell e Bland usam o mesmo desenho: prompt + ferramentas HTTP. Os três
endpoints acima servem igual — muda só onde você cola. Nada aqui precisa ser
reescrito.
