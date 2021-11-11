export function KanjiStart(room){
    let win = false;
    players = room.players;
    while(win === false){
        let time = 0;
        while(time !== 10){
            io.to(room.id).emit('time', time);
            pause(1000);
            time += 1;
        }
    }
}