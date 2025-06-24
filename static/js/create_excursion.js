document.addEventListener('DOMContentLoaded', function() {
    // --- Объекты локализации для Flatpickr ---

    // Русская локализация
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

    // Английская локализация
    const English = {
        weekdays: {
            shorthand: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            longhand: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        },
        months: {
            shorthand: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            longhand: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        },
        firstDayOfWeek: 0,
        ordinal: (nth) => {
            const s = ["th", "st", "nd", "rd"];
            const v = nth % 100;
            return s[(v - 20) % 10] || s[v] || s[0];
        },
        time_24hr: false,
    };
    
    // Казахская локализация (НОВОЕ)
    const Kazakh = {
        weekdays: {
            shorthand: ["Жс", "Дс", "Сс", "Ср", "Бс", "Жм", "Сб"],
            longhand: ["Жексенбі", "Дүйсенбі", "Сейсенбі", "Сәрсенбі", "Бейсенбі", "Жұма", "Сенбі"],
        },
        months: {
            shorthand: ["Қаң", "Ақп", "Нау", "Сәу", "Мам", "Мау", "Шіл", "Там", "Қыр", "Қаз", "Қар", "Жел"],
            longhand: ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"],
        },
        firstDayOfWeek: 1, // Неделя начинается с Понедельника
        ordinal: function() {
            return "";
        },
        rangeSeparator: ' — ',
        weekAbbreviation: 'Апт.',
        scrollTitle: 'Үлкейту үшін айналдырыңыз',
        toggleTitle: 'Ауыстыру үшін басыңыз',
        amPM: ['ТД', 'ТК'],
        yearAriaLabel: 'Жыл',
        time_24hr: true,
    };


    // --- Динамический выбор локализации ---
    
    const currentLang = document.documentElement.lang || 'ru';
    let currentLocale;

    if (currentLang === 'en') {
        currentLocale = English;
        flatpickr.localize(English);
    } else if (currentLang === 'kk') { // Добавлена проверка для казахского языка
        currentLocale = Kazakh;
        flatpickr.localize(Kazakh);
    } else {
        currentLocale = Russian;
        flatpickr.localize(Russian);
    }

    // --- Инициализация Flatpickr ---

    flatpickr("#date_picker", {
        mode: "multiple",
        dateFormat: "Y-m-d",
        minDate: "today",
        locale: currentLocale, // Используем выбранную локаль
        monthSelectorType: 'static'
    });
    
    flatpickr(".time-picker", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        locale: currentLocale, // Используем выбранную локаль
    });

    // --- Логика загрузки аватара гида ---
    const guideAvatarInput = document.getElementById('id_guide_avatar');
    const guideAvatarNameDisplay = document.getElementById('guide-avatar-name');
    const guideAvatarPreview = document.getElementById('guide-avatar-preview');

    if (guideAvatarInput) {
        guideAvatarInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                const file = this.files[0];
                guideAvatarNameDisplay.textContent = file.name;

                const reader = new FileReader();
                reader.onload = function(e) {
                    guideAvatarPreview.innerHTML = `<img src="${e.target.result}" alt="${file.name}" style="max-width: 100%; max-height: 150px; object-fit: contain;">`;
                };
                reader.readAsDataURL(file);
            } else {
                guideAvatarNameDisplay.textContent = getTranslatedText('Файл не выбран');
                guideAvatarPreview.innerHTML = `<span>${getTranslatedText('Предпросмотр аватарки')}</span>`;
            }
        });
    }
    
    // --- Логика загрузки нескольких изображений ---
    const multipleFileInput = document.getElementById('id_images_to_upload');
    const multipleFileNameDisplay = document.getElementById('file-name-multiple');
    const multipleImagePreviewContainer = document.getElementById('image-preview-multiple');

    if (multipleFileInput) {
        multipleFileInput.addEventListener('change', function() {
            multipleImagePreviewContainer.innerHTML = `<span>${getTranslatedText('Предпросмотр изображений')}</span>`;
            multipleFileNameDisplay.textContent = getTranslatedText('Файлы не выбраны');

            if (this.files.length > 0) {
                let fileNames = [];
                for (let i = 0; i < this.files.length; i++) {
                    const file = this.files[i];
                    fileNames.push(file.name);

                    const reader = new FileReader();
                    reader.onload = (function(file) {
                        return function(e) {
                            if (multipleImagePreviewContainer.querySelector('span')) {
                                multipleImagePreviewContainer.innerHTML = '';
                            }
                            const imgWrapper = document.createElement('div');
                            imgWrapper.className = 'image-preview-item';
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
    
    // --- Валидация формы перед отправкой ---
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
            
            const firstInvalid = form.querySelector('.invalid');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            showToast('info', 'Обработка', 'Создание экскурсии...');
        }
    });

    // --- Логика для управления видимостью поля количества дней ---
    const durationSelect = document.getElementById('id_duration');
    const numberOfDaysGroup = document.getElementById('number_of_days_group');
    const numberOfDaysInput = document.getElementById('id_number_of_days');
    const endTimeGroup = document.getElementById('end_time_group');
    const endTimeInput = document.getElementById('id_end_time');

    function toggleNumberOfDaysField() {
        if (durationSelect.value === 'Несколько дней') {
            numberOfDaysGroup.style.display = 'block';
            numberOfDaysInput.required = true;
            
            if (endTimeGroup) {
                endTimeGroup.style.display = 'none';
            }
            if (endTimeInput) {
                endTimeInput.required = false;
                if (!endTimeInput.value) {
                    endTimeInput.value = '18:00';
                }
            }
        } else {
            numberOfDaysGroup.style.display = 'none';
            numberOfDaysInput.required = false;
            numberOfDaysInput.value = '';
            
            if (endTimeGroup) {
                endTimeGroup.style.display = 'block';
            }
            if (endTimeInput) {
                endTimeInput.required = true;
            }
        }
    }

    // Вызвать функцию при загрузке страницы
    toggleNumberOfDaysField(); 

    // Добавить слушатель событий для изменений
    durationSelect.addEventListener('change', toggleNumberOfDaysField);
});