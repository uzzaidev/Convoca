// Script de teste para debugar autenticação
// Execute: node test-auth-debug.js

const bcrypt = require('bcryptjs');

async function testBcrypt() {
  console.log('🔍 Testando bcrypt...\n');

  const senha = 'teste123';
  console.log(`Senha original: ${senha}`);

  // Simular o cadastro
  const hash1 = await bcrypt.hash(senha, 10);
  console.log(`Hash gerado (cadastro): ${hash1}`);

  // Simular o login - comparar senha com hash
  const compare1 = await bcrypt.compare(senha, hash1);
  console.log(`Comparação senha correta: ${compare1}`);

  const compare2 = await bcrypt.compare('senhaerrada', hash1);
  console.log(`Comparação senha errada: ${compare2}`);

  // Testar com hash diferente
  const hash2 = await bcrypt.hash(senha, 10);
  console.log(`\nNovo hash (mesmo salt): ${hash2}`);
  console.log(`Hashes são diferentes? ${hash1 !== hash2} (isso é normal)`);

  const compare3 = await bcrypt.compare(senha, hash2);
  console.log(`Comparação com novo hash: ${compare3}`);
}

testBcrypt().catch(console.error);
