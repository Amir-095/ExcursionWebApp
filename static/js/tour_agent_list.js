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
        
        // Функция для отображения модального окна редактирования
        function showEditModalWithHiddenField(id, username, phone) {
            try {
                // Получаем email из скрытого поля
                const hiddenEmail = document.getElementById('agent_email_' + id).value;
                
                // Сначала открываем модальное окно редактирования
                const editModal = document.getElementById('editAgentModal');
                if (editModal) {
                    editModal.style.display = 'block';
                } else {
                    return;
                }
                
                // Заполняем поля формы с небольшой задержкой, чтобы модальное окно успело отобразиться
                setTimeout(() => {
                    document.getElementById('edit_agent_id').value = id;
                    document.getElementById('edit_username').value = username;
                    document.getElementById('edit_agent_email').value = hiddenEmail;
                    document.getElementById('edit_phone_number').value = phone;
                    document.getElementById('edit_new_password').value = '';
                }, 100);
            } catch (error) {
                // Обработка ошибок
            }
        }
        
        // Функция для скрытия модального окна редактирования
        function hideEditModal() {
            document.getElementById('editAgentModal').style.display = 'none';
        }
        
        // Функция для отображения модального окна создания турагента
        function showCreateAgentModal() {
            const modal = document.getElementById('createAgentModal');
            if (modal) {
                modal.style.display = 'block';
            }
        }
        
        // Функция для скрытия модального окна создания турагента
        function hideCreateAgentModal() {
            const modal = document.getElementById('createAgentModal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
        
        // Добавляем обработчик отправки формы после загрузки DOM
        document.addEventListener('DOMContentLoaded', function() {
            const editAgentForm = document.getElementById('editAgentForm');
            if (editAgentForm && !editAgentForm.hasSubmitListener) {
                editAgentForm.hasSubmitListener = true; // Маркер, что обработчик уже добавлен
                
                editAgentForm.addEventListener('submit', function(event) {
                    event.preventDefault();
                    
                    // Отключаем кнопку отправки
                    const submitButton = this.querySelector('button[type="submit"]');
                    if (submitButton) {
                        submitButton.disabled = true;
                    }
                    
                    const formData = new FormData(this);
                    const agentId = document.getElementById('edit_agent_id').value;
                    
                    fetch(`/update-agent/${agentId}/`, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            showToast('success', 'Успешно!', 'Данные турагента обновлены');
                            setTimeout(() => {
                                window.location.reload();
                            }, 2000);
                        } else {
                            showToast('error', 'Ошибка!', data.message || 'Произошла ошибка при обновлении данных');
                            // Повторно активируем кнопку в случае ошибки
                            if (submitButton) {
                                submitButton.disabled = false;
                            }
                        }
                        hideEditModal();
                    })
                    .catch(error => {
                        showToast('error', 'Ошибка!', 'Произошла ошибка при обработке запроса');
                        hideEditModal();
                        // Повторно активируем кнопку в случае ошибки
                        if (submitButton) {
                            submitButton.disabled = false;
                        }
                    });
                });
            }

            
            // Обработка отправки формы создания агента
            const createAgentForm = document.getElementById('createAgentForm');
            if (createAgentForm && !createAgentForm.hasSubmitListener) {
                createAgentForm.hasSubmitListener = true; // Маркер, что обработчик уже добавлен
                
                createAgentForm.addEventListener('submit', function(event) {
                    event.preventDefault();
                    
                    // Отключаем кнопку отправки, чтобы предотвратить повторную отправку
                    const submitButton = this.querySelector('button[type="submit"]');
                    if (submitButton) {
                        submitButton.disabled = true;
                    }
                    
                    const formData = new FormData(this);
                    
                    fetch('/create-tour-agent/', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            showToast('success', 'Успешно!', 'Турагент успешно создан');
                            setTimeout(() => {
                                window.location.reload();
                            }, 2000);
                        } else {
                            showToast('error', 'Ошибка!', data.message || 'Произошла ошибка при создании турагента');
                            // Повторно активируем кнопку в случае ошибки
                            if (submitButton) {
                                submitButton.disabled = false;
                            }
                        }
                        hideCreateAgentModal();
                    })
                    .catch(error => {
                        showToast('error', 'Ошибка!', 'Произошла ошибка при обработке запроса');
                        hideCreateAgentModal();
                        // Повторно активируем кнопку в случае ошибки
                        if (submitButton) {
                            submitButton.disabled = false;
                        }
                    });
                });
            }
            
            // Закрытие модальных окон при клике вне них
            window.onclick = function(event) {
                const editModal = document.getElementById('editAgentModal');
                const createModal = document.getElementById('createAgentModal');
                
                if (editModal && event.target == editModal) {
                    hideEditModal();
                }
                
                if (createModal && event.target == createModal) {
                    hideCreateAgentModal();
                }
            };
        });

        // Проверка авторизации перед выполнением действия
        function checkAuthAndProceed(action) {
            fetch('/check-auth/', {
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