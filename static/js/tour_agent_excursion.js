// Временное хранение ID экскурсии для удаления
let excursionToDelete = null;

function deleteExcursion(excursionId) {
    // Сохраняем ID экскурсии и показываем модальное окно подтверждения
    excursionToDelete = excursionId;
    showDeleteConfirmation();
}

// Функция для отображения модального окна подтверждения удаления
function showDeleteConfirmation() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Функция для скрытия модального окна
function hideDeleteConfirmation() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Функция для фактического удаления экскурсии
function confirmDelete() {
    if (!excursionToDelete) return;
    
    const excursionId = excursionToDelete;
    hideDeleteConfirmation();
    
    fetch(`/delete-excursion/${excursionId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showToast('success', 'Успешно', data.message);
            // Перезагрузка страницы с небольшой задержкой для показа уведомления
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            showToast('error', 'Ошибка', data.message);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showToast('error', 'Ошибка', 'Не удалось удалить экскурсию. Попробуйте ещё раз.');
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
    
    // Показываем уведомление с анимацией
    setTimeout(() => {
        toast.classList.add('show');
        
        // Запускаем прогресс-бар
        const progressBar = toast.querySelector('.toast-progress');
        progressBar.style.width = '100%';
        progressBar.style.transitionDuration = `${duration}ms`;
        
        // Автоматически удаляем уведомление после указанного времени
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, duration);
    }, 10);
}

// Инициализация обработчиков событий при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Обработчики для кнопок в модальном окне подтверждения удаления
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', hideDeleteConfirmation);
    }
});