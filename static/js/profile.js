// Функция для отображения всплывающего уведомления
function showToast(type, title, message, duration = 5000) {
    // Создаем контейнер для тостов, если он не существует
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Создаем элемент уведомления
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Определяем соответствующую иконку
    let iconClass = 'fa-info-circle';
    if (type === 'success') {
        iconClass = 'fa-check-circle';
    } else if (type === 'error') {
        iconClass = 'fa-exclamation-circle';
    } else if (type === 'warning') {
        iconClass = 'fa-exclamation-triangle';
    }
    
    // Создаем содержимое уведомления
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-body">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
        <div class="toast-progress"></div>
    `;
    
    // Добавляем уведомление в контейнер
    toastContainer.appendChild(toast);
    
    // Показываем уведомление
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Запускаем прогресс-бар
    const progressBar = toast.querySelector('.toast-progress');
    progressBar.style.width = '0%';
    
    // Анимируем прогресс-бар
    let startTime = null;
    function animateProgress(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration * 100, 100);
        progressBar.style.width = `${progress}%`;
        
        if (progress < 100) {
            requestAnimationFrame(animateProgress);
        } else {
            // Скрываем и удаляем уведомление
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }
    
    requestAnimationFrame(animateProgress);
}

// Переменная для хранения ID карты для удаления
let cardToDelete = null;

// Функция для показа модального окна подтверждения удаления
function showDeleteCardModal(cardId) {
    cardToDelete = cardId;
    const modal = document.getElementById('deleteCardModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Функция для скрытия модального окна
function hideDeleteCardModal() {
    const modal = document.getElementById('deleteCardModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Функция для инициализации удаления карты
function deleteCard(cardId) {
    showDeleteCardModal(cardId);
}

// Функция для подтверждения удаления карты
function confirmDeleteCard() {
    if (!cardToDelete) return;
    
    const cardId = cardToDelete;
    hideDeleteCardModal();
    
    fetch(`/delete-card/${cardId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showToast('success', 'Успешно', data.message);
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            showToast('error', 'Ошибка', data.message);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showToast('error', 'Ошибка', 'Не удалось удалить карту. Попробуйте ещё раз.');
    });
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

// Инициализация обработчиков событий при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Обработчики для кнопок в модальном окне подтверждения удаления
    const confirmDeleteBtn = document.getElementById('confirmDeleteCard');
    const cancelDeleteBtn = document.getElementById('cancelDeleteCard');
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteCard);
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', hideDeleteCardModal);
    }
});