// Script para verificar dados no banco de dados
// Execute: node debug-check-db.js

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

async function checkDatabase() {
  const sql = neon(process.env.DATABASE_URL);

  console.log('\n========================================');
  console.log('🔍 VERIFICANDO BANCO DE DADOS');
  console.log('========================================\n');

  try {
    // Primeiro, verificar estrutura da tabela
    console.log('📋 Verificando estrutura da tabela users...\n');
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;

    console.log('Colunas existentes na tabela:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    console.log('');

    // Buscar todos os usuários (apenas colunas que sabemos que existem)
    const users = await sql`
      SELECT id, name, email, password_hash
      FROM users
      ORDER BY id DESC
    `;

    console.log(`📊 Total de usuários: ${users.length}\n`);

    for (const user of users) {
      console.log('─────────────────────────────────────────');
      console.log(`👤 Nome: ${user.name}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔑 Tem password_hash? ${user.password_hash ? 'SIM' : 'NÃO'}`);

      if (user.password_hash) {
        console.log(`📏 Tamanho do hash: ${user.password_hash.length} caracteres`);
        console.log(`🔐 Preview do hash: ${user.password_hash.substring(0, 20)}...`);

        // Tentar validar o hash do bcrypt
        const isBcryptHash = user.password_hash.startsWith('$2a$') ||
                            user.password_hash.startsWith('$2b$') ||
                            user.password_hash.startsWith('$2y$');
        console.log(`✓ Hash válido do bcrypt? ${isBcryptHash ? 'SIM' : 'NÃO'}`);

        // Teste de comparação com senha comum
        try {
          const testPassword = 'teste123';
          const match = await bcrypt.compare(testPassword, user.password_hash);
          console.log(`🔍 Senha '${testPassword}' bate? ${match ? 'SIM' : 'NÃO'}`);
        } catch (e) {
          console.log(`❌ Erro ao comparar senha: ${e.message}`);
        }
      } else {
        console.log('⚠️  PASSWORD_HASH ESTÁ VAZIO OU NULL!');
      }
    }

    console.log('\n========================================');
    console.log('✅ Verificação concluída');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Erro ao verificar banco de dados:');
    console.error(error);
  }
}

checkDatabase();
