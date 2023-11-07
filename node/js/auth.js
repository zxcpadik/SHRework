window.onload = function () {
    (function () {
        const inputText = document.querySelectorAll(".auth-form__input");

        inputText.forEach(function (input) {
            input.addEventListener("focus", function () {
                this.classList.add("focus");
                this.parentElement
                    .querySelector(".auth-form__placeholder")
                    .classList.add("focus");
            });
            input.addEventListener("blur", function () {
                this.classList.remove("focus");
                if (!this.value) {
                    this.parentElement
                        .querySelector(".auth-form__placeholder")
                        .classList.remove("focus");
                }
            });
        });
    })();

    (function () {
        const togglers = document.querySelectorAll(".password-toggler");

        togglers.forEach(function (checkbox) {
            checkbox.addEventListener("change", function () {
                const toggler = this.parentElement,
                    input =
                        toggler.parentElement.querySelector(".input-password"),
                    icon = toggler.querySelector(".auth-form__icon");

                if (checkbox.checked) {
                    input.type = "text";
                    icon.classList.remove("la-eye");
                    icon.classList.add("la-eye-slash");
                } else {
                    input.type = "password";
                    icon.classList.remove("la-eye-slash");
                    icon.classList.add("la-eye");
                }
            });
        });
    })();

    (function () {
        document.forms["form-auth"].addEventListener(
            "submit",
            async function (e) {
                e.preventDefault();

                const answerContainer =
                        this.querySelector(".auth-form__answer"),
                    username = this.elements.username.value,
                    password = this.elements.password.value;

                const placeholders = document.querySelectorAll(
                    ".auth-form__placeholder"
                );

                const response = await fetch(
                    `https://sh-rework.ru/api/v1/auth?username=${username}&password=${password}`,
                    {
                        method: "GET",
                    }
                );

                if (response.ok) {
                    answerContainer.innerHTML =
                        '<span class="text-success">you\'ve been logged successfully</span>';
                } else {
                    placeholders.forEach(function (placeholder) {
                        placeholder.classList.remove("focus");
                    });
                    this.elements.username.value = "";
                    this.elements.password.value = "";
                    answerContainer.innerHTML =
                        '<span class="text-danger">invalid username or password</span>';
                }
            }
        );
    })();
};
