const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { nextTick } = require('process');
const { type } = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Define a porta do servidor
const PORT = process.env.PORT || 3000;

// Define a quantidade máxima de clientes
const MAX_CLIENTS = 1;

// Serve os arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal para o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Variáveis de estado globais
const apostasClientes = new Map();
const configLoteria = { inicio: 0, fim: 100, qtd: 5 };

function quantidadeClientes () {
  return io.sockets.sockets.size;
}

// Função para realizar o sorteio (Thread 2 do Servidor)
function realizarSorteio() {
  console.log('--- REALIZANDO SORTEIO ---');
  console.log('Configuração atual:', configLoteria);
  console.log(`Clientes conectados: ${quantidadeClientes()}`);

  const { inicio, fim, qtd } = configLoteria;
  const numerosSorteados = new Set();
  while (numerosSorteados.size < qtd) {
    const numero = Math.floor(Math.random() * (fim - inicio + 1)) + inicio;
    numerosSorteados.add(numero);
  }
  const resultado = Array.from(numerosSorteados);
  console.log('Números sorteados:', resultado);

  // Percorre todos os clientes conectados
  for (const socketId of io.sockets.sockets.keys()) {
    // Verifica se o cliente fez alguma aposta
    const apostas = apostasClientes.get(socketId) || [];
    let mensagemParaCliente;
    
    if (apostas.length > 0) {
      const acertos = apostas.filter(aposta => numerosSorteados.has(aposta)); 
      mensagemParaCliente = {
        sorted: resultado,
        guesses: acertos,
        apostou: true
      };
      console.log(`Resultado enviado para ${socketId}: ${acertos.length} acertos.`);
    } else {
      // Cliente não apostou, envia apenas o resultado do sorteio com lista de acertos vazia
      mensagemParaCliente = {
        sorted: resultado,
        guesses: [],
        apostou: false
      };
      console.log(`Resultado do sorteio enviado para ${socketId}. O cliente não fez apostas.`);
    }
    
    // Envia a mensagem para o cliente
    io.to(socketId).emit('resultado_loteria', mensagemParaCliente);
  }

  // Zera a lista de apostas para o próximo ciclo
  apostasClientes.clear();
}

// Inicia o timer do sorteio em milissegundos 
setInterval(realizarSorteio, 60000);

io.use((socket, next) => {
  const clientesConectados = quantidadeClientes();

  if (clientesConectados >= MAX_CLIENTS) {
    console.log(`Conexão rejeitada para ${socket.id}: Limite de ${MAX_CLIENTS} clientes atingido`);
    const error = new Error('Servidor lotado. Limite máximo de clientes atingido');
    
    error.data = {
      type: 'SERVER_FULL',
      maxCLients: MAX_CLIENTS,
      clientesConectados: clientesConectados
    };
    return next(error);
  }

  console.log(`Conexão permitida: ${clientesConectados + 1} cliente(s) conectado(s)`);
  next();
})

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
  
    if (message.startsWith(':')) { // Lógica para interpretar comandos ou apostas
      const parts = message.split(' ');
      const command = parts[0];
      const value = parseInt(parts[1]);

      switch (command) {
        case ':inicio':
        case ':fim':
        case ':qtd':
          if (isNaN(value)) {
            socket.emit('lottery_error', 'O valor do comando deve ser um número válido.');
          } else {
            if (command === ':inicio') configLoteria.inicio = value;
            if (command === ':fim') configLoteria.fim = value;
            if (command === ':qtd') configLoteria.qtd = value;
            socket.emit('lottery_message', `Comando "${command}" executado com sucesso.`);
            console.log(`Configuração atualizada: ${command} = ${value}`);
          }
          break;
        case ':sair':
          console.log(`Cliente ${socket.id} solicitou desconexão`);
          socket.emit('saida_confirmada', 'Desconectando... até logo!');

          setTimeout(() => {
            socket.disconnect(true); // Força disconexão
            console.log(`Cliente ${socket.id} desconectado`)
          }, 500);
          break;
        default:
          socket.emit('lottery_error', `Comando inválido "${command}".`);
          console.log('Comando inválido:', command);
          break;
      }
    } else {
      // Lógica para apostas
      const numbers = message.split(' ').map(num => parseInt(num)).filter(num => !isNaN(num));
      const uniqueNumbers = new Set(numbers);
      const isInvalid = numbers.length === 0 || numbers.some(isNaN);

      if (isInvalid) {
        socket.emit('lottery_error', 'As apostas devem ser números separados por espaços.');
      } else if (numbers.length !== uniqueNumbers.size) {
        socket.emit('lottery_error', 'Aposta inválida. Não é permitido números repetidos.');
      } else if (numbers.length !== configLoteria.qtd) {
        socket.emit('lottery_error', `Aposta inválida. Por favor, digite exatamente ${configLoteria.qtd} números.`);
      } else {
        const outOfRange = numbers.some(num => num < configLoteria.inicio || num > configLoteria.fim);
        if (outOfRange) {
          socket.emit('lottery_error', `Aposta inválida. Todos os números devem estar entre ${configLoteria.inicio} e ${configLoteria.fim}.`);
        } else {
          // Aposta válida!
          const apostasAtuais = apostasClientes.get(socket.id) || [];
          apostasClientes.set(socket.id, apostasAtuais.concat(numbers));
          socket.emit('lottery_message', `Apostas [${numbers.join(', ')}] salvas com sucesso.`);
          console.log(`Apostas de ${socket.id} atualizadas:`, apostasClientes.get(socket.id));
        }
      }
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
  console.log(`Limite máximo de clientes: ${MAX_CLIENTS}`);
});