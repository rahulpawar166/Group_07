    $(function () {
        const socket = io();
        // form from chat.handlebars when submit anything
        $('form').submit(function () {
            $('#userTyping').remove();
            // name class will get data value from input and save to name variable
            const sendBy = $('#sendby').val();
            const receivedby = $('#receivedby').val();
            const message = $('#message').val();
            var Details={  
                sendBy : sendBy,  
                receivedby : receivedby,
                message, message
                }; 
            
            // emit a string or data using name and message from input variable and send to chatMsg event
            // socket.emit('chatMsg', `sendBy ${sendBy} receivedby ${receivedby} message : ${message}`);
            socket.emit('chatMsg',Details );
            $('#message').val('');
            // do not return anything so we can see msgs and stay on the same page without reloading
            return false;
        });

        socket.on('chatMsg', function (message) {
            // adding all messages sending and receiving using list and append()
            $('#messages').append($('<li style="background-color: #e5ecef; color: black;">').text(message));
            

        });
        // socket.emit('chatMsg', 'Hi from client');
    });
    function userIsTyping() {
        $('#userTyping').text('Someone is Typing..........');
    }
