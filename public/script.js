const socket = io('/');
const videoGrid = document.getElementById('video-grid');

//al crear mi webrtc server, se pasa como parametro undefined, para dejar que peer genere una sesion automaticamente, este parametro implica que puedes conectarte multiplemente
// a un webrtc server con datos como el id del server especifico para multiples apps de chat como tal
const myPeer = new Peer(undefined, {
    host: '/',
    port: '3001'
});

const myVideo = document.createElement('video');
//muteamos nuestro propio video, porque sino vamos a escuchar nuestro propio audio
myVideo.muted = true;

//almacenar el state del room para saber como tenemos que actuar cuando alguien entre o se salga para actalizar dicho state

const peers = {};

//conectamos nuestro video
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(myVideo, stream);

    //escuchar cuando alguien nos llama
    myPeer.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
        });
    });

    socket.on('user-connected', userID => {

        //cuando un usuario nuevo se conecta, le enviamos nuestro id y nuestro stream para que nos escuche y nos vea y sepa quienes somos
        connectToNewUser(userID, stream);
    });
});

//escuchar evento cuando alguien se sale de la sala para poder remover su elemento video y stream
socket.on('user-disconnected', userID => {
    //si el id de la conexion existe en el room lo sacamos
    if(peers[userID]) {
        peers[userID].close();
    }
});

//utilizamos peer js que es la que maneja todo lo que implica las conexiones para audio y video por medio de webrtc
myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
});

//escuchar cuando alguien entra
socket.on('user-connected', userID => {
    console.log(`El usuario ${userID}, se ha conectado`);
});

//function para que nuestro elemento video use el stream de video de mediaDevices del navegador
function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });

    videoGrid.append(video);
}

function connectToNewUser(userID, stream) {
    //enviar nuestro feed al otro usuario en el missmo webrtc server
    const call = myPeer.call(userID, stream);
    //creamos un elemento video para cada nuevo usuario que se una a nuestro servidor webrtc
    const video = document.createElement('video');
    //y recibimos stream de ellos agregandolo a un nuevo elemento video que aparecera en el grid
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    });

    //remover video si alguien se sale del server de webrtc
    call.on('close', () => {
        video.remove();
    });

    peers[userID] = call;
}