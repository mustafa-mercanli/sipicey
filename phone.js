var ua;
var registerer;
var inviter;
var incomingSession;
var outgoingSession;
var sessionState;

var mediaElement;
var remoteStream = new MediaStream();

var sipecyHost = localStorage.getItem('sipecyHost');
var sipecyUser = localStorage.getItem('sipecyUser');
var sipecyPass = localStorage.getItem('sipecyPass');
var sipecyDisplay = localStorage.getItem('sipecyDisplay');

var durationInterval;

var CONTEXT_MENU_ID="sipiceycontextmenuid";

document.addEventListener('DOMContentLoaded', function () {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
            consoleLog('You let to use your mic')
    })
        .catch(function(err) {
            consoleLog('No permission for microphone!')
            document.getElementById("error-message").innerHTML = "Microphone permission is required. Right click extenson icon and click options"
    });


    mediaElement =  document.getElementById('mediaElement');

    document.getElementById("sipHost").value = sipecyHost;
    document.getElementById("sipUser").value = sipecyUser;
    document.getElementById("sipPass").value = sipecyPass;
    document.getElementById("sipDisplay").value = sipecyDisplay;

    document.getElementById("btn-sipconfig").innerHTML = (sipecyHost && sipecyUser && sipecyPass) ? sipecyUser : "Configure";

    document.getElementById("btn-sipconfig").addEventListener("click",function(e) {
        document.getElementById("keypad").style.display = "none";
        document.getElementById("btn-sipconfig").style.display = "none";
        document.getElementById("sipconfig").style.display = "block";
    });
    
    document.getElementById("btn-close-sipconfig").addEventListener("click",function(e) {
        document.getElementById("keypad").style.display = "block";
        document.getElementById("btn-sipconfig").style.display = "block";
        document.getElementById("sipconfig").style.display = "none";

        localStorage.setItem('sipecyHost',document.getElementById("sipHost").value);
        localStorage.setItem('sipecyUser',document.getElementById("sipUser").value);
        localStorage.setItem('sipecyPass',document.getElementById("sipPass").value);
        localStorage.setItem('sipecyDisplay',document.getElementById("sipDisplay").value);
    });

    for (let item of document.getElementsByClassName("keypad-key")){
        item.addEventListener("click",function(e) {
            document.getElementById("keypad-input").value+=e.target.innerHTML;
        });
    } 

    document.getElementById("btn-backspace").addEventListener("click",function(e){
        const keypadInput =  document.getElementById("keypad-input");
        keypadInput.value = keypadInput.value.substring(0, keypadInput.value.length-1);
    });

    document.getElementById("btn-connect").addEventListener("click",function (e) {
        localStorage.setItem('sipecyHost',document.getElementById("sipHost").value);
        localStorage.setItem('sipecyUser',document.getElementById("sipUser").value);
        localStorage.setItem('sipecyPass',document.getElementById("sipPass").value);
        localStorage.setItem('sipecyDisplay',document.getElementById("sipDisplay").value);
        sipecyHost = localStorage.getItem('sipecyHost');
        sipecyUser = localStorage.getItem('sipecyUser');
        sipecyPass = localStorage.getItem('sipecyPass');
        sipecyDisplay = localStorage.getItem('sipecyDisplay');
        registerAccount();
    });
    
    document.getElementById("btn-disconnect").addEventListener("click",function (e) {
        registerer.unregister();
    });

    document.getElementById("btn-call").addEventListener("click",initialListener);

    document.getElementById("btn-answer-call").addEventListener("click",function(e){
        // Handle incoming INVITE request.
        let constrainsDefault = {
            audio: true,
            video: false,
          }
      
          const options = {
            sessionDescriptionHandlerOptions: {
              constraints: constrainsDefault,
            },
          }
      
          incomingSession.accept(options);
          consoleLog("Incoming call accepted");

    });

    document.getElementById("btn-reject-call").addEventListener("click",function(e){
        incomingSession.reject();
        consoleLog("Incoming call rejected");
    });

    document.getElementById("keypad-input").addEventListener("keypress",function(e){
        if (!checkKey(e)){
            e.preventDefault();
        }
    });

    

    registerAccount();
    
}, false);

function checkKey(e){
    if (["1","2","3","4","5","6","7","8","9","0","*","#","+"].includes(e.key)){
        e.preventDefault;
        return true;
    }
    return false;
}

document.addEventListener("keypress",function (e) {
    if (e.key === "Enter"){
        document.getElementById("btn-call").click();
        return;
    }

    if (e.target.tagName.toUpperCase() == 'INPUT'){
        return;
    }

    if (checkKey(e)){
        document.getElementById("keypad-input").value+=e.key;
    }
});

