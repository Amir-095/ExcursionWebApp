document.addEventListener('DOMContentLoaded', function() {
    // Получаем ссылку на скрытое поле для сохранения выбранных дат
    const selectedDatesInput = document.getElementById('selected_dates_input');
    const selectedDatesPreview = document.getElementById('selected-dates-preview');
    
    // Переменные для модального окна подтверждения сохранения
    const saveConfirmModal = document.getElementById('saveConfirmModal');
    const changesPreview = document.getElementById('changesPreview');
    const confirmSaveBtn = document.getElementById('confirmSaveChanges');
    const cancelSaveBtn = document.getElementById('cancelSaveChanges');
    const closeSaveModalBtn = document.getElementById('closeSaveConfirmModal');
    
    // Функция для форматирования даты в локальный формат
    function formatDateForDisplay(dateStr) {
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}.${month}.${year}`;
    }
    
    // Функция для форматирования даты в формат YYYY-MM-DD без смещения часового пояса
    function formatDateYMD(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Функция для обновления превью выбранных дат
    function updateSelectedDatesPreview(dates) {
        selectedDatesPreview.innerHTML = '';
        
        if (dates.length > 0) {
            dates.forEach(date => {
                const dateTag = document.createElement('div');
                dateTag.className = 'selected-date-tag';
                dateTag.innerHTML = `<i class="fas fa-calendar-day"></i> ${formatDateForDisplay(date)}`;
                selectedDatesPreview.appendChild(dateTag);
            });
        }
    }
    
    // Функция открытия модального окна подтверждения
    function openSaveConfirmModal() {
        // Готовим обзор изменений для отображения в модальном окне
        changesPreview.innerHTML = '';
        
        // Проверяем основные изменения в форме
        const title = document.querySelector('#id_title').value;
        const description = document.querySelector('#id_description').value;
        const location = document.querySelector('#id_location').value;
        
        // Добавляем информацию о названии и месте экскурсии
        let summaryHTML = `
            <div class="summary-item">
                <div class="summary-title"><i class="fas fa-map-marker-alt"></i> Информация об экскурсии</div>
                <div class="summary-content">
                    <strong>Название:</strong> ${title}<br>
                    <strong>Местоположение:</strong> ${location}
                </div>
            </div>
        `;
        
        // Проверяем новые даты
        const newDatesCount = datePicker.selectedDates.length;
        if (newDatesCount > 0) {
            let newDatesHTML = `
                <div class="summary-item">
                    <div class="summary-title"><i class="fas fa-calendar-plus"></i> Добавление новых дат</div>
                    <div class="summary-content">
                        Будет добавлено новых дат: ${newDatesCount}
                    </div>
                </div>
            `;
            summaryHTML += newDatesHTML;
        }
        
        // Проверяем удаляемые даты
        const dateCards = document.querySelectorAll('.date-card.selected');
        if (dateCards.length > 0) {
            let deletedDatesHTML = `
                <div class="summary-item">
                    <div class="summary-title"><i class="fas fa-calendar-times"></i> Удаление дат</div>
                    <div class="summary-content">
                        Будет удалено дат: ${dateCards.length}
                    </div>
                </div>
            `;
            summaryHTML += deletedDatesHTML;
        }
        
        // Добавляем информацию о загрузке изображения, если есть
        const fileInput = document.getElementById('id_image_file');
        if (fileInput && fileInput.files.length > 0) {
            let imageHTML = `
                <div class="summary-item">
                    <div class="summary-title"><i class="fas fa-image"></i> Изображение</div>
                    <div class="summary-content">
                        Будет загружено новое изображение: ${fileInput.files[0].name}
                    </div>
                </div>
            `;
            summaryHTML += imageHTML;
        }
        
        changesPreview.innerHTML = summaryHTML;
        
        // Открываем модальное окно
        saveConfirmModal.classList.add('active');
    }
    
    // Функция закрытия модального окна подтверждения
    function closeSaveConfirmModal() {
        saveConfirmModal.classList.remove('active');
    }
    
    // Инициализация flatpickr для выбора дат
    const datePicker = flatpickr("#date_picker", {
        mode: "multiple",
        dateFormat: "Y-m-d",
        minDate: "today",
        locale: {
            firstDayOfWeek: 1
        },
        onChange: function(selectedDates, dateStr) {
            // При изменении выбранных дат обновляем скрытое поле
            if (selectedDates.length > 0) {
                const formattedDates = selectedDates.map(date => {
                    return formatDateYMD(date); // Формат YYYY-MM-DD без смещения
                }).join(',');
                
                selectedDatesInput.value = formattedDates;
                console.log('Выбранные даты:', formattedDates);
                
                // Обновляем превью выбранных дат
                updateSelectedDatesPreview(selectedDates.map(d => formatDateYMD(d)));
                
                if (selectedDates.length === 1) {
                    showToast('success', 'Добавлена дата', 'Дата будет добавлена после сохранения формы');
                } else {
                    showToast('success', 'Добавлено дат: ' + selectedDates.length, 'Даты будут добавлены после сохранения формы');
                }
            } else {
                selectedDatesInput.value = '';
                selectedDatesPreview.innerHTML = '';
            }
        }
    });
    
    // Инициализация flatpickr для выбора времени
    flatpickr(".time-picker", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true
    });
    
    // Обработчик для карточек с датами
    const dateCards = document.querySelectorAll('.date-card');
    dateCards.forEach(card => {
        const deleteBtn = card.querySelector('.delete-btn');
        const cancelBtn = card.querySelector('.cancel-delete-btn');
        const checkbox = card.querySelector('.date-checkbox');
        const dateText = card.querySelector('.date-text').textContent;
        
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            checkbox.checked = true;
            card.classList.add('selected');
            showToast('warning', 'Дата помечена для удаления', 'Изменения вступят в силу после сохранения формы');
        });
        
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            checkbox.checked = false;
            card.classList.remove('selected');
            showToast('success', 'Отменено', 'Дата не будет удалена');
        });
        
        // Устанавливаем начальное состояние карточки
        if (checkbox.checked) {
            card.classList.add('selected');
        }
    });
    
    // Обработчик для превью изображения
    const fileInput = document.getElementById('id_image_file');
    const fileNameDisplay = document.getElementById('file-name');
    const imagePreview = document.getElementById('image-preview');
    
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const fileName = this.files[0].name;
                fileNameDisplay.textContent = fileName;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.innerHTML = `<img src="${e.target.result}" alt="Превью">`;
                };
                reader.readAsDataURL(this.files[0]);
            } else {
                fileNameDisplay.textContent = 'Файл не выбран';
                imagePreview.innerHTML = '<span>Предпросмотр изображения</span>';
            }
        });
    }
    
    // Функция для отображения уведомлений
    function showToast(type, title, message) {
        const toastContainer = document.getElementById('toastContainer');
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconClass = 'fa-info-circle';
        if (type === 'success') {
            iconClass = 'fa-check-circle';
        } else if (type === 'error') {
            iconClass = 'fa-exclamation-circle';
        } else if (type === 'warning') {
            iconClass = 'fa-exclamation-triangle';
        }
        
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
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            
            const progressBar = toast.querySelector('.toast-progress');
            progressBar.style.width = '100%';
            progressBar.style.transitionDuration = '5000ms';
            
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                }, 500);
            }, 5000);
        }, 10);
    }
    
    // Валидация формы перед отправкой
    const form = document.querySelector('.excursion-form');
    let formSubmitAllowed = false;
    
    if (form) {
        form.addEventListener('submit', function(e) {
            // Если форма уже прошла проверку и была подтверждена в модальном окне
            if (formSubmitAllowed) {
                showToast('info', 'Обработка', 'Сохранение изменений...');
                return true;
            }
            
            e.preventDefault();
            
            let isValid = true;
            const requiredFields = form.querySelectorAll('[required]');
            
            // Проверяем, есть ли выбранные даты в picker и сохранены ли они в скрытом поле
            const pickerDates = datePicker.selectedDates;
            if (pickerDates.length > 0 && !selectedDatesInput.value) {
                // Если есть даты но они не сохранились в скрытом поле, попробуем их сохранить
                const formattedDates = pickerDates.map(date => {
                    return formatDateYMD(date);
                }).join(',');
                selectedDatesInput.value = formattedDates;
                console.log('Даты восстановлены перед отправкой:', formattedDates);
            }
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('invalid');
                } else {
                    field.classList.remove('invalid');
                }
            });
            
            if (!isValid) {
                showToast('error', 'Ошибка', 'Пожалуйста, заполните все обязательные поля.');
                
                // Прокрутка к первому неверному полю
                const firstInvalid = form.querySelector('.invalid');
                if (firstInvalid) {
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                // Форма валидна, открываем модальное окно для подтверждения
                openSaveConfirmModal();
            }
        });
    }
    
    // Обработчики событий для модального окна подтверждения сохранения
    if (confirmSaveBtn) {
        confirmSaveBtn.addEventListener('click', function() {
            formSubmitAllowed = true;
            closeSaveConfirmModal();
            form.submit();
        });
    }
    
    if (cancelSaveBtn) {
        cancelSaveBtn.addEventListener('click', closeSaveConfirmModal);
    }
    
    if (closeSaveModalBtn) {
        closeSaveModalBtn.addEventListener('click', closeSaveConfirmModal);
    }
    
    // Закрытие модального окна при клике вне его области
    saveConfirmModal.addEventListener('click', function(e) {
        if (e.target === saveConfirmModal) {
            closeSaveConfirmModal();
        }
    });

    // --- Новая логика для управления видимостью поля количества дней ---
    const durationSelect = document.getElementById('id_duration'); // Убедитесь, что ID правильный
    const numberOfDaysGroup = document.getElementById('number_of_days_group');
    const numberOfDaysInput = document.getElementById('id_number_of_days'); // Убедитесь, что ID правильный

    function toggleNumberOfDaysField() {
        if (durationSelect && numberOfDaysGroup && numberOfDaysInput) { // Добавляем проверку на существование элементов
            if (durationSelect.value === 'Несколько дней') {
                numberOfDaysGroup.style.display = 'block';
                numberOfDaysInput.required = true; // Сделать поле обязательным
                // Установить минимальное значение, если нужно
                if (!numberOfDaysInput.hasAttribute('min')) {
                     numberOfDaysInput.setAttribute('min', '2');
                }
            } else {
                numberOfDaysGroup.style.display = 'none';
                numberOfDaysInput.required = false; // Сделать поле необязательным
                // Очищать значение не обязательно, т.к. оно может быть уже сохранено
                // numberOfDaysInput.value = ''; 
            }
        } else {
            console.error('Не удалось найти элементы для управления полем количества дней.');
        }
    }

    // Вызвать функцию при загрузке страницы (на случай, если значение уже выбрано)
    toggleNumberOfDaysField(); 

    // Добавить слушатель событий для изменений
    if (durationSelect) {
        durationSelect.addEventListener('change', toggleNumberOfDaysField);
    } 
    // --- Конец новой логики ---
});

// Функция для создания кастомного фильтра для шаблонов Django
function addDjangoFilter(name) {
    window[name] = function(obj) {
        return obj;
    };
}

// Создаем кастомный фильтр to_base64 для поддержки шаблонов
addDjangoFilter('to_base64'); 