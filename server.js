const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Define a porta do servidor
const PORT = process.env.PORT || 3000;

// Serve os arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal para o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
const apostasClientes = new Map();
const configLoteria = {inicio: 0, fim: 100, qtd:5};
// Evento de conexão
io.on('connection', (socket) => {
  console.log('Um cliente conectado!');

  // Envia a mensagem de boas-vindas ao cliente
  const timestamp = new Date().toLocaleTimeString();
  socket.emit('msg1', `${timestamp}: CONECTADO!!`);
socket.on('enviar_comando', (mensagem) => {
    if (mensagem.startsWith(':')) {
      const [comando, valor] = mensagem.split(' ');
      // Modifica a variável configLoteria que está lá fora
      if (comando === ':inicio') configLoteria.inicio = parseInt(valor);
      if (comando === ':fim') configLoteria.fim = parseInt(valor);
      if (comando === ':qtd') configLoteria.qtd = parseInt(valor);
      console.log('Configuração da loteria atualizada:', configLoteria);
    } else {
      const numeros = mensagem.split(' ').map(n => parseInt(n));
      apostasClientes.set(socket.id, numeros);
    }
  });
  // Lidar com desconexões
  socket.on('disconnect', () => {
    console.log('Cliente desconectado.');
  });
});
function realizarSorteio() {
  console.log('--- REALIZANDO SORTEIO ---');
  console.log('Configuração atual:', configLoteria); // Agora vai funcionar!

  const { inicio, fim, qtd } = configLoteria;
  const numerosSorteados = new Set();

  while (numerosSorteados.size < qtd) {
    const numero = Math.floor(Math.random() * (fim - inicio + 1)) + inicio;
    numerosSorteados.add(numero);
  }

  const resultado = Array.from(numerosSorteados);
  console.log('Números sorteados:', resultado);
}

// Inicia o timer do sorteio
setInterval(realizarSorteio, 60000);

// Inicia o servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

httpServer.listen(3000);