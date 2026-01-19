import { chromium } from 'playwright';

async function testLogin() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    console.log('🚀 TESTE DO NOVO FLUXO DE LOGIN\n');
    console.log('='.repeat(60));

    // ========== TELA 1: EMAIL ==========
    console.log('\n📧 TELA 1: Email');
    console.log('-'.repeat(60));

    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Verificar elementos
    const emailInput = await page.locator('input[type="email"]').isVisible();
    const continueBtn = await page.locator('button:has-text("Continuar")').isVisible();
    const cpfLink = await page.locator('button:has-text("Entrar com CPF/CNPJ")').isVisible();
    const logo = await page.locator('img[alt="Logo"]').first().isVisible();

    console.log(`${logo ? '✓' : '✗'} Logo visivel`);
    console.log(`${emailInput ? '✓' : '✗'} Input de email`);
    console.log(`${continueBtn ? '✓' : '✗'} Botao Continuar`);
    console.log(`${cpfLink ? '✓' : '✗'} Link para CPF/CNPJ`);

    await page.screenshot({ path: '.tmp/login-01-email.png' });

    // ========== TELA 2: CPF/CNPJ ==========
    console.log('\n🪪 TELA 2: CPF/CNPJ');
    console.log('-'.repeat(60));

    await page.click('button:has-text("Entrar com CPF/CNPJ")');
    await page.waitForTimeout(300);

    const cpfInput = await page.locator('input#cpf').isVisible();
    const emailLink = await page.locator('button:has-text("Entrar com email")').isVisible();

    console.log(`${cpfInput ? '✓' : '✗'} Input de CPF/CNPJ`);
    console.log(`${emailLink ? '✓' : '✗'} Link para email`);

    await page.screenshot({ path: '.tmp/login-02-cpf.png' });

    // Voltar para email
    await page.click('button:has-text("Entrar com email")');
    await page.waitForTimeout(300);

    // ========== TELA 3: SENHA ==========
    console.log('\n🔐 TELA 3: Senha');
    console.log('-'.repeat(60));

    // Preencher email e continuar
    await page.fill('input[type="email"]', 'teste@exemplo.com');
    await page.click('button:has-text("Continuar")');
    await page.waitForTimeout(300);

    const passwordInput = await page.locator('input#password').isVisible();
    const backBtn = await page.locator('button:has-text("Voltar")').isVisible();
    const enterBtn = await page.locator('button:has-text("Entrar")').isVisible();
    const otpEmailBtn = await page.locator('button:has-text("Código via email")').isVisible();
    const otpWhatsBtn = await page.locator('button:has-text("Código via WhatsApp")').isVisible();
    const eyeBtn = await page.locator('button:has(svg.lucide-eye)').isVisible();
    const identifierShown = await page.locator('text=teste@exemplo.com').isVisible();

    console.log(`${backBtn ? '✓' : '✗'} Botao Voltar`);
    console.log(`${identifierShown ? '✓' : '✗'} Email exibido: teste@exemplo.com`);
    console.log(`${passwordInput ? '✓' : '✗'} Input de senha`);
    console.log(`${eyeBtn ? '✓' : '✗'} Botao olho (mostrar senha)`);
    console.log(`${enterBtn ? '✓' : '✗'} Botao Entrar`);
    console.log(`${otpEmailBtn ? '✓' : '✗'} Botao OTP via email`);
    console.log(`${otpWhatsBtn ? '✓' : '✗'} Botao OTP via WhatsApp`);

    await page.screenshot({ path: '.tmp/login-03-password.png' });

    // Testar eye toggle
    console.log('\n👁️ Testando toggle de senha:');
    const inputType1 = await page.locator('input#password').getAttribute('type');
    console.log(`  Tipo inicial: ${inputType1}`);

    // Mouse down no botao do olho
    const eyeButton = page.locator('button:has(svg.lucide-eye), button:has(svg.lucide-eye-off)');
    await eyeButton.dispatchEvent('mousedown');
    await page.waitForTimeout(100);
    const inputType2 = await page.locator('input#password').getAttribute('type');
    console.log(`  Durante press: ${inputType2}`);

    await eyeButton.dispatchEvent('mouseup');
    await page.waitForTimeout(100);
    const inputType3 = await page.locator('input#password').getAttribute('type');
    console.log(`  Apos soltar: ${inputType3}`);

    console.log(`${inputType1 === 'password' && inputType2 === 'text' && inputType3 === 'password' ? '✓' : '✗'} Toggle funcionando corretamente`);

    // ========== TELA 4: OTP ==========
    console.log('\n🔢 TELA 4: OTP');
    console.log('-'.repeat(60));

    await page.click('button:has-text("Código via email")');
    await page.waitForTimeout(300);

    const otpComponent = await page.locator('[data-input-otp="true"]').isVisible();
    const otpSlots = await page.locator('[data-input-otp-slot]').count();
    const verifyBtn = await page.locator('button:has-text("Verificar")').isVisible();
    const passwordLink = await page.locator('button:has-text("Entrar com senha")').isVisible();
    const otpBackBtn = await page.locator('button:has-text("Voltar")').isVisible();

    console.log(`${otpBackBtn ? '✓' : '✗'} Botao Voltar`);
    console.log(`${otpComponent ? '✓' : '✗'} Componente InputOTP`);
    console.log(`${otpSlots === 6 ? '✓' : '✗'} 6 slots de OTP (encontrados: ${otpSlots})`);
    console.log(`${verifyBtn ? '✓' : '✗'} Botao Verificar`);
    console.log(`${passwordLink ? '✓' : '✗'} Link para senha`);

    await page.screenshot({ path: '.tmp/login-04-otp-empty.png' });

    // Testar digitacao OTP
    console.log('\n⌨️ Testando digitacao OTP:');

    // Focar e digitar
    await page.locator('[data-input-otp="true"]').click();
    await page.keyboard.type('123456');
    await page.waitForTimeout(300);

    const filledSlots = await page.locator('[data-input-otp-slot]').allTextContents();
    console.log(`  Valores digitados: ${filledSlots.join(' ')}`);

    await page.screenshot({ path: '.tmp/login-05-otp-filled.png' });

    // Verificar se botao esta habilitado
    const verifyEnabled = await page.locator('button:has-text("Verificar")').isEnabled();
    console.log(`${verifyEnabled ? '✓' : '✗'} Botao Verificar habilitado apos 6 digitos`);

    // ========== TESTE VIA WHATSAPP ==========
    console.log('\n📱 Testando OTP via WhatsApp:');

    await page.click('button:has-text("Voltar")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Código via WhatsApp")');
    await page.waitForTimeout(300);

    const whatsappMsg = await page.locator('text=seu WhatsApp').isVisible();
    console.log(`${whatsappMsg ? '✓' : '✗'} Mensagem indica WhatsApp`);

    await page.screenshot({ path: '.tmp/login-06-otp-whatsapp.png' });

    // ========== FLUXO COMPLETO ==========
    console.log('\n🎯 Testando fluxo completo de login:');
    console.log('-'.repeat(60));

    // Voltar e fazer login com senha
    await page.click('button:has-text("Entrar com senha")');
    await page.waitForTimeout(300);

    await page.fill('input#password', 'minhasenha123');
    await page.screenshot({ path: '.tmp/login-07-password-filled.png' });

    await page.click('button:has-text("Entrar")');

    // Aguardar redirecionamento
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    console.log('✓ Login realizado com sucesso!');
    console.log('✓ Redirecionado para /dashboard');

    await page.screenshot({ path: '.tmp/login-08-dashboard.png' });

    // ========== RESUMO ==========
    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTE DO LOGIN CONCLUIDO!');
    console.log('='.repeat(60));

    console.log('\n📁 Screenshots salvos em .tmp/:');
    console.log('   1. login-01-email.png');
    console.log('   2. login-02-cpf.png');
    console.log('   3. login-03-password.png');
    console.log('   4. login-04-otp-empty.png');
    console.log('   5. login-05-otp-filled.png');
    console.log('   6. login-06-otp-whatsapp.png');
    console.log('   7. login-07-password-filled.png');
    console.log('   8. login-08-dashboard.png');

    console.log('\n⏳ Navegador ficara aberto por 15 segundos...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    await page.screenshot({ path: '.tmp/login-error.png' });
  } finally {
    await browser.close();
  }
}

testLogin();
