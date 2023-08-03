const markActive = function(obj) {
    let elements = document.getElementsByClassName('navbtn');
    for (let i = 0; i < elements.length; i++) {
        elements[i].classList.remove('active');
    }
    obj.classList.add('active');
}