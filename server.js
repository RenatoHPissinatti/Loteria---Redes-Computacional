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

// Variáveis de estado globais
const apostasClientes = new Map();
const configLoteria = { inicio: 0, fim: 100, qtd: 5 };

// Função para realizar o sorteio (Thread 2 do Servidor)
function realizarSorteio() {
 console.log('--- REALIZANDO SORTEIO ---');
 console.log('Configuração atual:', configLoteria);

 const { inicio, fim, qtd } = configLoteria;
 const numerosSorteados = new Set();
 while (numerosSorteados.size < qtd) {
  const numero = Math.floor(Math.random() * (fim - inicio + 1)) + inicio;
  numerosSorteados.add(numero);
 }
 const resultado = Array.from(numerosSorteados);
 console.log('Números sorteados:', resultado);

 // Percorre todos os clientes que fizeram apostas
 for (const [socketId, apostas] of apostasClientes.entries()) {
  if (apostas.length > 0) {
   const acertos = apostas.filter(aposta => numerosSorteados.has(aposta)); 

 // Envia o resultado para o cliente
   io.to(socketId).emit('lottery_result', {
    sorted: resultado,
    guesses: acertos
   });
  console.log(`Resultado enviado para ${socketId}: ${acertos.length} acertos.`);
  }
 }

 // Zera a lista de apostas para o próximo ciclo
 apostasClientes.clear();
}

// Inicia o timer do sorteio
setInterval(realizarSorteio, 60000);

// Evento de conexão
io.on('connection', (socket) => {
 console.log(`Um cliente conectado! ${socket.id}`);

 // Inicializa a lista de apostas para o novo cliente no Map
 apostasClientes.set(socket.id, []);

 // Envia a mensagem de boas-vindas ao cliente
 const timestamp = new Date().toLocaleTimeString();
 socket.emit('msg1', `${timestamp}: CONECTADO!!`);

 // Thread 1 do servidor: Aguardando mensagens do cliente
 socket.on('client_message', (message) => {
  console.log(`Mensagem recebida do cliente ${socket.id}: ${message}`);
 
  if (message.startsWith(':')) {       // Lógica para interpretar comandos ou apostas
   const parts = message.split(' ');
   const command = parts[0];
   const value = parseInt(parts[1]);
   switch (command) {
    case ':inicio':
     if (!isNaN(value)) {
      configLoteria.inicio = value;
      console.log(`Configuração atualizada: início = ${configLoteria.inicio}`);
     }
     break;
    case ':fim':
     if (!isNaN(value)) {
     configLoteria.fim = value;
      console.log(`Configuração atualizada: fim = ${configLoteria.fim}`);
          }
          break;
        case ':qtd':
          if (!isNaN(value)) {
            configLoteria.qtd = value;
            console.log(`Configuração atualizada: quantidade = ${configLoteria.qtd}`);
          }
          break;
        default:
          console.log('Comando inválido:', command);
      }
    } else {
      const numeros = message.split(' ').map(num => parseInt(num)).filter(num => !isNaN(num));
      const apostasAtuais = apostasClientes.get(socket.id) || [];
      apostasClientes.set(socket.id, apostasAtuais.concat(numeros));
      console.log(`Apostas de ${socket.id} atualizadas:`, apostasClientes.get(socket.id));
    }
  });

  // Lidar com desconexões
  socket.on('disconnect', () => {
    console.log('Cliente desconectado.');
    apostasClientes.delete(socket.id);
  });
});

// Inicia o servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});