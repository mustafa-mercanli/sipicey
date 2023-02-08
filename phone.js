var ua;
var registerer;

var sipecyHost = localStorage.getItem('sipecyHost');
var sipecyUser = localStorage.getItem('sipecyUser');
var sipecyPass = localStorage.getItem('sipecyPass');

setTimeout(() => {
    document.getElementById("sipHost").value = sipecyHost;
    document.getElementById("sipUser").value = sipecyUser;
    document.getElementById("sipPass").value = sipecyPass;

    const btnSipConfig = document.getElementById("btn-sipconfig");
    btnSipConfig.innerHTML = (sipecyHost && sipecyUser && sipecyPass) ? sipecyUser : "Configure";

    document.getElementById("btn-sipconfig").addEventListener("click",function(e) {
        const keypad = document.getElementById("keypad");
        keypad.classList.remove('make-visible');
        keypad.classList.add('make-invisible');

        const btnSipConfig = document.getElementById("btn-sipconfig");
        btnSipConfig.classList.remove('make-visible');
        btnSipConfig.classList.add('make-invisible');

        const sipconfig = document.getElementById("sipconfig");
        sipconfig.classList.remove('make-invisible');
        sipconfig.classList.add('make-visible');
    });
    
    document.getElementById("btn-close-sipconfig").addEventListener("click",function(e) {
        const keypad = document.getElementById("keypad");
        keypad.classList.remove('make-invisible');
        keypad.classList.add('make-visible');

        const btnSipConfig = document.getElementById("btn-sipconfig");
        btnSipConfig.classList.remove('make-invisible');
        btnSipConfig.classList.add('make-visible');

        const sipconfig = document.getElementById("sipconfig");
        sipconfig.classList.remove('make-visible');
        sipconfig.classList.add('make-invisible');

        const sipHost = document.getElementById("sipHost");
        const sipUser = document.getElementById("sipUser");
        const sipPass = document.getElementById("sipPass");
        localStorage.setItem('sipecyHost',sipHost.value);
        localStorage.setItem('sipecyUser',sipUser.value);
        localStorage.setItem('sipecyPass',sipPass.value);
    });

    for (let item of document.getElementsByClassName("keypad-key")){
        item.addEventListener("click",function(e) {
            const keypadInput = document.getElementById("keypad-input");
            keypadInput.value+=e.target.innerHTML;
        });
    } 

    document.getElementById("keypad-input").addEventListener("keypress",function(e){
        return checkKey(e);
    });

    document.getElementById("btn-backspace").addEventListener("click",function(e){
        const keypadInput = document.getElementById("keypad-input");
        keypadInput.value = keypadInput.value.substring(0, keypadInput.value.length-1);
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
    if (e.target.tagName.toUpperCase() == 'INPUT'){
        return;
    }
    if (checkKey(e)){
        const keypadInput = document.getElementById("keypad-input");
        keypadInput.value+=e.key;
    }
});



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
        console.log(`Custom Message: ${state}`);
        if (state === "Registered"){
            const sipStatus = document.getElementById("sip-status");
            sipStatus.innerHTML = "Connected";
            const btnSipConfig = document.getElementById("btn-sipconfig");
            btnSipConfig.classList.remove("btn-sipconfig-orange");
            btnSipConfig.classList.add("btn-sipconfig-green");
        }
        if (state === "Unregistered"){
            const sipStatus = document.getElementById("sip-status");
            sipStatus.innerHTML = "Disconnected";
            const btnSipConfig = document.getElementById("btn-sipconfig");
            btnSipConfig.classList.remove("btn-sipconfig-green");
            btnSipConfig.classList.add("btn-sipconfig-orange");
        }
    });

    ua.start().then(()=>{
        console.log("Custom Message: Connected to the server");
        registerer.register();
    });
}







