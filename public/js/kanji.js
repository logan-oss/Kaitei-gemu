const player = {
    host: false,
    roomId: null,
    game: "kanji",
    private: false,
    username: "",
    socketId: "",
    ready: false,
    score: 0,
    win: false
};

const socket = io();

let playerScore = player.score;
let myPlayers = [];
let myTime;
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const roomId = urlParams.get('room');

const usernameInput = document.getElementById('username');
const codeParty = document.getElementById('codeParty');

const private = document.getElementById('private');
const formCode = document.getElementById('formCode');

const userCard = document.getElementById("user-card");
const gameCard = document.getElementById("cardGame");

const restartArea = document.getElementById("restart-area");
const readyArea = document.getElementById("ready-area");
const waitingArea = document.getElementById("waiting-area");
const waitGame = document.getElementById("wait-game");

const roomsCard = document.getElementById("rooms-card");
const roomsList = document.getElementById("rooms-list");

const linkToShare = document.getElementById("link-to-share")

const tablePlayer = document.getElementById("tablePlayer");
const crown = document.getElementById("crown-animation");
const readyBtn = document.getElementById("readyBtn");
const response = document.getElementById("response");
const imgKanji = document.getElementById('imgKanji');

let ennemyUsername = "";

if(roomId){
    socket.emit("kanjiTest", roomId);
    socket.on("kanjiTest", (res) => {
        if(res === true){
            document.getElementById("start").innerText = "Rejoindre";
        }else{
            window.location.href = "/games/kanji";
        }
    })
}

// récupère
socket.emit('get rooms');
socket.on('list rooms', (rooms) => {
    let html = "";
    if(rooms.length > 0 ){
        rooms.forEach(room => {
          console.log(room)
            if(room.players.length !== 7 && room.private === false){
                if(room.inGame){
                    html += `<li class="list-group-item d-flex justify-content-between">
                <p class="p-0 m-0 flex-grow-1 fw-bold">Salon de ${room.players[0].username} - ${room.id} - Partie en cours...</p>
                <button class="btn btn-sm btn-success join-room" data-room="${room.id}">Rejoindre</button>
            </li>`;
                }else{
                    html += `<li class="list-group-item d-flex justify-content-between">
                <p class="p-0 m-0 flex-grow-1 fw-bold">Salon de ${room.players[0].username} - ${room.id}</p>
                <button class="btn btn-sm btn-success join-room" data-room="${room.id}">Rejoindre</button>
            </li>`;
                }
            }
        });
    }

    if(html !== ""){
        if(roomId){
            roomsCard.classList.add("d-none");
            chkPrivate.classList.add("d-none");
            formCode.classList.add("d-none");

        }else{
            roomsCard.classList.remove('d-none');
            roomsList.innerHTML = html;

            for(const element of document.getElementsByClassName('join-room')){
                element.addEventListener('click', joinRoom, false);
            };
        }
    }
})

$("#form").on('submit', function(e){
    e.preventDefault();

    player.username = usernameInput.value;

    if(roomId){
        player.roomId = roomId;
    }else{
        player.host = true;
        if(private.checked === true){
            player.private = true;
        }
    }

    player.socketId = socket.id;
    userCard.hidden = true;
    roomsCard.classList.add('d-none');
    waitingArea.classList.remove('d-none');
    socket.emit("playerData", player);
})

$("#formCode").on('submit', function(e){
    e.preventDefault();
    socket.emit("kanjiTest", (codeParty.value).trim());
    socket.on("kanjiTest", (res) => {
        if(res === true){
            document.location.href += "?room="+(codeParty.value).trim();
        }
    })
})

socket.on('join room', (room) => {
    player.roomId = room.roomId;
    linkToShare.innerHTML = player.roomId;
    readyArea.classList.remove('d-none');
    if(room.inGame){
        //$("#wait-game").classList.remove("d-none");
        readyArea.classList.add('d-none');
        waitingArea.classList.add("d-none");
        waitGame.classList.remove("d-none");
        gameCard.classList.remove("d-none");
        $("#kanji").hide();
    }
});

socket.on('start game', (players) => {
    socket.emit("start game");
    startGame(players);
    waitingArea.classList.add("d-none");
    readyBtn.classList.add("d-none");
    crown.classList.add("d-none");
    imgKanji.classList.remove("d-none");
});

socket.on('join player', (players) => {
    myPlayers = players;
    tablePlayers(players);
});

socket.on('disconnect player', (players) => {
    myPlayers = players;
    tablePlayers(players);
});

socket.on('play', (ennemyPlayer) => {
    if(ennemyPlayer.socketId !== player.socketId){

    }

    if(ennemyPlayer.win){
        return;
    }
})

function startGame(players){

    printScore(players);
    restartArea.classList.add('d-none');

}

socket.on("time", (time) => {
    myTime = time;
    var audio = new Audio('../sound/tic.mp3');
    audio.play();
    $('#chrono').text(10 - myTime)
    $('#chrono').show();
})

