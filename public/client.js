const socket = io();

// Manipula a mensagem 'msg1' enviada pelo servidor
socket.on('msg1', (message) => {
    const statusElement = document.getElementById('status');
    statusElement.innerText = message;
    console.log(message);
});

// "Thread 1" do cliente: Lida com a entrada do usuário
function enviarMensagem() {
    const inputElement = document.getElementById('inputMessage');
    const message = inputElement.value;
    if (message.trim() !== '') {
        // Envia a mensagem para o servidor
        socket.emit('client_message', message);
        inputElement.value = ''; // Limpa o campo de entrada
    }
}

// "Thread 2" do cliente: Recebe o resultado do sorteio e mostra a quantidade de acertos
socket.on('resultado_loteria', (mensagemResultado) => {
    const messagesDiv = document.getElementById('messages');
    const p = document.createElement('p');

    const numerosSorteados = mensagemResultado.sorted;
    const acertosCorretos = mensagemResultado.guesses;

    if (acertosCorretos.length === 0 && mensagemResultado.sorted.length > 0) {
        // Se a lista de acertos for vazia, mostra "Você não apostou"
        p.innerText = `Resultado do sorteio: [${numerosSorteados.join(', ')}]. Você não apostou.`;
    } else {
        // Se houver acertos, mostra os números e os acertos
        p.innerText = `Números sorteados: [${numerosSorteados.join(', ')}]. Você acertou: [${acertosCorretos.join(', ')}].`;
    }
    
    messagesDiv.appendChild(p);
});

// Escuta por mensagens de erro do servidor
socket.on('lottery_error', (errorMessage) => {
    const messagesDiv = document.getElementById('messages');
    const p = document.createElement('p');
    p.innerText = `Erro: ${errorMessage}`;
    p.style.color = 'red';
    messagesDiv.appendChild(p);
});

// Escuta por mensagens de confirmação do servidor
socket.on('lottery_message', (confirmMessage) => {
    const messagesDiv = document.getElementById('messages');
    const p = document.createElement('p');
    p.innerText = `Sucesso: ${confirmMessage}`;
    p.style.color = 'green';
    messagesDiv.appendChild(p);
});