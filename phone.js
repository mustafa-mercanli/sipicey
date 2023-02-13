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

var durationInterval;

setTimeout(() => {
    mediaElement =  document.getElementById('mediaElement');

    document.getElementById("sipHost").value = sipecyHost;
    document.getElementById("sipUser").value = sipecyUser;
    document.getElementById("sipPass").value = sipecyPass;

    document.getElementById("btn-sipconfig").innerHTML = (sipecyHost && sipecyUser && sipecyPass) ? sipecyUser : "Configure";

    document.getElementById("btn-sipconfig").addEventListener("click",function(e) {
        document.getElementById("keypad").classList.remove('make-visible');
        document.getElementById("keypad").classList.add('make-invisible');

        document.getElementById("btn-sipconfig").classList.remove('make-visible');
        document.getElementById("btn-sipconfig").classList.add('make-invisible');

        document.getElementById("sipconfig").classList.remove('make-invisible');
        document.getElementById("sipconfig").classList.add('make-visible');
    });
    
    document.getElementById("btn-close-sipconfig").addEventListener("click",function(e) {
        document.getElementById("keypad").classList.remove('make-invisible');
        document.getElementById("keypad").classList.add('make-visible');

        document.getElementById("btn-sipconfig").classList.remove('make-invisible');
        document.getElementById("btn-sipconfig").classList.add('make-visible');

        document.getElementById("sipconfig").classList.remove('make-visible');
        document.getElementById("sipconfig").classList.add('make-invisible');

        localStorage.setItem('sipecyHost',document.getElementById("sipHost").value);
        localStorage.setItem('sipecyUser',document.getElementById("sipUser").value);
        localStorage.setItem('sipecyPass',document.getElementById("sipPass").value);
    });

    for (let item of document.getElementsByClassName("keypad-key")){
        item.addEventListener("click",function(e) {
            document.getElementById("keypad-input").value+=e.target.innerHTML;
        });
    } 

    document.getElementById("keypad-input").addEventListener("keypress",function(e){
        return checkKey(e);
    });

    document.getElementById("btn-backspace").addEventListener("click",function(e){
        document.getElementById("keypad-input").value = keypadInput.value.substring(0, keypadInput.value.length-1);
    });

    document.getElementById("btn-connect").addEventListener("click",function (e) {
        localStorage.setItem('sipecyHost',document.getElementById("sipHost").value);
        localStorage.setItem('sipecyUser',document.getElementById("sipUser").value);
        localStorage.setItem('sipecyPass',document.getElementById("sipPass").value);
        sipecyHost = localStorage.getItem('sipecyHost');
        sipecyUser = localStorage.getItem('sipecyUser');
        sipecyPass = localStorage.getItem('sipecyPass');
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

    registerAccount();
    
}, 100);

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
        const keypadInput = document.getElementById("keypad-input");
        keypadInput.value+=e.key;
    }
});


function makeCall(cld){
    if (["outgoing-establishing","outgoing-established","incoming-establising","incoming-established"].includes(sessionState)){
        return;
    }
   
    const url = new URL(sipecyHost);
    const target = SIP.UserAgent.makeURI(`sip:${cld}@${url.hostname}`);

    inviter = new SIP.Inviter(ua, target);

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
                break;
            case SIP.SessionState.Established:
                consoleLog("Outgoing session has established");
                setupDurationInterval();
                sessionState = "outgoing-established";
                setupRemoteMedia(inviter);
                break;
            case SIP.SessionState.Terminated:
                consoleLog("Outgoing session has terminated");
                clearDurationInterval();
                sessionState = "outgoing-terminated";
                initialStyle();
                cleanupMedia();
                break;
            default:
                break;
        }
    });

    inviter.invite();
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
        displayName: sipecyUser
    });

    registerer = new SIP.Registerer(ua);

    registerer.stateChange.addListener(function(state){
        consoleLog(`${state}`);
        if (state === "Registered"){
            document.getElementById("sip-status").innerHTML = "Connected";
            document.getElementById("btn-sipconfig").classList.remove("btn-sipconfig-orange");
            document.getElementById("btn-sipconfig").classList.add("btn-sipconfig-green");
            document.getElementById("btn-sipconfig").innerHTML = sipecyUser;
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
          establishingStyle().then(()=>{
            incomingCallShow();
                const displayName = invitation.incomingInviteRequest.earlyDialog.dialogState.remoteURI.normal.user;

                document.getElementById("incoming_cli").innerHTML = displayName;
                document.getElementById("keypad-input").value = displayName.startsWith("+") ? displayName.replace("+","") : displayName;     
          });
          // Handle incoming session state changes.
          incomingSession.stateChange.addListener((newState) => {
            switch (newState) {
              case SIP.SessionState.Establishing:
                consoleLog("Incoming session is establishing");
                document.getElementById("call-duration").innerHTML = "00:00";
                sessionState = "incoming-establishing";
                establishingStyle().then(()=>{
                    
                });
                break;
              case SIP.SessionState.Established:
                consoleLog("Incoming session has been established");
                setupDurationInterval();
                sessionState = "incoming-established";
                setupRemoteMedia(invitation);
                break;
              case SIP.SessionState.Terminated:
                consoleLog("Incoming session has terminated");
                clearDurationInterval();
                sessionState = "incoming-terminated";
                initialStyle();
                cleanupMedia();
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
        document.getElementById("btn-call").classList.remove("btn-call-green");
        document.getElementById("btn-call").classList.add("btn-call-red");
        document.getElementById("btn-call").removeEventListener("click",establishingListener);
        document.getElementById("btn-call").removeEventListener("click",initialListener);
        document.getElementById("btn-call").addEventListener("click",establishingListener);
        incomingCallHide();
        resolve();
    });
    
}

function initialStyle(){
    document.getElementById("btn-call").classList.remove("btn-call-red");
    document.getElementById("btn-call").classList.add("btn-call-green");
    document.getElementById("btn-call").removeEventListener("click",establishingListener);
    document.getElementById("btn-call").removeEventListener("click",initialListener);
    document.getElementById("btn-call").addEventListener("click",initialListener);
    incomingCallHide();
}

function incomingCallShow(){
    document.getElementById("div-outgoing-call").classList.remove("make-visible");
    document.getElementById("div-outgoing-call").classList.add("make-invisible");
    document.getElementById("div-incoming-call").classList.remove("make-invisible");
    document.getElementById("div-incoming-call").classList.add("make-visible");
}

function incomingCallHide(){
    document.getElementById("div-outgoing-call").classList.remove("make-invisible");
    document.getElementById("div-outgoing-call").classList.add("make-visible");
    document.getElementById("div-incoming-call").classList.remove("make-visible");
    document.getElementById("div-incoming-call").classList.add("make-invisible");
}


function consoleLog(msg){
    console.log(`Custom Message:`,msg);
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