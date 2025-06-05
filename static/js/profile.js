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
    
    fetch(deleteCardUrl.replace('0', cardId), {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'X-Requested-With': 'XMLHttpRequest'
        },
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
    // --- Profile Edit Functionality ---
    const editProfileBtn = document.getElementById('editProfileBtn');
    const profileEditForm = document.getElementById('profileEditForm');
    const profileDisplayInfo = document.getElementById('profileDisplayInfo');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const cancelEditProfileBtn = document.getElementById('cancelEditProfileBtn');

    // Input fields
    const profileUsernameInput = document.getElementById('profile_username_input');
    const profileEmailInput = document.getElementById('profile_email_input');
    const profilePhoneNumberInput = document.getElementById('profile_phone_number_input');

    // Display spans
    const displayUsername = document.getElementById('display_username');
    const displayEmail = document.getElementById('display_email');
    const displayPhoneNumber = document.getElementById('display_phone_number');

    // Error message spans
    const errorUsernameMsg = document.getElementById('error_username_msg');
    const errorEmailMsg = document.getElementById('error_email_msg');
    const errorPhoneNumberMsg = document.getElementById('error_phone_number_msg');
    const profileInfoContainer = document.querySelector('.profile-info')

    const actualFileInput = document.getElementById('id_avatar_input_actual');
    const fileChosenTextSpan = document.getElementById('file-chosen-text');
    const defaultFileChosenText = fileChosenTextSpan ? fileChosenTextSpan.textContent : "Файл не выбран";

    if (actualFileInput && fileChosenTextSpan) {
        actualFileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                // Отображаем имя первого выбранного файла
                fileChosenTextSpan.textContent = this.files[0].name;
            } else {
                // Если файлы не выбраны (например, пользователь нажал "Отмена" в диалоге)
                fileChosenTextSpan.textContent = defaultFileChosenText;
            }
        });
    }

    function switchToEditMode() {
        // Populate inputs with current display values
        profileUsernameInput.value = displayUsername.textContent.trim();
        profileEmailInput.value = displayEmail.textContent.trim();
        profilePhoneNumberInput.value = displayPhoneNumber.textContent.trim();

        profileDisplayInfo.style.display = 'none';
        profileEditForm.style.display = 'block';
        if (editProfileBtn) editProfileBtn.style.display = 'none';
        if (profileInfoContainer) profileInfoContainer.classList.add('profile-content-editing');
        clearAllProfileErrors();
    }

    function switchToDisplayMode() {
        profileDisplayInfo.style.display = 'block';
        profileEditForm.style.display = 'none';
        if (editProfileBtn) editProfileBtn.style.display = 'inline-block';
        if (profileInfoContainer) profileInfoContainer.classList.remove('profile-content-editing');
        clearAllProfileErrors();
    }

    function clearAllProfileErrors() {
        if (errorUsernameMsg) errorUsernameMsg.textContent = '';
        if (errorEmailMsg) errorEmailMsg.textContent = '';
        if (errorPhoneNumberMsg) errorPhoneNumberMsg.textContent = '';

        if (profileUsernameInput) profileUsernameInput.classList.remove('is-invalid');
        if (profileEmailInput) profileEmailInput.classList.remove('is-invalid');
        if (profilePhoneNumberInput) profilePhoneNumberInput.classList.remove('is-invalid');
    }

    function displayProfileErrors(errors) {
        clearAllProfileErrors();
        if (errors.username) {
            if (errorUsernameMsg) errorUsernameMsg.textContent = errors.username;
            if (profileUsernameInput) profileUsernameInput.classList.add('is-invalid');
        }
        if (errors.email) {
            if (errorEmailMsg) errorEmailMsg.textContent = errors.email;
            if (profileEmailInput) profileEmailInput.classList.add('is-invalid');
        }
        if (errors.phone_number) {
            if (errorPhoneNumberMsg) errorPhoneNumberMsg.textContent = errors.phone_number;
            if (profilePhoneNumberInput) profilePhoneNumberInput.classList.add('is-invalid');
        }
    }

    function handleSaveProfile() {
        const newUsername = profileUsernameInput.value.trim();
        const newEmail = profileEmailInput.value.trim();
        const newPhoneNumber = profilePhoneNumberInput.value.trim();

        clearAllProfileErrors(); // Clear previous errors

        // Basic client-side check (server will do more robust validation)
        let clientErrors = {};
        if (!newUsername) clientErrors.username = 'Имя не может быть пустым.';
        if (!newEmail) clientErrors.email = 'Email не может быть пустым.';
        else if (!/^\S+@\S+\.\S+$/.test(newEmail)) clientErrors.email = 'Введите корректный email.';
        // Optional: add phone number regex validation here

        if (Object.keys(clientErrors).length > 0) {
            displayProfileErrors(clientErrors);
            return;
        }

        fetch(updateProfileUrl, { // updateProfileUrl should be defined via js_constants.html
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                username: newUsername,
                email: newEmail,
                phone_number: newPhoneNumber
            })
        })
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(({ status, body }) => {
            if (status === 200 && body.status === 'success') {
                showToast('success', 'Успешно', body.message);
                // Update display values on the page
                if (displayUsername) displayUsername.textContent = body.user_data.username;
                if (displayEmail) displayEmail.textContent = body.user_data.email;
                if (displayPhoneNumber) displayPhoneNumber.textContent = body.user_data.phone_number;
                switchToDisplayMode();
            } else {
                if (body.errors) {
                    displayProfileErrors(body.errors);
                }
                showToast('error', 'Ошибка', body.message || 'Не удалось обновить профиль.');
            }
        })
        .catch(error => {
            console.error('Ошибка при обновлении профиля:', error);
            showToast('error', 'Сетевая ошибка', 'Не удалось связаться с сервером. Попробуйте ещё раз.');
        });
    }

    // Event Listeners for profile editing
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', switchToEditMode);
    }
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', handleSaveProfile);
    }
    if (cancelEditProfileBtn) {
        cancelEditProfileBtn.addEventListener('click', switchToDisplayMode);
    }

    // Initial state: show display info, hide edit form
    if (profileDisplayInfo && profileEditForm) {
        profileDisplayInfo.style.display = 'block';
        profileEditForm.style.display = 'none';
        if (editProfileBtn) editProfileBtn.style.display = 'inline-block';
    }

    // --- Existing code for card deletion modal ---
    const confirmDeleteBtn = document.getElementById('confirmDeleteCard');
    const cancelDeleteBtn = document.getElementById('cancelDeleteCard');
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteCard); // Assuming confirmDeleteCard is defined
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', hideDeleteCardModal); // Assuming hideDeleteCardModal is defined
    }
});