import $ from "jquery";

console.log("hello");

$.get( "./main.html", function( data ) {
    fillBody(data)
});

function fillBody(data){
    let body = document.getElementsByTagName("body")[0];
    body.innerHTML = body.innerHTML + data;
}