document.addEventListener("keydown",function (e) {
    if (e.key === "Backspace"){
        const keypadInput = document.getElementById("keypad-input").value;
        if (keypadInput){
            document.getElementById("keypad-input").value = keypadInput.substring(0,keypadInput.length-1);
        }
    }
    if (e.key === "Delete"){
        const keypadInput = document.getElementById("keypad-input").value;
        if (keypadInput){
            document.getElementById("keypad-input").value = keypadInput.slice(1);
        }
    }
});

function makeCall(cld){
    if (["outgoing-establishing","outgoing-established","incoming-establising","incoming-established"].includes(sessionState)){
        return;
    }
   
    const url = new URL(sipecyHost);
    const target = SIP.UserAgent.makeURI(`sip:${cld}@${url.hostname}`);

    inviter = new SIP.Inviter(ua, target, {earlyMedia:true});

    outgoingSession = inviter;

    // Setup outgoing session delegate
    outgoingSession.delegate = {
        // Handle incoming REFER request.
        onRefer(referral){
        // ...
        }
    };

    // Handle outgoing session state changes.
    outgoingSession.stateChange.addListener((newState) => {
        switch (newState) {
            case SIP.SessionState.Establishing:
                consoleLog("Outgoing session is establishing");
                document.getElementById("call-duration").innerHTML = "00:00";
                sessionState = "outgoing-establishing";
                establishingStyle().then(()=>{

                });
                setupRemoteMedia(inviter);
                break;
            case SIP.SessionState.Established:
                consoleLog("Outgoing session has established");
                setupDurationInterval();
                sessionState = "outgoing-established";
                break;
            case SIP.SessionState.Terminated:
                consoleLog("Outgoing session has terminated");
                clearDurationInterval();
                sessionState = "outgoing-terminated";
                initialStyle().then(()=>{

                });
                cleanupMedia();
                break;
            default:
                break;
        }
    });

    inviter.invite();
    establishingStyle().then(()=>{

    });
}


function registerAccount(){
    if (!sipecyHost){
        return;
    }
    
    const url = new URL(sipecyHost);

    ua = new SIP.UserAgent({
        uri: SIP.UserAgent.makeURI(`sip:${sipecyUser}@${url.hostname}`),
        transportOptions: {
          server: sipecyHost
        },
        authorizationUsername:sipecyUser,
        authorizationPassword: sipecyPass,
        displayName: sipecyDisplay || sipecyUser
    });

    registerer = new SIP.Registerer(ua);

    registerer.stateChange.addListener(function(state){
        consoleLog(`${state}`);
        if (state === "Registered"){
            document.getElementById("sip-status").innerHTML = "Connected";
            document.getElementById("btn-sipconfig").classList.remove("btn-sipconfig-orange");
            document.getElementById("btn-sipconfig").classList.add("btn-sipconfig-green");
            document.getElementById("btn-sipconfig").innerHTML = sipecyDisplay || sipecyUser;
        }
        if (state === "Unregistered"){
            document.getElementById("sip-status").innerHTML = "Disconnected";
            document.getElementById("btn-sipconfig").classList.remove("btn-sipconfig-green");
            document.getElementById("btn-sipconfig").classList.add("btn-sipconfig-orange");
        }
    });

    ua.delegate = {
        onInvite(invitation) {
      
            // An Invitation is a Session
            incomingSession = invitation;
      
          // Setup incoming session delegate
            incomingSession.delegate = {
            // Handle incoming REFER request.
            onRefer(referral) {
                // ...
            }
            };
            playIncomingTone();
            outgoingCallHide();
            incomingCallShow();
            const displayName = invitation.incomingInviteRequest.earlyDialog.dialogState.remoteURI.normal.user;
            document.getElementById("incoming_cli").innerHTML = displayName;
            document.getElementById("keypad-input").value = displayName.startsWith("+") ? displayName.replace("+","") : displayName;
            // Handle incoming session state changes.
            incomingSession.stateChange.addListener((newState) => {
                switch (newState) {
                    case SIP.SessionState.Establishing:
                        consoleLog("Incoming session is establishing");
                        document.getElementById("call-duration").innerHTML = "00:00";
                        sessionState = "incoming-establishing";
                        break;
                    case SIP.SessionState.Established:
                        consoleLog("Incoming session has been established");
                        setupDurationInterval();
                        sessionState = "incoming-established";
                        setupRemoteMedia(invitation);
                        stopIncomingTone();
                        establishingStyle().then(()=>{
                            
                        });
                        break;
                    case SIP.SessionState.Terminated:
                        consoleLog("Incoming session has terminated");
                        clearDurationInterval();
                        sessionState = "incoming-terminated";
                        initialStyle().then(()=>{

                        });
                        cleanupMedia();
                        stopIncomingTone();
                        break;
                    default:
                        break;
                }
            });
      
        }
    };
      

    ua.start().then(()=>{
        consoleLog("Connected to the server");
        registerer.register();
    });
}

