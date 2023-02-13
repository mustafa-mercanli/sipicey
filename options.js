navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
        console.log('Custom Message: You let to use your mic')
})
    .catch(function(err) {
        console.log('Custom Message: No permission for microphone!')
});