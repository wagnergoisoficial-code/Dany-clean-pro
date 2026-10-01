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

Os leads (site **e** telefone) mandam e-mail automático. Escolha **uma** opção
e configure em Netlify → Site settings → Environment variables.

### Opção A — pelo Gmail da Dany (sem serviço terceiro)

| Variável | Valor |
|---|---|
| `GMAIL_USER` | `danycleanenpro@gmail.com` |
| `GMAIL_APP_PASSWORD` | App Password de 16 letras (pode colar com espaços) |
| `LEAD_NOTIFY_TO` | `danycleanenpro@gmail.com` (aceita vários, separados por vírgula) |

Como gerar o App Password:

1. myaccount.google.com → **Segurança**
2. Ativar a **Verificação em duas etapas** (obrigatório — sem isso a opção nem aparece)
3. Buscar por **Senhas de app** → criar uma chamada "Site Dany Clean"
4. Copiar as 16 letras

Limite do Gmail: ~500 e-mails/dia. Muito acima do volume de leads.

### Opção B — Resend (melhor entrega em volume alto)

| Variável | Valor |
|---|---|
| `RESEND_API_KEY` | chave de resend.com |
| `LEAD_NOTIFY_TO` | destinatários |
| `LEAD_NOTIFY_FROM` | `Dany Clean Pro <requests@danycleanpro.com>` (domínio verificado) |

### Conferir se pegou

Depois do deploy, abrir no navegador:

```
https://danycleanpro.com/api/notify-lead
```

Resposta esperada: `{"configured":true,"provider":"smtp", ...}`.
Se vier `"configured": false`, a variável não chegou no ambiente — conferir o
nome e refazer o deploy (variável nova só vale em deploy novo).

---

## Automação de acompanhamento

Uma função roda **de hora em hora** e manda o que venceu. Nada é enviado
enquanto `AUTOMATION_ENABLED` não for exatamente `true`.

| Quando | Para quem | O que |
|---|---|---|
| Lead entra | cliente | Confirmação na hora: "recebemos, retornamos em algumas horas" |
| Lead `new` há 2h | Dany | "Lead parado há 2 horas" |
| `contacted` há 3 dias | cliente | "Ainda de pé?" — pede nova data ou um "já resolvi" |
| `completed` há 1 dia (até 7 dias) | cliente | Pede avaliação, e oferece re-limpeza se algo não ficou bom |
| `completed` há 45 dias | cliente | Convite para voltar |

O status vem da tela **Manage Leads** — mudar o status lá é o que dispara tudo.

### Regras de segurança embutidas

- **Nunca repete:** cada lead guarda em `automation_log` o que já recebeu.
- **Nunca manda dois e-mails ao mesmo cliente na mesma rodada.**
- **Para de mandar** se o cliente tem `automation_opt_out`, ou se "stop"/
  "unsubscribe" aparece no histórico dele.
- **Não mexe no passado:** leads com mais de 90 dias são ignorados, então ligar
  a automação não dispara um ano de histórico.
- **Teto por rodada:** 25 e-mails por regra, por hora.

### Como ligar com segurança

1. `AUTOMATION_ENABLED=true` **e** `AUTOMATION_DRY_RUN=true`
2. Esperar uma hora e ler o log em Netlify → Functions → `scheduled-automations`.
   Ele lista o que *teria* enviado, sem enviar.
3. Se a lista fizer sentido, tirar o `AUTOMATION_DRY_RUN`.

Para desligar tudo na hora: `AUTOMATION_ENABLED=false` e refazer o deploy.
