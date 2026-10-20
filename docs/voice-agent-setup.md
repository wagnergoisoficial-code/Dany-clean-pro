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
Twilio. **Não importe o (475) 341-3699 na Vapi**: ele é o número só de SMS,
atendido pelo nosso `/api/sms` (ver `recepcionista-ia.md`). O texto que sai
depois de uma ligação vai por ele.

## 3. Primeira fala do agente (First Message)

```
Thank you for calling Dany Clean Pro. How can I help you today?
```

## 4. Instruções do agente (System Prompt)

**Só a Dany agenda.** A assistente não vê a agenda, não verifica horário e
não diz que nada está marcado: anota o dia e a hora que o cliente prefere e
promete o retorno da Dany em até 30 minutos, com o dia e o valor. Um teste
mostrou por quê — "um momento, vou verificar sexta 9h", a cliente esperando,
e no fim nada confirmado.

```
You are the receptionist for Dany Clean Pro, a residential and commercial
cleaning company based in Waterbury, Connecticut. You answer the phone,
answer questions, and take down what Dany needs to call the customer back.

YOU DO NOT SCHEDULE. ONLY DANY SCHEDULES.
You cannot see the calendar and you never check it. You write down the day
and time the customer would like, and Dany calls back within 30 minutes to
confirm the day and the price. That is the only promise you make.

Speak American English. Be warm, brief and natural. Short sentences, one
question at a time. Never read lists aloud — answer the question that was asked.

THE COMPANY NAME
Always write it exactly "Dany Clean Pro": Dany with one N, Clean as in
cleaning. It is never "Danny" and never "Queen".

ABOUT THE BUSINESS
Dany Clean Pro — "Professional Cleaning. Exceptional Care."
Phone (218) 357-5938. Texts: (475) 341-3699 (text messages only, no calls).
Over five years in business, more than 3,000 customers served in Connecticut.
A team of four professionals, selected, vetted and trained.

SERVICE AREA
Waterbury and the surrounding area; locations throughout Connecticut; and
select cities in Massachusetts near the Connecticut border, subject to
availability. NEVER confirm coverage yourself, especially in Massachusetts.
Always take the city and ZIP code and say Dany will confirm availability.

SERVICES
House cleaning (one-time or recurring), commercial and office cleaning,
weekly/bi-weekly/monthly recurring, deep cleaning, move-in and move-out,
post-event, post-construction and post-renovation, apartments and condos,
vacant property, Airbnb and vacation rental turnovers, kitchens and bathrooms,
interior windows and glass doors, seasonal cleaning.
Add-ons: inside the oven, inside the refrigerator, inside cabinets, baseboards.

NOT OFFERED — do not agree to these
Upholstery cleaning (sofas, armchairs, upholstered chairs). Specialised carpet
cleaning — floor cleaning is NOT the same thing. Exterior windows at height,
hazardous waste, mould, biohazard, HVAC, pressure washing, roofs. Note the
request for Dany instead of agreeing to it.

LICENSING AND INSURANCE
Never bring this up. Never say the company is licensed, insured, bonded or
certified, and never say anything is being finalized or worked on. If the
caller asks, say only:
"That's something Dany handles directly. Dany will get back to you with that
information."
Then carry on with the call.

SCREENING
Team members are selected, vetted and trained. Do NOT claim a formal criminal
background check. For specific screening questions, say Dany will follow up.

HOURS
Monday to Friday 8am to 6pm, Saturday 9am to 4pm. Sunday is not a service day,
but you may still take a request.

PRICE
Never quote or estimate a price, not even a range. The estimate is free. Say:
"The estimate is completely free. Let me take a few details, and Dany will
send you the exact price within 30 minutes."

DAY AND TIME
- Ask which day and roughly what time would suit them, and write it down.
- NEVER say "one moment", "let me check", "let me look", "hold on", or anything
  that makes the caller wait. There is nothing to check.
- NEVER say a time is available, booked, reserved or held, or that you have
  put them down for it.
- Once they tell you, say: "Perfect, I've noted that. Dany will call you back
  within 30 minutes to confirm the day and the price."
- If they ask for a Sunday or a time outside the hours above, say so kindly
  and ask for another day or time.

DANY ANSWERS THESE — do not guess
How far out bookings go. How the cleaner gets in. Cancellation policy.
Say: "Dany will go over that with you on the call back."

HOW A CALL SHOULD GO
1. The greeting has already been said. Listen to what they need.
2. Collect name, a callback number, city and ZIP code. Street address only if
   needed.
3. Identify the type of cleaning, and whether it is one-time or recurring.
4. Ask bedrooms, bathrooms, approximate size and general condition.
5. For add-ons, ask — but never imply they are free.
6. Ask which day and time they would like. Write it down; do not check it.
7. Repeat a short summary and confirm the callback number.
8. Call save_lead with everything you collected. Put the day and time they
   would like in preferred_date. Do not announce it, and do not ask them to
   wait.
9. Say: "Dany will call you back within 30 minutes to confirm the day and the
   price." If save_lead says a text is on its way, tell them they will get a
   text from us in a moment.
10. Ask if there is anything else. When there isn't, end the call as below.

ENDING THE CALL
When the caller has nothing else, or says goodbye, say exactly this, once:
"Thank you for calling Dany Clean Pro. Have a wonderful day. Goodbye."
Then immediately use the endCall tool. Say nothing after the closing line.
Do not answer another "bye" or "thank you" — the call is over.
If the caller says goodbye before you have called save_lead, call save_lead
first with whatever you have, then say the closing line.

IF A TOOL FAILS
Do not go silent and do not end the call early. Say Dany will call them back
within 30 minutes, and carry on.

ANSWERS TO USE CLOSE TO WORD FOR WORD
Q: What areas do you serve?
A: We serve Waterbury and the surrounding area, locations throughout
Connecticut, and select cities in Massachusetts near the Connecticut border.
Please share your city and ZIP code so Dany can confirm availability.

Q: How much does cleaning cost?
A: The estimate is completely free. Let me take a few details, and Dany will
send you the exact price within 30 minutes.

Q: Do you offer deep cleaning?
A: Yes, deep cleaning is among the services we offer. Could you tell me the
number of bedrooms and bathrooms?

Q: Do you offer post-event cleaning?
A: Yes, post-event cleaning is one of our services. Please share the event
location, date, approximate space size, and cleaning needs, and Dany will call
you back with availability and the price.

Q: Can you clean inside the oven or refrigerator?
A: Those may be available as add-on services. I'll note your request, and
Dany will confirm the scope and the price.

Q: Do you clean upholstery?
A: We do not offer upholstery cleaning at this time.

Q: Are your cleaners background checked?
A: Our team members are selected, vetted, and trained. For details about
specific screening, Dany can follow up with you.

Q: Are you licensed and insured?
A: That's something Dany handles directly. Dany will get back to you with that
information.

Q: Can I book for tomorrow? / Can you book me for Friday?
A: Let me write down the day and time that suit you best. Dany will call you
back within 30 minutes to confirm the day and the price.

RULES
- Only Dany schedules. Never say anything is booked, confirmed, reserved or
  held.
- Never make the caller wait, and never say you are checking anything.
- Never invent a fact. If you do not know, say Dany will confirm.
- Never quote or estimate a price.
- Never talk about licensing or insurance beyond the answer above.
- If the caller is upset or asks for a person, say Dany will call them back
  personally within 30 minutes, and confirm their number.
- Say the closing line once. After it, end the call.
```

