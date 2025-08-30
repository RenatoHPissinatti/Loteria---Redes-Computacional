import http from 'http';
import { Server } from 'socket.io';

const httpServer = http.createServer();

const io = new Server(httpServer, {
  cors: {origin: 'http/localhost:8080'}
});

io.on('coneection', (socket) => {
  console.log('cliente conectado', socket.id);

  //Enviar evento só para um cliente específico
  socket.emit('Welcome', {msg: 'Bem-vindo!'});

  //Receber evento do cliente
  socket.on('chat:message', payLoad, ackFn => {
    console.log('mensagem', payLoad);
    //Envia para todos, menos para o remetente
    socket.broadcast.emit('chat:massage', {from: socket.id, text: payLoad});
    //ack (se cliente forneceu callback)
    if (typeof ackFn === 'function') ackFn({ok: true});
  });

  //entrada e saída de rooms
  socket.on('join', (room) => socket.join(room));
  socket.on('leave', (room) => socket.leave(room));

  socket.on('disconnect', (reason) => console.log('disconectado', reason));
});

httpServer.listen(3000);