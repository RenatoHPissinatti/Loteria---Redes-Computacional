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

// Evento de conexão
io.on('connection', (socket) => {
  console.log('Um cliente conectado!');

  // Envia a mensagem de boas-vindas ao cliente
  const timestamp = new Date().toLocaleTimeString();
  socket.emit('msg1', `${timestamp}: CONECTADO!!`);

  // Lidar com desconexões
  socket.on('disconnect', () => {
    console.log('Cliente desconectado.');
  });
});

// Inicia o servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});