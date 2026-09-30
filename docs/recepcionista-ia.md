# Recepcionista de IA — configuração

Atende as ligações 24h, qualifica o cliente e joga o lead no dashboard e no
e-mail, sem ninguém precisar atender.

Plataforma: **Goodcall**, plano Starter ($79/mês, minutos ilimitados).

---

## 1. Conta e número

1. Criar conta em goodcall.com (tem teste grátis).
2. Em **Phone setup**, escolher *forward your existing line* e encaminhar o
   (218) 357-5938 para o número que a Goodcall fornecer.
   O número publicado no site continua o mesmo.

## 2. Perguntas do agente

Configurar exatamente estes campos — são os mesmos do formulário do site, para
o lead da ligação ficar idêntico ao lead do site no dashboard:

| Campo | Pergunta (em inglês, para o cliente) | Obrigatório |
|---|---|---|
| `name` | "Can I get your full name?" | sim |
| `phone` | capturado automático do identificador de chamadas | sim |
| `email` | "What's the best email for your estimate?" | não |
| `city` | "Which town are you in?" | sim |
| `service_type` | "Is this a standard clean, a deep clean, a move-in/move-out, or post-construction?" | sim |
| `bedrooms` | "How many bedrooms?" | sim |
| `bathrooms` | "How many bathrooms?" | sim |
| `preferred_date` | "Any day that works best for the first visit?" | não |
| `message` | "Anything we should know — pets, delicate surfaces, how to get in?" | não |

**Importante:** o agente **não deve fechar preço**. O site diz que o preço é
confirmado depois da avaliação. Orientar: *"I'll pass this to the team and
you'll get your estimate within a few hours."*

## 3. Enviar o lead para o sistema

Na Goodcall, conectar o Zapier:

- **Trigger:** Goodcall → *New Call* (ou *New Lead*)
- **Action:** Webhooks by Zapier → *POST*
  - URL: `https://danycleanpro.com/api/voice-lead`
  - Payload type: `json`
  - Data: mapear os campos acima (os nomes não precisam ser exatos — o webhook
    reconhece variações como `caller_name`, `beds`, `town`)

Pronto. O lead cai no Firestore, aparece no dashboard em **Manage Leads** com
origem `phone-ai`, e dispara o e-mail de aviso.

Para testar sem ligar: 

```bash
curl -X POST https://danycleanpro.com/api/voice-lead \
  -H "Content-Type: application/json" \
  -d '{"caller_name":"Teste","from_number":"+12035550134","town":"Stamford",
       "cleaning_type":"Deep Cleaning","beds":3,"baths":2,"notes":"teste"}'
```

## 4. Transferência para uma pessoa

No plano Starter dá para transferir a ligação. Vale configurar para transferir
quando o cliente pedir para falar com alguém, dentro do horário comercial.

---

## E-mail dos pedidos

Os leads (site **e** telefone) mandam e-mail automático. Depende de **uma**
variável no Netlify:

| Variável | Valor |
|---|---|
| `RESEND_API_KEY` | chave criada em resend.com (grátis até 3.000/mês) |
| `LEAD_NOTIFY_TO` | `danycleanenpro@gmail.com` (aceita vários, separados por vírgula) |
| `LEAD_NOTIFY_FROM` | `Dany Clean Pro <requests@danycleanpro.com>` — o domínio precisa estar verificado na Resend |

Conferir se pegou, depois do deploy:

```bash
curl https://danycleanpro.com/api/notify-lead
# {"configured":true,"provider":"resend","to":["danycleanenpro@gmail.com"], ...}
```

Se vier `"configured": false`, a chave não chegou no ambiente — conferir em
Netlify → Site settings → Environment variables, e refazer o deploy.
