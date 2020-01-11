const socket = io();

const $messageForm = document.querySelector('#message-form');
const $messageInput = $messageForm.querySelector('#message');
const $sendMessageBtn = document.querySelector('#send-message');
const $sendLocationBtn = document.querySelector('#send-location');

const $messages = document.querySelector('#messages');
const $messageTemplate = document.querySelector('#message-template').innerHTML;
const $locationTemplate = document.querySelector('#location-template').innerHTML;
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

const  {username,room} = Qs.parse(location.search, {ignoreQueryPrefix:true});

const autoScroll = () => {
    const $newMessage = $messages.lastElementChild;

    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = $messages.offsetHeight;

    const containerHeight = $messages.scrollHeight;

    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}
socket.on('roomdata', (data) => {
    const html = Mustache.render($sidebarTemplate, {
        room: data.room,
        users: data.users
    });
    document.querySelector('#sidebar').innerHTML = html;
});

socket.on('message', (message) => {
    const html = Mustache.render($messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoScroll();
});

socket.on('url', (url) => {
    const html = Mustache.render($locationTemplate, {
        username: url.username,
        message: url.urlLink,
        createdAt: moment(url.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoScroll()
});

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    $sendMessageBtn.setAttribute('disabled', 'disabled');
    const message = e.target.elements.message.value;
    socket.emit('sendMessage',message,error => {
       
            $sendMessageBtn.removeAttribute('disabled');
            $messageInput.value = "";
            $messageInput.focus();
       

        if(error) {
            return alert(error);
        }
        console.log('Delivered');
    });
})

socket.on('countupdated', (count) => {
    console.log('count : '+count)
});

$sendLocationBtn.addEventListener('click', (e) => {
    if(!navigator.geolocation) {
        return console.log('Geolocation is not supported by your browser');
    }
    $sendLocationBtn.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation',{
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }, () => {
      
                    $sendLocationBtn.removeAttribute('disabled');
        
                
                console.log('Location sent');
            });
    })
});

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error);
        location.href = "/";
    }
});