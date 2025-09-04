const socket = io();

// Manipula a mensagem 'msg1' enviada pelo servidor
socket.on('msg1', (message) => {
    const statusElement = document.getElementById('status');
    statusElement.innerText = message;
    console.log(message);
});

// "Thread 1" do cliente: Lida com a entrada do usuário
function sendMessage() {
    const inputElement = document.getElementById('inputMessage');
    const message = inputElement.value;
    if (message.trim() !== '') {
        // Envia a mensagem para o servidor
        socket.emit('client_message', message);
        inputElement.value = ''; // Limpa o campo de entrada
    }
}