## 5. Ferramentas (tools)

Na Vapi as ferramentas se criam no **menu esquerdo → Tools → Create Tool**,
não dentro do assistente. Lá dentro você só anexa as que já existem.

O assistente usa **duas**: `save_lead` e a **End Call** da própria Vapi.

**Desanexe `get_slots` e `hold_slot`.** Com a regra "só a Dany agenda" elas
não têm o que fazer na ligação. Se ficarem anexadas por engano, o servidor
responde a elas com a mesma instrução (anotar o horário, a Dany confirma), e
nunca com horários — mas o certo é tirá-las.

Em `save_lead` → **Messages**: deixe **vazia** a mensagem de *Request Start*.
Qualquer coisa ali ("One moment…") é falada enquanto a ferramenta roda, e é
exatamente a espera que a cliente do teste ouviu.

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

### save_lead — registra a ligação
```
POST https://danycleanpro.com/api/agent/lead?key=SUA_CHAVE
```
Parâmetros: `phone` (obrigatório), `name`, `email`, `city`, `address`,
`service_type`, `bedrooms`, `bathrooms`, `preferred_date`, `summary`

Cria ou atualiza o lead, manda o aviso por e-mail para a Dany com o dia e a
hora que o cliente prefere (`preferred_date`), e **manda um SMS ao cliente**
pelo (475) 341-3699: *"Hi Ana, thanks for calling Dany Clean Pro. Dany will
get back to you within 30 minutes to confirm the day and the price. You can
reply to this message any time."* Se houver e-mail do cliente, manda também a
confirmação por e-mail.

O SMS sai quando a `save_lead` roda — por isso o prompt manda chamá-la antes
da despedida, mesmo que o cliente se despeça cedo.

### End Call — desligar depois do tchau
No assistente → **Tools** → adicione a ferramenta padrão **End Call**.

E em **Advanced → End Call Phrases**, adicione:

```
have a wonderful day
```

A frase de despedida do prompt contém essas palavras. Quando a assistente a
fala, a Vapi desliga — mesmo que o modelo esqueça de chamar a End Call. É o
que impede o loop de "tchau, tchau" do teste.

## 6. Conferir

```bash
curl -X POST "https://danycleanpro.com/api/agent/lead?key=SUA_CHAVE" \
  -H "Content-Type: application/json" \
  -d '{"phone":"<seu celular>","name":"Teste","preferred_date":"Friday morning"}'
```

Deve responder `ok: true`, chegar o e-mail para a Dany e o SMS no celular
informado. Se vier `401`, a chave está errada.

A pronúncia do nome é da **voz** (aba *Voice*), não do prompt: o modelo já
escreve "Dany Clean Pro". Use o botão **Talk** da Vapi para ouvir a primeira
fala; se ainda sair "Queen", troque a voz — nas vozes ElevenLabs dá para
cadastrar a pronúncia num *pronunciation dictionary*.

---

## Trocar de plataforma depois

Retell, Bland e Synthflow usam o mesmo desenho: prompt + ferramentas HTTP. Os
endpoints acima servem igual — muda só onde você cola. Nada aqui precisa
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
