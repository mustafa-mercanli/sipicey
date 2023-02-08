setTimeout(() => {
    const sipHost = document.getElementById("sipHost");
    const sipUser = document.getElementById("sipUser");
    const sipPass = document.getElementById("sipPass");
    sipHost.value = localStorage.getItem('sipecyHost');
    sipUser.value = localStorage.getItem('sipecyUser');
    sipPass.value = localStorage.getItem('sipecyPass');

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

