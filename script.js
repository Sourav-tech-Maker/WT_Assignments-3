
document.getElementById("loginBtn").addEventListener("click", function () {

    var name = document.getElementById("name").value.trim();
    var email = document.getElementById("email").value.trim();
    var pass = document.getElementById("password").value.trim();
    var error = document.getElementById("error");

    // Check empty fields
    if (name === "" || email === "" || pass === "") {
        error.style.display = "block";
        error.textContent = "Please fill all fields.";
        return;
    }

    // Email must have '@'
    if (email.indexOf("@") === -1) {
        error.style.display = "block";
        error.textContent = "Enter a valid email.";
        return;
    }

    // Password must be 4+ characters
    if (pass.length < 4) {
        error.style.display = "block";
        error.textContent = "Password must be at least 4 characters.";
        return;
    }

    // If successful → redirect to another page
    window.location.href = "store.html";  
});
document.getElementById("resetBtn").addEventListener("click", function () {
    document.getElementById("name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
    document.getElementById("error").style.display = "none";
});
document.body.onclick = function() {
    alert("Welcome to SoRav Electronic Store! Explore our wide range of electronics and enjoy exclusive deals.");
};
var title = document.querySelector('.title');
if (title) {
    title.addEventListener('mouseover', function(){
        title.style.animationPlayState = 'paused';
    }
    );
    title.addEventListener('mouseout', function() {
        title.style.animationPlayState = 'running';
    });
}

    
