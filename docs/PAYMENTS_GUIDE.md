# Sistema de Pagamentos Interno - Peladeiros App

## 📋 Visão Geral

O Sistema de Pagamentos Interno permite que administradores de grupos gerenciem cobranças e acompanhem pagamentos dos membros, sem necessidade de integração com plataformas de pagamento externas.

## 🎯 Funcionalidades

### Para Administradores

1. **Criar Cobranças**
   - Selecionar membro do grupo
   - Definir tipo: Mensalidade, Diária, Multa ou Outro
   - Informar valor em reais (ex: 50,00)
   - Definir data de vencimento (opcional)

2. **Gerenciar Cobranças**
   - Marcar como "Pago" com um clique
   - Cancelar cobranças
   - Excluir cobranças

3. **Acompanhar Caixa**
   - Ver total pendente
   - Ver total recebido
   - Filtrar por status (Todas, Pendentes, Pagas)

### Para Membros

- Visualizar cobranças do grupo
- Ver status de pagamento (Pendente, Pago, Cancelado)
- Acompanhar valores devidos

## 🚀 Como Usar

### Acessando a Página de Pagamentos

1. Entre no grupo desejado
2. Clique no botão **"Pagamentos"** no cabeçalho (apenas admins veem este botão)
3. Você será direcionado para `/groups/[groupId]/payments`

### Criando uma Cobrança (Admin)

1. Na página de pagamentos, clique em **"Nova Cobrança"**
2. Preencha o formulário:
   - **Membro**: Selecione o membro a ser cobrado
   - **Tipo**: Escolha entre Mensalidade, Diária, Multa ou Outro
   - **Valor (R$)**: Digite o valor em reais (ex: 50.00)
   - **Data de Vencimento**: (Opcional) Selecione a data
3. Clique em **"Criar Cobrança"**

### Marcando como Pago (Admin)

1. Localize a cobrança na listagem
2. Clique no botão verde **"Marcar como Pago"** (ícone de check)
3. A cobrança mudará para status "Pago" e será contabilizada no total recebido

### Filtrando Cobranças

Use os botões de filtro no topo da listagem:
- **Todas**: Exibe todas as cobranças
- **Pendentes**: Apenas cobranças pendentes
- **Pagas**: Apenas cobranças pagas

### Cancelando ou Excluindo

- **Cancelar**: Clique no botão "X" ao lado de "Marcar como Pago" (cobrança fica como "Cancelada")
- **Excluir**: Clique no botão vermelho com ícone de lixeira (remove permanentemente)

## 💡 Casos de Uso

### Mensalidade do Grupo

```
Tipo: Mensalidade
Valor: R$ 50,00
Vencimento: Primeiro dia do mês
```

Crie uma cobrança para cada membro no início do mês. Conforme os membros pagarem, marque como "Pago".

### Diária de Partida

```
Tipo: Diária
Valor: R$ 30,00
Vencimento: Data da partida
```

Após confirmar presença em um evento, crie cobranças para os participantes.

### Multa por Falta

```
Tipo: Multa
Valor: R$ 20,00
Vencimento: -
```

Aplique multas para membros que confirmaram presença mas faltaram.

## 🔒 Segurança e Permissões

### Permissões

| Ação | Admin | Membro |
|------|-------|--------|
| Ver página de pagamentos | ✅ | ✅ |
| Ver cobranças do grupo | ✅ | ✅ |
| Criar cobranças | ✅ | ❌ |
| Marcar como pago | ✅ | ❌ |
| Cancelar cobranças | ✅ | ❌ |
| Excluir cobranças | ✅ | ❌ |

### Validações

- Apenas membros do grupo podem acessar as cobranças
- Apenas admins podem gerenciar cobranças
- Valor deve ser maior que zero
- Membro cobrado deve ser do grupo
- Data de vencimento deve estar no formato YYYY-MM-DD

## 🎨 Interface

### Cards de Resumo

- **Total Pendente**: Soma de todas as cobranças com status "Pendente"
- **Total Recebido**: Soma de todas as cobranças com status "Pago"

### Listagem de Cobranças

Cada cobrança exibe:
- Nome do membro
- Status (badge colorido)
- Tipo da cobrança
- Valor em R$
- Data de vencimento (se informada)
- Ações (apenas para admins)

### Status com Cores

- 🟡 **Pendente**: Badge cinza
- 🟢 **Pago**: Badge verde
- 🔴 **Cancelado**: Badge vermelho

## 📊 Dados Técnicos

### Tabela do Banco de Dados

```sql
charges (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  user_id UUID REFERENCES users(id),
  type VARCHAR(20) CHECK (type IN ('monthly', 'daily', 'fine', 'other')),
  amount_cents INTEGER NOT NULL,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'canceled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Tipos de Cobrança

- `monthly`: Mensalidade
- `daily`: Diária
- `fine`: Multa
- `other`: Outro

### Status

- `pending`: Pendente (padrão)
- `paid`: Pago
- `canceled`: Cancelado

## 🔗 API Endpoints

### `GET /api/groups/:groupId/charges`
Lista cobranças do grupo.

**Query Params:**
- `status` (opcional): `pending`, `paid`, `canceled`
- `userId` (opcional): Filtrar por usuário

**Permissão:** Membro do grupo

### `POST /api/groups/:groupId/charges`
Cria nova cobrança.

**Body:**
```json
{
  "userId": "uuid",
  "type": "daily",
  "amountCents": 5000,
  "dueDate": "2024-12-31"
}
```

**Permissão:** Admin do grupo

### `PATCH /api/groups/:groupId/charges/:chargeId`
Atualiza status da cobrança.

**Body:**
```json
{
  "status": "paid"
}
```

**Permissão:** Admin do grupo

### `DELETE /api/groups/:groupId/charges/:chargeId`
Exclui cobrança.

**Permissão:** Admin do grupo

## 🎓 Boas Práticas

1. **Crie cobranças logo após os eventos** para não esquecer
2. **Use data de vencimento** para cobranças com prazo específico
3. **Marque como pago imediatamente** quando receber o pagamento
4. **Não exclua cobranças pagas** para manter histórico
5. **Use o filtro "Pendentes"** para ver o que ainda precisa ser cobrado

## 💰 Observações Importantes

- Este é um sistema **interno de registro**, não processa pagamentos reais
- Admins devem marcar manualmente como "Pago" após receberem o pagamento
- Não há integração com PIX, cartões ou outras formas de pagamento
- Funciona como um "caderninho" digital para controle de caixa
- Recomendado para grupos pequenos e médios

## 🆘 Troubleshooting

### Não vejo o botão "Pagamentos"
- Certifique-se de que você é **admin** do grupo
- Apenas admins têm acesso à gestão de pagamentos

### Erro ao criar cobrança
- Verifique se o valor é maior que zero
- Confirme que o membro selecionado é do grupo
- Verifique a data de vencimento (formato YYYY-MM-DD)

### Não consigo marcar como pago
- Apenas **admins** podem alterar status de cobranças
- Verifique se você tem permissão de admin no grupo

## 📝 Exemplos de Fluxo

### Fluxo Completo: Mensalidade

1. Admin cria cobrança de R$ 50,00 para todos os membros
2. Membros visualizam cobrança pendente na página
3. Membro paga via PIX/dinheiro para o admin
4. Admin marca cobrança como "Paga"
5. Total recebido é atualizado automaticamente
6. Histórico fica registrado no sistema

---

**Desenvolvido para Peladeiros App** | Sistema de Gestão de Peladas
