document.addEventListener('DOMContentLoaded', function() {
    // Инициализация flatpickr для выбора дат
    const Russian = {
        weekdays: {
            shorthand: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
            longhand: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
        },
        months: {
            shorthand: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
            longhand: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
        },
        firstDayOfWeek: 1,
        ordinal: function() {
            return '';
        },
        rangeSeparator: ' — ',
        weekAbbreviation: 'Нед.',
        scrollTitle: 'Прокрутите для увеличения',
        toggleTitle: 'Нажмите для переключения',
        amPM: ['ДП', 'ПП'],
        yearAriaLabel: 'Год',
        time_24hr: true
    };

    flatpickr.localize(Russian);
    
    flatpickr("#date_picker", {
        mode: "multiple",
        dateFormat: "Y-m-d",
        minDate: "today",
        locale: Russian,
        monthSelectorType: 'static'
    });
    
    // Инициализация flatpickr для выбора времени
    flatpickr(".time-picker", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        locale: Russian
    });

    // --- New logic for multiple image uploads ---
    const multipleFileInput = document.getElementById('id_images_to_upload');
    const multipleFileNameDisplay = document.getElementById('file-name-multiple');
    const multipleImagePreviewContainer = document.getElementById('image-preview-multiple');

    if (multipleFileInput) {
        multipleFileInput.addEventListener('change', function() {
            multipleImagePreviewContainer.innerHTML = '<span>Предпросмотр изображений</span>'; // Clear previous previews
            multipleFileNameDisplay.textContent = 'Файлы не выбраны';

            if (this.files.length > 0) {
                let fileNames = [];
                for (let i = 0; i < this.files.length; i++) {
                    const file = this.files[i];
                    fileNames.push(file.name);

                    const reader = new FileReader();
                    reader.onload = (function(file) {
                        return function(e) {
                            if (multipleImagePreviewContainer.querySelector('span')) {
                                multipleImagePreviewContainer.innerHTML = ''; // Remove placeholder span
                            }
                            const imgWrapper = document.createElement('div');
                            imgWrapper.className = 'image-preview-item';
                            // FIX IS HERE: Use ${} for variable interpolation
                            imgWrapper.innerHTML = `<img src="${e.target.result}" alt="${file.name}" style="max-width: 100%; max-height: 150px; object-fit: contain;">`;
                            multipleImagePreviewContainer.appendChild(imgWrapper);
                        };
                    })(file);
                    reader.readAsDataURL(file);
                }
                multipleFileNameDisplay.textContent = fileNames.join(', ');
            }
        });
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
