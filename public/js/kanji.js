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

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const roomId = urlParams.get('room');

const usernameInput = document.getElementById('username');
const codeParty = document.getElementById('codeParty');

const private = document.getElementById('private');
const formCode = document.getElementById('formCode');

const userCard = document.getElementById("user-card");

const restartArea = document.getElementById("restart-area");
const readyArea = document.getElementById("ready-area");
const waitingArea = document.getElementById("waiting-area");

const roomsCard = document.getElementById("rooms-card");
const roomsList = document.getElementById("rooms-list");

const linkToShare = document.getElementById("link-to-share")

const tablePlayer = document.getElementById("tablePlayer");

const readyBtn = document.getElementById("readyBtn");
const response = document.getElementById("response");

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

socket.emit('get rooms');
socket.on('list rooms', (rooms) => {
    let html = "";
    if(rooms.length > 0 ){
        rooms.forEach(room => {
            if(room.players.length !== 7 && room.private === false){
                html += `<li class="list-group-item d-flex justify-content-between">
                <p class="p-0 m-0 flex-grow-1 fw-bold">Salon de ${room.players[0].username} - ${room.id}</p>
                <button class="btn btn-sm btn-success join-room" data-room="${room.id}">Rejoindre</button>
            </li>`;
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

socket.on('join room', (roomId) => {
    player.roomId = roomId;
    linkToShare.innerHTML = player.roomId;
    readyArea.classList.remove('d-none');
});

socket.on('start game', (players) => {
    startGame(players);
    waitingArea.classList.add("d-none");
    readyBtn.classList.add("d-none");
});

socket.on('join player', (players) => {
    tablePlayers(players);
});

socket.on('disconnect player', (players) => {
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
    tablePlayers(players);
    restartArea.classList.add('d-none');
    socket.on("time", (time) => {
        console.log(time);
    })
    
    socket.on("get kanji", (kanji) => {
        response.classList.remove("d-none");
        $("#responseInput").val("");
        $("#responseInput").focus();
        console.log(kanji);
        socket.emit("get kanji", (player));
        $("#formKanji").on("submit", function(e){
            e.preventDefault();
            let response = $("#responseInput").val().trim()
            console.log(socket.emit("get response", ({response , player})));
        })
    })
    
    socket.on("get score", (players) => {
        printScore(players);
    })

}

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
            html += "<div class='col-12 text-center'>"+player.username+" Pas prêt</div>"
        }else{
            html += "<div class='col-12 text-center'>"+player.username+" Prêt</div>"
        }
    })
    tablePlayer.innerHTML = "";
    tablePlayer.innerHTML = html;
    tablePlayer.classList.remove('d-none');
}

function printScore(players){
     players.sort(function (a, b) {
         return a.score - b.score;
     })

    let html = "<h3 class='mb-2'>Score</h3>";
    players.forEach(p => {
        html += "<div class='col-12 text-center'>"+p.username+" : "+p.score+" </div>"
        if(p.socketId === player.socketId){
            if(p.score > playerScore){
                playerScore = p.score;
                response.classList.add("d-none");
            }
        }
    })
    tablePlayer.innerHTML = "";
    tablePlayer.innerHTML = html;
    tablePlayer.classList.remove('d-none');
}
