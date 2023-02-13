var height = 500;
var width = 240;
var top = window.innerHeight-height;
var left = window.innerWidth-width;

var popupWindow = window.open(
    "./phone.html",
    "sipiceyPopup",
    `toolbar=no,scrollbars=no,resizable=no,width=${width},height=${height},left=${left},top=${top}`
);
window.close(); // close the Chrome extension pop-up