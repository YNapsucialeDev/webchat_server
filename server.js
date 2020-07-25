const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidv4} = require('uuid');

//seteamos el view engine
app.set('view engine', 'ejs');
app.use(express.static('public'));

//ponemos una ruta raiz para generar ids dinamicos para los chat rooms
app.get('/', (req, res) => {
    //esto se hace para entrar directamente a una sala si entramos a root
    res.redirect(`/${uuidv4()}`)
});

//seteamos el render del template de chat si entramos directamente a una chat con id especifico
app.get('/:room', (req, res) => {
    res.render('room', {
        roomID: req.params.room
    })
});

//correr websockets
io.on('connection', socket => {
    socket.on('join-room', (roomID, userID) => {
        //avisarle a todos los demas usuarios en el room que alguien mas entro
        socket.join(roomID);
        socket.to(roomID).broadcast.emit('user-connected', userID); //enviale a los demas menos a mi, porque yo ya se que estoy entrando
        //emitir evento cuando alguien se desconecta para que sepan cuando deben remover el elemento video
        socket.on('disconnect', () => {
            socket.to(roomID).broadcast.emit('user-disconnected', userID);
        });
    });
});

//lanzar http server
server.listen(3000);