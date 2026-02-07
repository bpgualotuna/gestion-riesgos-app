/**
 * Script para verificar que el servidor de desarrollo esté funcionando
 */

const http = require('http');

console.log('🔍 Verificando servidor...\n');

// Verificar Vite (puerto 5173)
const checkVite = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5173', (res) => {
      console.log('✅ Vite está corriendo en el puerto 5173');
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log('❌ Vite NO está corriendo en el puerto 5173');
      console.log('   Error:', err.message);
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      console.log('❌ Vite NO está corriendo (timeout)');
      resolve(false);
    });
  });
};

(async () => {
  const viteOk = await checkVite();
  
  console.log('\n📊 Resumen:');
  console.log(`   Vite: ${viteOk ? '✅ OK' : '❌ NO OK'}`);
  
  if (!viteOk) {
    console.log('\n💡 Para iniciar Vite, ejecuta:');
    console.log('   pnpm run dev');
  } else {
    console.log('\n🎉 ¡El servidor está funcionando correctamente!');
    console.log('   Abre http://localhost:5173 en tu navegador');
  }
})();