socket.on("get kanji", (kanji) => {
    $("#wait-game").hide();
    $("#kanji").show();
    response.classList.remove("d-none");
    gameCard.classList.remove("d-none");
    $("#reponse").text("");
    $("#resultat").text("");
    $("#imgKanji").attr("src",kanji.img);
    $("#imgKanji").attr("alt",kanji.kanji);
    $("#responseInput").val("");
    $("#responseInput").focus();
    console.log(kanji);
})

socket.on("manche fini", (kanji) => {
    $("#imgKanji").attr("src",kanji.visuel);
    $("#reponse").text("La réponse était "+kanji.traduction);
    $('#chrono').text("");
    response.classList.add("d-none");
    myTime = 10;
    myPlayers = kanji.players
    printScore(myPlayers);
})
$("#formKanji").on("submit", function(e){
    e.preventDefault();
    let response = $("#responseInput").val().trim()
    socket.emit("get response kanji", ({response , player, time:myTime}));
})

socket.on("get score", (setPlayer) => {
    setScore(setPlayer);
})

socket.on("winner", (winner) => {
    $("#winner").text(winner.username);
    imgKanji.classList.add("d-none");
    crown.classList.remove("d-none")
    $("#reponse").text("");
    if(winner.socketId === player.socketId){
        var audio = new Audio('../sound/win.mp3');
        audio.play();
      $("#resultat").html("Bravo !!!</br>Continue comme ça !");
    }else{
        var audio = new Audio('../sound/lose.mp3');
        audio.play();
      $("#resultat").html("Dommage...</br>Tu feras mieux la prochaine fois !");
    }
    readyArea.classList.remove('d-none');
    readyBtn.classList.remove("d-none");
    tablePlayers(myPlayers)
})

const joinRoom = function(){
    if(usernameInput.value !== ""){
        player.username = usernameInput.value;
        player.socketId = socket.id;
        player.roomId = this.dataset.room;

        socket.emit("playerData", player);
        userCard.hidden = true;
        roomsCard.classList.add('d-none');
        waitingArea.classList.remove('d-none');
    }
}

function ready(){
    player.ready = true;
    socket.emit("ready", player);
}

socket.on('ready', (players) => {
    tablePlayers(players);
});

function tablePlayers(players){
    let html = "<h3 class='mb-2'>Players</h3>";
    players.forEach(player => {
        if(player.ready === false){
            html += "<div class='col-12 text-center p-1'>"+player.username+" Pas prêt</div>"
        }else{
            html += "<div class='col-12 text-center p-1'>"+player.username+" Prêt</div>"
        }
    })
    tablePlayer.innerHTML = "";
    tablePlayer.innerHTML = html;
    tablePlayer.classList.remove('d-none');
}

function printScore(players){
     players.sort(function (a, b) {
         return b.score - a.score;
     })

    let html = "<h3 class='mb-2'>Score</h3>";
    players.forEach(p => {
            if(p.socketId === player.socketId){
                if(p.win){
                    response.classList.add("d-none");
                    html += "<div class='col-12 text-center bg-white p-1'><b>"+p.username+" : "+p.score+" pt </b></div>"
                }else{
                    html += "<div class='col-12 text-center p-1'><b>"+p.username+" : "+p.score+" pt </b></div>"
                }
            }else{
                if(p.win === false){
                    html += "<div class='col-12 text-center p-1'>"+p.username+" : "+p.score+" pt </div>"
                }else{
                    html += "<div class='col-12 text-center bg-white p-1'>"+p.username+" : "+p.score+" pt</div>"
                }
            }
    })
    tablePlayer.innerHTML = "";
    tablePlayer.innerHTML = html;
    tablePlayer.classList.remove('d-none');
}

function setScore(setPlayer){
     myPlayer = myPlayers.find(element => element.socketId === setPlayer.socketId);
       if(myPlayer.socketId === player.socketId){
         if(setPlayer.win){
             var audio = new Audio('../sound/succes.mp3');
             myPlayer.win = true;
             myPlayer.score = setPlayer.score;
             response.classList.add("d-none");
             $("#resultat").text("Bien joué !");
             playerScore = myPlayer.score;
             audio.play();
         }else{
             if(myTime < 10){
                 $("#resultat").text("Mauvaise réponse !");
                 let inputField = document.getElementById("responseInput");
                 inputField.classList.add("bounce");
                setTimeout(function() {
                //remove the class so animation can occur as many times as user triggers event, delay must be longer than the animation duration and any delay.
                inputField.classList.remove("bounce");
                }, 1000); 
             }
         }
       }else{
           if(setPlayer.win){
               myPlayer.win = true;
               myPlayer.score = setPlayer.score;
               var audio = new Audio('../sound/point.mp3');
               audio.play();
           }
       }
       printScore(myPlayers);
}
