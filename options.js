navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
        console.log(`${new Date().toISOString()} Custom Message: You let to use your mic`);
})
    .catch(function(err) {
        console.log(`${new Date().toISOString()} Custom Message: No permission for microphone!`);
});