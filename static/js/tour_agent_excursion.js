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
    
    fetch(deleteExcursionUrl.replace('0', excursionId), {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'X-Requested-With': 'XMLHttpRequest'
        },
        redirect: 'manual'
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                let errorMsg = `Ошибка ${response.status}`;
                try { errorMsg = JSON.parse(text).message || errorMsg; } catch(e) { /* использовать как есть */ }
                throw new Error(errorMsg);
            });
        }
        return response.json();
    })
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