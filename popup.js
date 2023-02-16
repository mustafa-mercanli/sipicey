var height = 500;
var width = 240;
var t = window.screen.availHeight;
var l = window.screen.availWidth;

var popupWindow = window.open(
    "./phone.html",
    "sipiceyPopup",
    `toolbar=no,scrollbars=no,resizable=no,width=${width},height=${height},top=${t},left=${l}`
);
window.close(); // close the Chrome extension pop-up