function setupDurationInterval() {
    durationInterval = setInterval(()=>{
        let currentDuration = document.getElementById("call-duration").innerHTML;
        if (!currentDuration){
            currentDuration = "00:00";
        }
        else{
            const [mm,ss] = currentDuration.split(":");
            const seconds = (parseInt(mm)*60) + parseInt(ss) + 1;
            //consoleLog(new Date(seconds * 1000).toISOString().substring(14, 19));
            document.getElementById("call-duration").innerHTML = new Date(seconds * 1000).toISOString().substring(14, 19);
        }
    },1000);
}

function clearDurationInterval(){
    clearInterval(durationInterval);
    document.getElementById("call-duration").innerHTML = "";
}

function endCall(){
    switch (sessionState){
        case "outgoing-establishing":
            consoleLog("Outgoing call cancelled");
            outgoingSession.cancel();
        break;
        case "outgoing-established":
            outgoingSession.bye();
            consoleLog("Outgoing call byed");
        break;
        case "incoming-establising":
            incomingSession.reject();
            consoleLog("Incoming call rejected");
        break;
        case "incoming-established":
            incomingSession.bye();
            consoleLog("Incoming call byed");
        break;
    }
}


function establishingStyle(){
    return new Promise ((resolve,reject)=>{
        incomingCallHide();
        outgoingCallShow();
        document.getElementById("btn-call").classList.remove("btn-call-green");
        document.getElementById("btn-call").classList.add("btn-call-red");
        document.getElementById("btn-call").removeEventListener("click",establishingListener);
        document.getElementById("btn-call").removeEventListener("click",initialListener);
        document.getElementById("btn-call").addEventListener("click",establishingListener);
        resolve();
    });
    
}

function initialStyle(){
    return new Promise ((resolve,reject)=>{
        incomingCallHide();
        outgoingCallShow();
        document.getElementById("btn-call").classList.remove("btn-call-red");
        document.getElementById("btn-call").classList.add("btn-call-green");
        document.getElementById("btn-call").removeEventListener("click",establishingListener);
        document.getElementById("btn-call").removeEventListener("click",initialListener);
        document.getElementById("btn-call").addEventListener("click",initialListener);
        resolve();
    });
}

function outgoingCallShow(){
    document.getElementById("div-outgoing-call").style.display = "block";
}

function outgoingCallHide(){
    document.getElementById("div-outgoing-call").style.display = "none";
}

function incomingCallShow(){
    document.getElementById("div-incoming-call").style.display = "block";
}

function incomingCallHide(){
    document.getElementById("div-incoming-call").style.display = "none";
}   


function consoleLog(msg){
    console.log(`${new Date().toISOString()} Custom Message:`,msg);
}


function initialListener(e){
    const keypadInput = document.getElementById("keypad-input");
    if (!keypadInput.value || !registerer || registerer.state!=="Registered"){
        return;
    }
    makeCall(keypadInput.value);
}

function establishingListener(e){
    endCall();
}

function setupRemoteMedia(session) {
    session.sessionDescriptionHandler.peerConnection.getReceivers().forEach((receiver) => {
      if (receiver.track) {
        remoteStream.addTrack(receiver.track);
      }
    });
    mediaElement.srcObject = remoteStream;
    mediaElement.play();
}

function cleanupMedia() {
    mediaElement.srcObject = null;
    mediaElement.pause();
}


window.addEventListener('resize', ()=>{
    var width = 240;
    var height = 500;
    window.resizeTo(width,height);
})

function playIncomingTone(){
    document.getElementById('incomingTone').play();
}

function stopIncomingTone(){
    document.getElementById('incomingTone').pause();
    document.getElementById('incomingTone').currentTime = 0;
}

function makeContextCall(info, tab) {
    document.getElementById('keypad-input').value = info.selectionText.replace(/\D/g,'');
    initialListener();
    
}

chrome.contextMenus.create({
    title: "sipicey call: %s", 
    contexts:["selection"], 
    id: CONTEXT_MENU_ID
});

chrome.contextMenus.onClicked.addListener(
    makeContextCall
  )


