const socket = io();

// Manipula a mensagem 'msg1' enviada pelo servidor
socket.on('msg1', (message) => {
    const statusElement = document.getElementById('status');
    statusElement.innerText = message;
    console.log(message);
});