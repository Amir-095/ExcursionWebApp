function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function hideLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function switchToRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function switchToLogin() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target == modal) {
        hideLoginModal();
    }
}

function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    fetch(loginUrl, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            hideLoginModal();
            showToast('success', 'Успешно!', 'Вы успешно вошли в систему');
            setTimeout(() => {
                window.location.reload();
            }, 2500);
        } else {
            displayLoginErrors(data.errors);
            showToast('error', 'Ошибка!', 'Неверное имя пользователя или пароль');
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showToast('error', 'Ошибка!', 'Произошла ошибка при входе в систему');
    });
}

function displayLoginErrors(errors) {
    // Очищаем предыдущие ошибки
    document.querySelectorAll('.error-message').forEach(element => element.innerHTML = "");

    for (let field in errors) {
        let errorMessageDiv = document.querySelector(`.error-message[data-field-name="${field}"]`);
        if (errorMessageDiv) {
            let errorText = document.createElement("p");
            errorText.style.color = "red";
            errorText.textContent = errors[field];
            errorMessageDiv.appendChild(errorText);
        }
    }
}

// Обработка формы регистрации
function handleRegister(event) {
    event.preventDefault();

    let formData = new FormData(event.target);

    fetch(registerUrl, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            hideLoginModal();
            showToast('success', 'Успешно!', 'Вы успешно зарегистрировались, вы можете войти в систему');
            setTimeout(() => {
                window.location.reload();
            }, 2500);

        } else {
            displayRegisterErrors(data.errors);
            showToast('error', 'Ошибка регистрации!', 'Пожалуйста, проверьте введенные данные');
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showToast('error', 'Ошибка!', 'Произошла ошибка при регистрации');
    });
}

function displayRegisterErrors(errors) {
    // Очищаем предыдущие ошибки
    document.querySelectorAll('.error-message').forEach(element => element.innerHTML = "");

    for (let field in errors) {
        let errorMessageDiv = document.querySelector(`.error-message[data-field-name="${field}"]`);
        if (errorMessageDiv) {
            let errorText = document.createElement("p");
            errorText.style.color = "red";
            errorText.textContent = errors[field];
            errorMessageDiv.appendChild(errorText);
        }
    }
}

// Функция для получения CSRF токена
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Проверка авторизации перед выполнением действия
function checkAuthAndProceed(action) {
    fetch(checkAuthUrl, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.is_authenticated) {
            action();
        } else {
            showLoginModal();
        }
    });
} 