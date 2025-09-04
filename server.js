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

 // Inicializa a lista de apostas para o novo cliente no Map
 apostasClientes.set(socket.id, []);

  // Envia a mensagem de boas-vindas ao cliente
  const timestamp = new Date().toLocaleTimeString();
  socket.emit('msg1', `${timestamp}: CONECTADO!!`);
socket.on('enviar_comando', (mensagem) => {
    if (mensagem.startsWith(':')) {
      const [comando, valor] = mensagem.split(' ');
      const valorNum = parseInt(valor, 10);
      if (isNaN(valorNum)){
        socket.emit('erro', `Valor inválido para ${comando}. Lembre-se de usar somente números inteiros!`);
        return;
      }

      if (comando === ':inicio') configLoteria.inicio = valorNum;
      if (comando === ':fim') configLoteria.fim = valorNum;
      if (comando === ':qtd') configLoteria.qtd = valorNum;
      console.log('Configuração da loteria atualizada:', configLoteria);
      socket.emit('info','Configuração atualizada com sucesso!');
    } else {
      const numeros = mensagem.split(' ').map(n => n.trim()).map(Number);
      
    
      if (numerosApostados.some(isNaN)) {
      socket.emit('erro', 'Aposta inválida. Por favor, envie apenas números separados por espaço.');
      return;}
      if (numerosApostados.length !== configLoteria.qtd){
        socket.emit('erro',`Aposta inválida. Você deve apostar exatamente ${configLoteria.qtd} números!`)
        
        return;
      }
    
    apostasClientes.set(socket.id, numeros);
    console.log(`Aposta de ${socket.id} recebida!`, numerosApostados);
    socket.emit('info', 'Sua aposta foi recebida! Aguardando o sorteio e boa sorte!');
    
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