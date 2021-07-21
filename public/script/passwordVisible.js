const password = document.querySelectorAll(".password");
const eyeSlash = document.querySelectorAll("#eye-slash");

for (let i = 0; i < password.length; i++) {
    password[i].addEventListener("focus", function(event) {
        eyeSlash[i].classList.add("bi-eye-slash");
        eyeSlash[i].addEventListener("click", (e) => {
            const type = password[i].getAttribute("type") === "password" ? "text" : "password";
            password[i].setAttribute("type", type);
            e.target.classList.toggle('bi-eye');
            eyeSlash[i].classList.add("bi-eye-slash");
        });
    });

}