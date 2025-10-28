# 🚀 Instruções para Setup do Banco de Dados

## ⚠️ IMPORTANTE: Não execute o SQL no VSCode ou IDE!

O arquivo `neon-setup.sql` deve ser executado **APENAS no Neon Console**. IDEs tentam analisar o SQL e causam erros.

## 📋 Passo a Passo

### 1. Abrir o Neon Console
1. Acesse: **https://console.neon.tech**
2. Faça login na sua conta
3. Selecione seu projeto do Peladeiros

### 2. Abrir o SQL Editor
1. No menu lateral esquerdo, clique em **SQL Editor**
2. Você verá uma área de texto grande para executar queries

### 3. Copiar o SQL
1. **Abra o arquivo** `neon-setup.sql` no seu editor (VSCode)
2. **Selecione TODO o conteúdo** do arquivo (Ctrl+A)
3. **Copie** (Ctrl+C)

### 4. Colar e Executar no Neon
1. **Cole** todo o conteúdo no SQL Editor do Neon (Ctrl+V)
2. Clique no botão **Run** (ou pressione Ctrl+Enter)
3. Aguarde a execução (pode levar 5-10 segundos)

### 5. Verificar o Resultado
Ao final da execução, você verá uma tabela com o resumo:

```
tabela          | total
----------------|------
Usuários        | 15
Grupos          | 2
Membros         | 22
Eventos         | 4
RSVPs           | 30
Times           | 2
Ações           | 11
Avaliações      | 4
```

## ✅ Pronto! Agora você pode fazer login:

- **URL**: http://localhost:3000
- **Email**: `carlos@test.com` (ou qualquer outro dos 15 usuários)
- **Senha**: `senha123`

## 👥 Outros usuários de teste disponíveis:

- carlos@test.com
- joao@test.com
- pedro@test.com
- lucas@test.com
- fernando@test.com
- rafael@test.com
- marcelo@test.com
- bruno@test.com
- diego@test.com
- thiago@test.com
- gustavo@test.com
- andre@test.com
- felipe@test.com
- rodrigo@test.com
- gabriel@test.com

**Todos com a mesma senha**: `senha123`

## 🎯 O que você vai ver no Dashboard:

- ✅ 2 grupos ("Pelada do Parque" e "Futebol de Quinta")
- ✅ 2 eventos futuros agendados
- ✅ Presenças confirmadas (alguns na lista de espera)
- ✅ Histórico de jogos passados com placares
- ✅ Gols, assistências e estatísticas

## ❓ Se algo der errado:

1. **Erro sobre uuid_generate_v4()**: O Neon deve suportar `gen_random_uuid()`. Se não funcionar, contate o suporte do Neon.
2. **Erro de permissão**: Verifique se você tem permissão de admin no banco.
3. **Timeout**: O script pode demorar um pouco. Aguarde até 30 segundos.

## 🔄 Para resetar e executar novamente:

Você pode executar o script `neon-setup.sql` quantas vezes quiser. Ele sempre:
1. Limpa todos os dados existentes (TRUNCATE)
2. Insere os dados de teste novamente

⚠️ **ATENÇÃO**: Isso vai DELETAR todos os dados! Use apenas em desenvolvimento!
