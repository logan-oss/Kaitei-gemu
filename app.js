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
let roomGame = [];
let kanji = [{ id: 1, kanji: "月", kana: "つき", traduction: "lune", difficulte: 1, img_kanji: "https://ae01.alicdn.com/kf/HTB1Qg8Ua5jrK1RjSsplq6xHmVXae.jpg?width=800&height=800&hash=1600", visuel: "https://static.actu.fr/uploads/2021/08/adobestock-297400017.jpeg", description: "" },
{ id: 2, kanji: "水", kana: "みず", traduction: "eau", difficulte: 1, img_kanji: "https://publicdomainvectors.org/photos/1326635076.png", visuel: "https://www.weka.fr/actualite/wp-content/uploads/2021/04/eau-et-assainissement-la-gestion-publique-des-services-un-atout-pour-les-collectivites-1280x720.jpg", description: "" },
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
                KanjiStart(room)
            }
    })

    socket.on("get response kanji", (res) => {
            response = (res.response).split(' ');
            player = (res.player)
            let myRoomGame =  roomGame.find(element => element.roomId === player.roomId);
            let room = rooms.find(element => element.id === myRoomGame.roomId);
            let players = room.players;
            let monKanji = myRoomGame.kanji;
            player = players.find(element => element.socketId === player.socketId);
            response.forEach(word => {
                if(word === monKanji.traduction){
                    player.score += 10 - res.time;
                    player.win = true;
                    if(player.score >= 10){
                        if(!myRoomGame.winner){
                            myRoomGame.winner = player;
                        }
                    }
                }
                io.to(room.id).emit('get score', player);
            })
    });

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

                if(p.socketId === socket.id){
                    console.log(p.username);
                    player = p
                    r.players = r.players.filter(p => p !== player);
                    if(r.players.length === 0){
                      if(!roomGame.find(element => element.roomId === r.id)){
                              roomGame = roomGame.filter(r => r.roomId !== r.id);
                            }
                      rooms = rooms.filter(room => room !== r);
                    }else{
                      console.log(r.players)
                      io.to(p.roomId).emit('disconnect player', r.players);
                    }
                }
            })
        })
    })

    function KanjiStart(room){
            KanjiGame();


            function KanjiGame(){
                if(thisRoom = rooms.find(element => element.id === room.id)){

                }else{
                  return;
                }
                players = thisRoom.players;
                let monKanji;
                if(myRoom = roomGame.find(element => element.roomId === thisRoom.id)){
                    if(myRoom.winner){
                        io.to(room.id).emit('winner', myRoom.winner);
                        let index = roomGame.indexOf(myRoom)
                        roomGame.splice(index, 1)
                        return;
                    }else{
                    monKanji = kanji[Math.floor(Math.random()*kanji.length)];
                    myRoom.kanji = monKanji;
                    }
                }else{
                    monKanji = kanji[Math.floor(Math.random()*kanji.length)];
                    let myRoom = {roomId: thisRoom.id, kanji: monKanji, winner:null}
                    roomGame.push(myRoom);
                }
                io.to(room.id).emit('get kanji', {kanji:monKanji.kanji, img:monKanji.img_kanji});
                let time = 0;
                let res = 0;
                let resTime;
                this.run = function() {
                    timer();
                }
                timer();
                let Timer = setInterval(this.run.bind(this), 1500);

                function timer(){
                    if(rooms.find(element => element.id === thisRoom.id)){
                      players = rooms.find(element => element.id === thisRoom.id).players;
                    }else{
                      clearInterval(Timer);
                      return;
                    }
                    if(time === 10){
                        players.forEach(p => {
                            p.win = false;
                        })
                        io.to(room.id).emit('manche fini', {traduction:monKanji.traduction, visuel:monKanji.visuel, players});
                        resTimer();
                        let resTime = setInterval(resTimer, 1500);
                        clearInterval(Timer);
                    }else if(time < 10){
                        if(players.find(element => element.win === false)){
                        io.to(room.id).emit('time', time);
                      }else{
                        players.forEach(p => {
                            p.win = false;
                        })
                        io.to(room.id).emit('manche fini', {traduction:monKanji.traduction, visuel:monKanji.visuel, players});
                        resTimer();
                        let resTime = setInterval(resTimer, 1500);
                        clearInterval(Timer);
                        return;
                      }
                    }
                    console.log("2")
                    time += 1;

                    function resTimer(){
                      if(res === 3){
                        clearInterval(resTime);
                        KanjiGame();
                      }
                      res += 1
                    }
                }
              }
        }
});

function createRoom(player) {
    console.log(roomId())
    const room = { id: roomId(), players: [], private: false, game: "" };

    player.roomId = room.id;

    room.players.push(player);
    room.private = player.private;
    room.game = player.game;
    rooms.push(room);

    return room;

    function roomId() {
        let code = (Math.random().toString(36).substr(2,5)).toUpperCase();
        while(rooms.find(room => room.id === code)){
            code = (Math.random().toString(36).substr(2,5)).toUpperCase();
        }
        return code;
    }
}
