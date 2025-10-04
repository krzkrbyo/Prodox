// Script de prueba para verificar la API de Google Calendar
// Ejecutar con: node test-calendar-api.js

const testCalendarId = 'primary'; // Usar 'primary' para el calendario principal

async function testCalendarAPI() {
  try {
    console.log('🧪 Probando API de Google Calendar...');
    
    // Test 1: Validar Calendar ID
    console.log('\n1. Validando Calendar ID...');
    const validateResponse = await fetch('http://localhost:3000/api/google/calendar/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calendarId: testCalendarId }),
    });
    
    console.log('Status:', validateResponse.status);
    const validateData = await validateResponse.json();
    console.log('Response:', validateData);
    
    if (validateResponse.ok) {
      console.log('✅ Validación exitosa');
      
      // Test 2: Obtener eventos
      console.log('\n2. Obteniendo eventos...');
      const pullResponse = await fetch('http://localhost:3000/api/google/calendar/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      console.log('Pull Status:', pullResponse.status);
      const pullData = await pullResponse.json();
      console.log('Eventos encontrados:', pullData.length);
      
      // Test 3: Enviar evento de prueba
      console.log('\n3. Enviando evento de prueba...');
      const testEvent = {
        title: 'Prueba desde FocusBoard',
        description: 'Evento de prueba creado desde la aplicación',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hora después
        allDay: false,
        fbTaskId: 'test-task-123'
      };
      
      const pushResponse = await fetch('http://localhost:3000/api/google/calendar/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: [testEvent] }),
      });
      
      console.log('Push Status:', pushResponse.status);
      const pushData = await pushResponse.json();
      console.log('Resultado:', pushData);
      
      console.log('\n✅ Todas las pruebas completadas exitosamente');
    } else {
      console.log('❌ Error en la validación:', validateData.error);
    }
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar las pruebas
testCalendarAPI();
