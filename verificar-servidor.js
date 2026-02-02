/**
 * Script para verificar que el servidor de desarrollo esté funcionando
 */

const http = require('http');

console.log('🔍 Verificando servidores...\n');

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

// Verificar JSON Server (puerto 3001)
const checkJsonServer = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001/usuarios', (res) => {
      console.log('✅ JSON Server está corriendo en el puerto 3001');
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log('❌ JSON Server NO está corriendo en el puerto 3001');
      console.log('   Error:', err.message);
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      console.log('❌ JSON Server NO está corriendo (timeout)');
      resolve(false);
    });
  });
};

(async () => {
  const viteOk = await checkVite();
  const jsonServerOk = await checkJsonServer();
  
  console.log('\n📊 Resumen:');
  console.log(`   Vite: ${viteOk ? '✅ OK' : '❌ NO OK'}`);
  console.log(`   JSON Server: ${jsonServerOk ? '✅ OK' : '❌ NO OK'}`);
  
  if (!viteOk) {
    console.log('\n💡 Para iniciar Vite, ejecuta:');
    console.log('   pnpm run dev');
  }
  
  if (!jsonServerOk) {
    console.log('\n💡 Para iniciar JSON Server, ejecuta:');
    console.log('   pnpm run server');
  }
  
  if (viteOk && jsonServerOk) {
    console.log('\n🎉 ¡Todo está funcionando correctamente!');
    console.log('   Abre http://localhost:5173 en tu navegador');
  }
})();

