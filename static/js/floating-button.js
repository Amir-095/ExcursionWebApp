document.addEventListener('DOMContentLoaded', function() {
    const floatingButtons = document.querySelector('.floating-buttons');
    const mainButton = document.querySelector('.main-button');
    const formButton = document.querySelector('.form-button');
    const modal = document.getElementById('feedbackModal');
    const span = modal.querySelector('.close');
    const form = document.getElementById('feedbackForm');

    // Открытие/закрытие подкнопок
    mainButton.addEventListener('click', function() {
        floatingButtons.classList.toggle('active');
    });

    // Закрытие подкнопок при клике вне
    document.addEventListener('click', function(event) {
        if (!floatingButtons.contains(event.target)) {
            floatingButtons.classList.remove('active');
        }
    });

    // Открытие формы обратной связи
    formButton.addEventListener('click', function() {
        modal.style.display = "block";
        floatingButtons.classList.remove('active');
    });

    // Закрытие модального окна при клике на X
    span.onclick = function() {
        modal.style.display = "none";
    }

    // Закрытие модального окна при клике вне его
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Обработка отправки формы
    form.onsubmit = async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        try {
            const response = await fetch('/send_feedback/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            });

            if (response.ok) {
                alert('Сообщение успешно отправлено!');
                form.reset();
                modal.style.display = "none";
            } else {
                alert('Произошла ошибка при отправке сообщения.');
            }
        } catch (error) {
            alert('Произошла ошибка при отправке сообщения.');
            console.error('Error:', error);
        }
    }
});

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