/*
Função que garente que o só seja executado
 após o carregamento completo da página 
 */
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const log = document.getElementById('log');

    function addMessage(message, type = 'system') {
        const msgElement = document.createElement('div');
        msgElement.className = type;
        msgElement.textContent = message;
        log.appendChild(msgElement);
        log.scrollTop = log.scrollHeight;
    }

    socket.on('connect', () => {
        addMessage('Conectado ao servidor');
    });

    socket.on('disconnect', () => {
        addMessage('Desconectado do servidor');
    });

    socket.on('msg1', (data) => {
        addMessage(`Servidor: ${data}`);
    });

    socket.on('lottery_result', (data) => {
        const { sorted, guesses } = data;
        const correctNumbers = guesses.filter(num => sorted.includes(num));
        addMessage(`Números sorteados: [${sorted.join(', ')}] | ` +
                   `Acertos: ${correctNumbers.length} (${correctNumbers.join(', ')})`);
    });

    function enviarAposta() {
        const message = messageInput.value.trim();
        if (message) {
            socket.emit('client_message', message);
            addMessage(`Você: ${message}`, 'user-message');
            messageInput.value = '';
        }
        messageInput.focus();
    }
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarAposta();
    });

    messageInput.focus();
});