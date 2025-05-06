document.addEventListener('DOMContentLoaded', function() {
    // Инициализация flatpickr для выбора дат
    flatpickr("#date_picker", {
        mode: "multiple",
        dateFormat: "Y-m-d",
        minDate: "today",
        locale: {
            firstDayOfWeek: 1
        }
    });
    
    // Инициализация flatpickr для выбора времени
    flatpickr(".time-picker", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true
    });
    
    // Обработчик для превью изображения
    const fileInput = document.getElementById('id_image');
    const fileNameDisplay = document.getElementById('file-name');
    const imagePreview = document.getElementById('image-preview');
    
    fileInput.addEventListener('change', function() {
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            fileNameDisplay.textContent = fileName;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Предпросмотр" style="max-width: 100%; max-height: 200px;">`;
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            fileNameDisplay.textContent = 'Файл не выбран';
            imagePreview.innerHTML = '<span>Предпросмотр изображения</span>';
        }
    });
    
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
    form.addEventListener('submit', function(e) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('invalid');
            } else {
                field.classList.remove('invalid');
            }
        });
        
        if (!isValid) {
            e.preventDefault();
            showToast('error', 'Ошибка', 'Пожалуйста, заполните все обязательные поля.');
            
            // Прокрутка к первому неверному полю
            const firstInvalid = form.querySelector('.invalid');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            showToast('info', 'Обработка', 'Создание экскурсии...');
        }
    });

    // --- Новая логика для управления видимостью поля количества дней ---
    const durationSelect = document.getElementById('id_duration');
    const numberOfDaysGroup = document.getElementById('number_of_days_group');
    const numberOfDaysInput = document.getElementById('id_number_of_days');
    const endTimeGroup = document.getElementById('end_time_group'); // Добавлено для работы с группой времени окончания
    const endTimeInput = document.getElementById('id_end_time'); // Добавлено для работы с полем времени окончания

    function toggleNumberOfDaysField() {
        if (durationSelect.value === 'Несколько дней') {
            // Показываем поле количества дней
            numberOfDaysGroup.style.display = 'block';
            numberOfDaysInput.required = true; // Делаем поле обязательным
            
            // Скрываем поле времени окончания
            if (endTimeGroup) {
                endTimeGroup.style.display = 'none';
            }
            if (endTimeInput) {
                endTimeInput.required = false; // Делаем поле необязательным
                // Если поле скрыто, устанавливаем значение по умолчанию, чтобы форма могла быть отправлена
                if (!endTimeInput.value) {
                    endTimeInput.value = '18:00'; // Устанавливаем какое-то стандартное значение
                }
            }
        } else {
            // Скрываем поле количества дней
            numberOfDaysGroup.style.display = 'none';
            numberOfDaysInput.required = false; // Делаем поле необязательным
            numberOfDaysInput.value = ''; // Очищаем значение при скрытии
            
            // Показываем поле времени окончания
            if (endTimeGroup) {
                endTimeGroup.style.display = 'block';
            }
            if (endTimeInput) {
                endTimeInput.required = true; // Делаем поле обязательным
            }
        }
    }

    // Вызвать функцию при загрузке страницы (на случай, если значение уже выбрано)
    toggleNumberOfDaysField(); 

    // Добавить слушатель событий для изменений
    durationSelect.addEventListener('change', toggleNumberOfDaysField);
    // --- Конец новой логики ---
});