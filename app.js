const { Socket } = require('socket.io');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');
const port = 8080;

/**
 * @type {Socket}
 */
const io = require("socket.io")(http);

app.use('/bootstrap/css',express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')))
app.use('/bootstrap/js',express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')))
app.use('/bootstrap/js',express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')))
app.use('/jquery',express.static(path.join(__dirname, 'node_modules/jquery/dist')))
app.use(express.static('public'));

app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname, 'templates/index.html'));
});

app.get('/games/kanji', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates/games/kanji.html'));
})

http.listen(port, () => {
    console.log(`Lisening on http://localhost:${port}/games/kanji`);
});

let rooms = [];
let kanji = [{ id: 1, kanji: "月", kana: "つき", traduction: "lune", difficulte: 1, img_kanji: "https://ae01.alicdn.com/kf/HTB1Qg8Ua5jrK1RjSsplq6xHmVXae.jpg?width=800&height=800&hash=1600", visuel: "https://static.actu.fr/uploads/2021/08/adobestock-297400017.jpeg", description: "" },
{ id: 2, kanji: "水", kana: "みず", traduction: "eau", difficulte: 1, img_kanji: "https://lh3.googleusercontent.com/proxy/yyrUAPyRKBTNqT9SupGNO4Sa5-vztT7hPk7BWB-hAd3YdwkafEHoO2ANQ7dWoYUJui6Ijb8pE00g8i0Kz9SNU0pJ4EZre_iKe61H44YdpGIaRYlDVPmbNCuazu5PeRb4GY4DMVzGReCYChrbKKjv-o_6_e2VD9Azlq8", visuel: "https://www.weka.fr/actualite/wp-content/uploads/2021/04/eau-et-assainissement-la-gestion-publique-des-services-un-atout-pour-les-collectivites-1280x720.jpg", description: "" },
{ id: 3, kanji: "風", kana: "かぜ", traduction: "vent", difficulte: 1, img_kanji: "https://i.skyrock.net/4857/51654857/pics/2142078567_1.gif", visuel: "https://cdn.radiofrance.fr/s3/cruiser-production/2021/06/26f3627c-db89-46b8-adce-f4af974d7f61/1136_tempete.jpg", description: "" },
]

io.on('connection', (socket) => {
    console.log(`[connection]`+socket.id)

    // récupère les datas du joueur qui se connecte à une partie
    socket.on('playerData', (player) => {
        console.log(`[playerData] ${player.username}`);
        let room = null;

        // si le joueur n'appartient pas à une room, on lui en créé une. 
        if(!player.roomId){
            room = createRoom(player);
            console.log(`[create room ] - ${room.id} - ${player.username}`);
        }else {
            room = rooms.find(r => r.id === player.roomId);

            if(room === undefined){
                return;
            }

            room.players.push(player);
        }

        socket.join(room.id);
        io.to(socket.id).emit('join room', room.id); // on envoi au joueur l'id de la room
        io.to(room.id).emit('join player', room.players); // on envoi aux joueurs de la room les joueurs
    });

    // pour room dans url, je test su la room existe
    socket.on("kanjiTest", (roomId) => {
        room = rooms.find(r => r.id === roomId);
            if(room === undefined){
                room = false
            }else{
                room = true;
            }
        io.to(socket.id).emit("kanjiTest", room);
    })

    // si le joueur est prêt
    socket.on("ready", (player) => {
        room = rooms.find(r => r.id === player.roomId);
        roomId = room.id;
            players = room.players;
            player = players.find(element => element.socketId === player.socketId);
            player.ready = true;
            start = true;
            players.forEach(p => { // si tous les joueurs sont prêt, je start, sinon j'envoi la liste des joueurs de la room
                if(p.ready === false){
                    start = false;
                }
            })
            if(start === false){
                io.to(room.id).emit("ready", players);
            }else{
                io.to(roomId).emit("start game", players);
                KanjiStart(room);
            }
    })

    // j'envoi la liste des rooms
    socket.on('get rooms', () => {
        io.to(socket.id).emit('list rooms', rooms);
    });

    socket.on('play', (player) => {
        io.to(player.roomId).emit('play', player);
    })

    socket.on('disconnect', () => {
        console.log(`[disconnect] ${socket.id}`);
        let room = null;

        rooms.forEach(r => {
            r.players.forEach(p => {
                if(p.socketId === socket.id && p.host){
                    room = r;
                    rooms = rooms.filter(r => r !== room);
                }

                if(p.socketId === socket.id){
                    console.log(p.username);
                    player = p
                    r.players = r.players.filter(p => p !== player);
                    console.log(r.players)
                    io.to(p.roomId).emit('disconnect player', r.players);
                }
            })
        })
    })

    function KanjiStart(room){
        let win = false;
        let winner;
        players = room.players;
            this.manche = function(){
                KanjiGame();
            }
            KanjiGame();
            setInterval(this.manche.bind(this), 25000);

            function KanjiGame(){
                if(win){
                    io.to(room.id).emit('winner', winner);
                    return;
                }
                let monKanji = kanji[Math.floor(Math.random()*kanji.length)];
                io.to(room.id).emit('get kanji', monKanji);
                socket.on("get kanji", (p) => {
                    console.log(p.username);
                })
                let time = 0;
                socket.on("get response", (res) => {
                    console.log("ok")
                        response = (res.response).split(' ');
                        player = (res.player)
                        player = players.find(element => element.socketId === player.socketId);
                        console.log(res.response)
                        response.forEach(word => {
                            if(word === monKanji.traduction){
                                player.score += 10 - time;
                                if(player.score >= 50){
                                    win = true;
                                    if(!winner){
                                        winner = player;
                                    }
                                }
                                io.to(room.id).emit('get score', room.players);
                            }
                        })
                });
                this.run = function() {
                    timer();
                }
                timer();
                setInterval(this.run.bind(this), 2000);

                function timer(){
                    if(time === 10){
                        return;
                    }else{
                        io.to(room.id).emit('time', time);
                        time += 1;
                    }
                }
            }
        }
});

function createRoom(player) {
    const room = { id: roomId(), players: [], private: false, game: "" };

    player.roomId = room.id;

    room.players.push(player);
    room.private = player.private;
    room.game = player.game;
    rooms.push(room);

    return room;
}

function roomId() {
    let code = (Math.random().toString(36).substr(2,5)).toUpperCase();
    while(rooms.find(room => room.id === code)){
        code = (Math.random().toString(36).substr(2,5)).toUpperCase();
    }
    return code;
}
