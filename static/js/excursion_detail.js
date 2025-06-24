function updateTotalPrice() {
    console.log("Обновление цены начато");
    
    // Получаем количество билетов
    const ticketCount = parseInt(document.getElementById('ticketCount').value);
    console.log("Количество билетов:", ticketCount);
    
    // Получаем цену за билет из элемента ticket-price
    const ticketPriceElement = document.querySelector('.ticket-price');
    console.log("Элемент ticket-price:", ticketPriceElement);
    
    if (ticketPriceElement) {
        const pricePerTicket = parseInt(ticketPriceElement.dataset.price);
        console.log("Цена за билет:", pricePerTicket);
        
        const totalPrice = ticketCount * pricePerTicket;
        console.log("Общая цена:", totalPrice);
        
        // Обновляем отображение в элементе ticket-price
        ticketPriceElement.innerText = `₸ ${totalPrice}`;
        console.log("Обновлено ticket-price:", ticketPriceElement.innerText);
    } else {
        console.log("Не найден элемент ticket-price");
    }
}

function updateTicketCount(change) {
    const ticketCountInput = document.getElementById('ticketCount');
    if (!ticketCountInput) {
        console.log("Не найден элемент ticketCount");
        return;
    }
    
    let count = parseInt(ticketCountInput.value) + change;
    count = Math.max(1, count);
    
    console.log("Новое количество билетов:", count);
    ticketCountInput.value = count;
    updateTotalPrice(); // Обновляем цену после изменения количества билетов
}

function redirectToPayment(excursionId) {
    const selectedDateInput = document.getElementById('selectedDate');
    const selectedDate = selectedDateInput.value;
    const ticketCount = parseInt(document.getElementById('ticketCount').value, 10);

    if (!selectedDate) {
        showToast('warning', 'Выберите дату', 'Пожалуйста, выберите дату экскурсии.');
        return;
    }

    window.location.href = `/payment/${excursionId}/?date=${selectedDate}&tickets=${ticketCount}`;
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

// Функция для преобразования формата даты из ISO (YYYY-MM-DD) в формат "DD месяца"
function formatDateToRussian(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    
    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    const month = months[date.getMonth()];
    return `${day} ${month}`;
}

// Функция для преобразования формата даты из ISO (YYYY-MM-DD) в формат "DD айы" на казахском
function formatDateToKazakh(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    
    const months = [
        'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
        'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'
    ];
    
    const month = months[date.getMonth()];
    return `${day} ${month}`;
}

// Функция для преобразования формата даты из ISO (YYYY-MM-DD) в формат "Month DD" на английском
function formatDateToEnglish(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const month = months[date.getMonth()];
    return `${month} ${day}`;
}

// Функция для получения доступных дат относительно текущего дня
function updateAvailableDates() {
    // Получаем доступные даты из скрытого поля
    const datesElement = document.getElementById('availableDatesData');
    if (!datesElement) return;
    
    const datesString = datesElement.getAttribute('data-dates');
    if (!datesString) return;
    
    const availableDates = datesString.split(',');
    if (!availableDates.length) return;
    
    // Получаем текущую локальную дату (без времени)
    const now = new Date();
    // Создаем локальную дату в формате YYYY-MM-DD
    const today = now.getFullYear() + '-' + 
                 String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                 String(now.getDate()).padStart(2, '0');
    
    // Отфильтровываем даты, которые уже прошли
    const futureDates = availableDates.filter(dateStr => {
        return dateStr > today;
    }).sort(); // Сортируем по возрастанию
    
    // Если есть доступные даты в будущем
    if (futureDates.length) {
        // Находим контейнер с кнопками дат
        const dateContainer = document.querySelector('.date-selector');
        if (!dateContainer) return;
        
        // Очищаем текущие кнопки дат (кроме календаря)
        const datePicker = document.querySelector('.date-picker');
        dateContainer.innerHTML = '';
        
        // Вычисляем завтрашнюю и послезавтрашнюю дату в локальном формате YYYY-MM-DD
        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowISO = tomorrowDate.getFullYear() + '-' + 
                           String(tomorrowDate.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(tomorrowDate.getDate()).padStart(2, '0');
        
        const dayAfterTomorrowDate = new Date();
        dayAfterTomorrowDate.setDate(dayAfterTomorrowDate.getDate() + 2);
        const dayAfterTomorrowISO = dayAfterTomorrowDate.getFullYear() + '-' + 
                                   String(dayAfterTomorrowDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                   String(dayAfterTomorrowDate.getDate()).padStart(2, '0');
        
        console.log('Сегодня:', today);
        console.log('Завтра:', tomorrowISO);
        console.log('Послезавтра:', dayAfterTomorrowISO);
        console.log('Доступные даты:', futureDates);
        
        // Добавляем первые две даты (если они есть)
        for (let i = 0; i < Math.min(2, futureDates.length); i++) {
            const dateOption = document.createElement('div');
            dateOption.className = `date-option ${i === 0 ? 'active' : ''}`;
            dateOption.onclick = function() { selectDate(futureDates[i]); };
            
            const dateLabel = document.createElement('div');
            dateLabel.className = 'date-label';
            
            // Определяем, является ли дата "Завтра" или "Послезавтра"
            if (futureDates[i] === tomorrowISO) {
                dateLabel.textContent = window.LABELS ? window.LABELS.tomorrow : 'Завтра';
            } else if (futureDates[i] === dayAfterTomorrowISO) {
                dateLabel.textContent = window.LABELS ? window.LABELS.dayAfterTomorrow : 'Послезавтра';
            } else {
                // Если не завтра и не послезавтра, просто показываем формат даты
                dateLabel.textContent = window.LABELS ? window.LABELS.availableDate : 'Доступная дата';
            }
            
            const dateValue = document.createElement('div');
            dateValue.className = 'date-value';
            dateValue.textContent = formatDateToRussian(futureDates[i]);
            dateValue.setAttribute('data-iso-date', futureDates[i]);
            
            dateOption.appendChild(dateLabel);
            dateOption.appendChild(dateValue);
            dateContainer.appendChild(dateOption);
        }
        
        // Добавляем календарь обратно
        if (datePicker) {
            dateContainer.appendChild(datePicker);
        } else {
            // Если по какой-то причине датапикер не был найден, создаем новый
            const newDatePicker = document.createElement('div');
            newDatePicker.className = 'date-option date-picker';
            newDatePicker.id = 'datepicker-btn';
            
            const calendarIcon = document.createElement('img');
            calendarIcon.src = '/static/images/calendar-search.png';
            calendarIcon.alt = 'Календарь';
            calendarIcon.className = 'calendar-icon';
            
            const dateValue = document.createElement('div');
            dateValue.className = 'date-value';
            dateValue.textContent = 'Выбрать дату';
            
            newDatePicker.appendChild(calendarIcon);
            newDatePicker.appendChild(dateValue);
            dateContainer.appendChild(newDatePicker);
        }
        
        // Устанавливаем первую доступную дату как выбранную
        if (futureDates.length > 0) {
            document.getElementById('selectedDate').value = futureDates[0];
        }
    }
}

function getMonthName(monthIndex) {
    // Получаем язык из глобальной переменной, которую передали из Django
    const lang = window.CURRENT_LANG || 'ru';
    const months_ru = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const months_kk = [
        'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
        'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'
    ];
    if (lang === 'kk') {
        return months_kk[monthIndex];
    }
    return months_ru[monthIndex];
}

function selectDate(date) {
    // Обновляем скрытое поле с выбранной датой (в ISO формате)
    document.getElementById('selectedDate').value = date;

    // Обновляем активную кнопку
    const dateOptions = document.querySelectorAll('.date-option');
    dateOptions.forEach(option => {
        const dateValueElement = option.querySelector('.date-value');
        if (dateValueElement) {
            const isoDate = dateValueElement.getAttribute('data-iso-date') || dateValueElement.textContent;
            if (isoDate === date) {
                option.classList.add('active');
            } else if (!option.classList.contains('date-picker')) {
                option.classList.remove('active');
            }
        } else {
            option.classList.remove('active');
        }
    });

    // Обновляем отображение даты в блоке "Время начала"
    const startDateBlock = document.getElementById('excursion-start-date');
    if (startDateBlock) {
        const startTime = startDateBlock.getAttribute('data-start-time') || '12:00';
        const currentLang = window.CURRENT_LANG || 'ru';
        
        let formattedDate;
        let timePreposition;
        
        if (currentLang === 'kk') {
            formattedDate = formatDateToKazakh(date);
            timePreposition = '';
        } else if (currentLang === 'en') {
            formattedDate = formatDateToEnglish(date);
            timePreposition = 'at';
        } else {
            formattedDate = formatDateToRussian(date);
            timePreposition = 'в';
        }
        
        startDateBlock.textContent = `${formattedDate} ${timePreposition} ${startTime}`;
        startDateBlock.setAttribute('data-iso-date', date);
    }
}

// Функция для корректировки отображения времени в зависимости от продолжительности экскурсии
function adjustTimeDisplay() {
    // Ищем элемент с информацией о длительности
    const durationElement = document.querySelector('.detail-item .detail-value:not(.price)');
    
    if (durationElement) {
        const durationText = durationElement.textContent.trim();
        
        // Если длительность содержит "день" или "дней", значит это многодневная экскурсия
        if (durationText.includes('день') || durationText.includes('дня') || durationText.includes('дней')) {
            // Находим элемент со временем начала и заменяем его текст
            const timeDetailElements = document.querySelectorAll('.detail-item');
            
            // Ищем элемент с временем начала (обычно это второй элемент в списке деталей)
            timeDetailElements.forEach(item => {
                const label = item.querySelector('.detail-label');
                
                if (label && label.textContent.includes('Время начала')) {
                    // Не изменяем этот элемент, он должен отображаться
                } 
                // Находим элемент с длительностью
                else if (label && label.textContent.includes('Длительность')) {
                    const valueElement = item.querySelector('.detail-value');
                    // Для многодневных экскурсий проверяем, что время отображается корректно
                    if (valueElement && !valueElement.textContent.includes('(')) {
                        // Если не содержит времени в скобках, добавляем
                        const match = /(\d+) (день|дня|дней)/.exec(valueElement.textContent);
                        if (match) {
                            const days = match[1];
                            const daysText = match[2];
                            // Находим время начала из другого элемента
                            const startTimeElement = document.querySelector('.detail-item .detail-value:contains("Время начала")');
                            let startTime = "12:00"; // Значение по умолчанию, если не найдено
                            if (startTimeElement) {
                                const timeMatch = /(\d{2}:\d{2})/.exec(startTimeElement.textContent);
                                if (timeMatch) {
                                    startTime = timeMatch[1];
                                }
                            }
                            valueElement.textContent = `${days} ${daysText} (${startTime})`;
                        }
                    }
                }
            });
        }
    }
}

// Функция для обновления форматирования дат на странице
function updateDatesFormatting() {
    const currentLang = window.CURRENT_LANG || 'ru';
    const dateValues = document.querySelectorAll('.date-value[data-iso-date]');
    
    dateValues.forEach(element => {
        const isoDate = element.getAttribute('data-iso-date');
        if (isoDate) {
            if (currentLang === 'kk') {
                element.textContent = formatDateToKazakh(isoDate);
            } else if (currentLang === 'en') {
                element.textContent = formatDateToEnglish(isoDate);
            } else {
                element.textContent = formatDateToRussian(isoDate);
            }
        }
    });

    // Обновляем дату и время в блоке "Время начала"
    const startDateBlock = document.getElementById('excursion-start-date');
    if (startDateBlock) {
        const isoDate = startDateBlock.getAttribute('data-iso-date');
        const startTime = startDateBlock.getAttribute('data-start-time');
        if (isoDate) {
            let formattedDate;
            let timePreposition;
            
            if (currentLang === 'kk') {
                formattedDate = formatDateToKazakh(isoDate);
                timePreposition = '';
            } else if (currentLang === 'en') {
                formattedDate = formatDateToEnglish(isoDate);
                timePreposition = 'at';
            } else {
                formattedDate = formatDateToRussian(isoDate);
                timePreposition = 'в';
            }
            startDateBlock.textContent = `${formattedDate} ${timePreposition} ${startTime}`;
        }
    }
}

// Переменная для хранения ID отзыва для удаления
let reviewToDelete = null;

// Функция для показа модального окна подтверждения удаления
function showDeleteReviewModal(reviewId) {
    reviewToDelete = reviewId;
    const modal = document.getElementById('deleteReviewModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Функция для скрытия модального окна
function hideDeleteReviewModal() {
    const modal = document.getElementById('deleteReviewModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Функция для подтверждения удаления отзыва
function confirmDeleteReview() {
    if (!reviewToDelete) return;
    
    const reviewId = reviewToDelete;
    hideDeleteReviewModal();
    
    fetch(`/delete-review/${reviewId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'X-Requested-With': 'XMLHttpRequest'
        }
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
        showToast('error', 'Ошибка', 'Не удалось удалить отзыв. Попробуйте ещё раз.');
    });
}

// Функция для инициализации обработчиков кнопок отзывов
function initReviewButtons() {
    // Обработчики для кнопок удаления
    document.querySelectorAll('.delete-review-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const reviewId = btn.getAttribute('data-review-id');
            showDeleteReviewModal(reviewId);
        });
    });

    // Обработчики для кнопок редактирования
    document.querySelectorAll('.edit-review-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const reviewId = btn.getAttribute('data-review-id');
            const reviewLi = btn.closest('li');
            const textEl = reviewLi.querySelector('.review-text');
            const starsEl = reviewLi.querySelector('span[style*="font-size:18px"]');
            const oldText = textEl ? textEl.textContent.trim() : '';
            const oldRating = starsEl ? starsEl.querySelectorAll('span[style*="#FFD700"]').length : 5;
            const cancelText = getTranslatedText('Отмена');
            const saveText = getTranslatedText('Сохранить');
            const ratingText = getTranslatedText('Оценка:');
            // Создаём форму редактирования
            const form = document.createElement('form');
            form.style.display = 'flex';
            form.style.flexDirection = 'column';
            form.style.gap = '8px';
            form.innerHTML = `
            <div style='display:flex;align-items:center;gap:8px;'>
                <span style='font-size:16px;'>${ratingText}</span>
                <div class='edit-star-rating' style='display:flex;gap:4px;'>
                    ${[1,2,3,4,5].map(i => `
                        <label style='cursor:pointer;font-size:24px;color:${i<=oldRating?'#FFD700':'#ccc'};'>
                            <input type='radio' name='edit_rating' value='${i}' style='display:none;' ${i===oldRating?'checked':''}>
                            ★
                        </label>
                    `).join('')}
                </div>
            </div>
            <textarea name='edit_text' required rows='3' maxlength='1000' style='padding:8px;border-radius:5px;border:1px solid #ccc;'>${oldText}</textarea>
            <div style='display:flex;gap:8px;justify-content:flex-end;'>
                <button type='button' class='cancel-edit-btn' style='padding:6px 16px;background:#ccc;color:#21336C;border:none;border-radius:5px;cursor:pointer;'>${cancelText}</button>
                <button type='submit' style='padding:6px 16px;background:#21336C;color:#fff;border:none;border-radius:5px;cursor:pointer;'>${saveText}</button>
            </div>
        `;
            
            // Заменяем содержимое отзыва на форму
            reviewLi._oldHtml = reviewLi.innerHTML;
            reviewLi.innerHTML = '';
            reviewLi.appendChild(form);
            
            // JS для звёзд
            const starLabels = form.querySelectorAll('.edit-star-rating label');
            starLabels.forEach((label, idx) => {
                label.addEventListener('mouseover', () => {
                    starLabels.forEach((l, i) => {
                        l.style.color = i <= idx ? '#FFD700' : '#ccc';
                    });
                });
                
                label.addEventListener('mouseout', () => {
                    const selectedRating = form.querySelector('input[name=edit_rating]:checked').value;
                    starLabels.forEach((l, i) => {
                        l.style.color = i < selectedRating ? '#FFD700' : '#ccc';
                    });
                });
                
                label.addEventListener('click', () => {
                    const radio = label.querySelector('input[type=radio]');
                    radio.checked = true;
                    starLabels.forEach((l, i) => {
                        l.style.color = i <= idx ? '#FFD700' : '#ccc';
                    });
                });
            });
            
            // Отмена
            form.querySelector('.cancel-edit-btn').onclick = function() {
                reviewLi.innerHTML = reviewLi._oldHtml;
                // Повторно инициализируем обработчики после отмены
                initReviewButtons();
            };
            
            // Сохранить
            form.onsubmit = function(e) {
                e.preventDefault();
                const newText = form.edit_text.value.trim();
                const newRating = +form.querySelector('input[name=edit_rating]:checked').value;
                
                fetch(`/edit-review/${reviewId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken'),
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({
                        text: newText,
                        rating: newRating
                    })
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
                    showToast('error', 'Ошибка', 'Не удалось обновить отзыв. Попробуйте ещё раз.');
                });
            };
        });
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем обработчики кнопок отзывов
    initReviewButtons();
    
    // Обработчики для кнопок в модальном окне подтверждения удаления
    const confirmDeleteBtn = document.getElementById('confirmDeleteReview');
    const cancelDeleteBtn = document.getElementById('cancelDeleteReview');
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteReview);
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', hideDeleteReviewModal);
    }
    
    // Инициализируем общую цену
    if (document.getElementById('ticketCount')) {
        updateTotalPrice();
    }
    
    // Обновляем доступные даты относительно текущего дня
    updateAvailableDates();
    
    // Проверяем, если у экскурсии продолжительность "Несколько дней",
    // то изменяем отображение времени в деталях экскурсии
    adjustTimeDisplay();
    
    // Инициализируем flatpickr с доступными датами
    initFlatpickr();
    
    // Устанавливаем таймер для обновления дат при смене дня
    scheduleNextDayUpdate();

    // Обновляем форматирование дат в соответствии с текущим языком
    updateDatesFormatting();
});

// Инициализация flatpickr с обработкой форматов дат
function initFlatpickr() {
    // Получаем доступные даты из скрытого поля
    const datesElement = document.getElementById('availableDatesData');
    if (!datesElement) return;
    
    const datesString = datesElement.getAttribute('data-dates');
    if (!datesString) return;
    
    const availableDates = datesString.split(',');
    
    // Получаем текущую локальную дату (без времени)
    const now = new Date();
    // Создаем локальную дату в формате YYYY-MM-DD
    const today = now.getFullYear() + '-' + 
                 String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                 String(now.getDate()).padStart(2, '0');
    
    // Отфильтровываем даты, которые уже прошли
    const futureDates = availableDates.filter(dateStr => {
        return dateStr > today;
    }).sort(); // Сортируем по возрастанию
    
    // Если нет доступных дат, не инициализируем datepicker
    if (!futureDates.length) return;
    
    // Инициализируем flatpickr
    const datePickerBtn = document.getElementById('datepicker-btn');
    if (datePickerBtn) {
        // Определяем язык из глобальной переменной
        const currentLang = window.CURRENT_LANG || 'ru';
        
        // Создаем казахскую локализацию для flatpickr, если её ещё нет
        if (!flatpickr.l10ns.kk) {
            flatpickr.l10ns.kk = {
                weekdays: {
                    shorthand: ["Жк", "Дс", "Сс", "Ср", "Бс", "Жм", "Сб"],
                    longhand: ["Жексенбі", "Дүйсенбі", "Сейсенбі", "Сәрсенбі", "Бейсенбі", "Жұма", "Сенбі"]
                },
                months: {
                    shorthand: ["Қаң", "Ақп", "Нау", "Сәу", "Мам", "Мау", "Шіл", "Там", "Қыр", "Қаз", "Қар", "Жел"],
                    longhand: ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"]
                },
                firstDayOfWeek: 1,
                rangeSeparator: " — ",
                weekAbbreviation: "Апта",
                scrollTitle: "Үлкейту үшін айналдырыңыз",
                toggleTitle: "Ауыстыру үшін басыңыз",
                amPM: ["ТД", "ТК"],
                yearAriaLabel: "Жыл",
                time_24hr: true
            };
        }
        
        // Устанавливаем локализацию в зависимости от выбранного языка
        if (currentLang === 'kk') {
            flatpickr.localize(flatpickr.l10ns.kk);
        } else {
            flatpickr.localize(flatpickr.l10ns.ru);
        }
        
        flatpickr(datePickerBtn, {
            inline: false,
            enable: futureDates,
            dateFormat: "Y-m-d",
            locale: currentLang, // Используем текущий язык
            monthSelectorType: 'static',
            onChange: function(selectedDates, dateStr) {
                selectDate(dateStr);
                // Активируем выбранную дату
                document.querySelectorAll('.date-option').forEach(el => {
                    el.classList.remove('active');
                });
                datePickerBtn.classList.add('active');
                
                // Обновляем текст кнопки
                const dateValueEl = datePickerBtn.querySelector('.date-value');
                if (dateValueEl) {
                    const formattedDate = currentLang === 'kk' ? 
                        formatDateToKazakh(dateStr) : 
                        currentLang === 'en' ? 
                            formatDateToEnglish(dateStr) : 
                            formatDateToRussian(dateStr);
                    dateValueEl.textContent = formattedDate;
                    dateValueEl.setAttribute('data-iso-date', dateStr);
                }
            }
        });
    }
}

// Функция для планирования обновления дат при смене дня
function scheduleNextDayUpdate() {
    const now = new Date();
    // Создаем дату "завтра в полночь" в локальном часовом поясе
    const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 0, 0
    );
    
    // Вычисляем миллисекунды до полуночи
    const timeUntilMidnight = tomorrow - now;
    
    // Устанавливаем таймер, который сработает в полночь
    setTimeout(() => {
        console.log('Наступила полночь! Обновляем даты...');
        // Обновляем даты
        updateAvailableDates();
        initFlatpickr();
        
        // Планируем следующее обновление
        scheduleNextDayUpdate();
    }, timeUntilMidnight);
    
    const minutes = Math.floor(timeUntilMidnight / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const formattedNow = now.toLocaleDateString('ru-RU');
    console.log(`Следующее обновление дат запланировано через ${hours} ч ${remainingMinutes} мин (${formattedNow})`);
}
// Image Slider functionality
const slider = document.querySelector('.slider');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const dotsContainer = document.querySelector('.slider-dots');
const slides = document.querySelectorAll('.slide-image');
let currentIndex = 0;
let slideInterval; // Переменная для хранения интервала

if (slides.length > 0) {
    // Create dots
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) {
            dot.classList.add('active');
        }
        dot.addEventListener('click', () => {
            goToSlide(index);
            resetInterval(); // Сбросить интервал при ручном переключении
        });
        dotsContainer.appendChild(dot);
    });

    function goToSlide(index) {
        currentIndex = index;
        const offset = -currentIndex * 100;
        slider.style.transform = `translateX(${offset}%)`;

        // Update active dot
        document.querySelectorAll('.dot').forEach((dot, i) => {
            if (i === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        goToSlide(currentIndex);
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        goToSlide(currentIndex);
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', prevSlide);
    }
        // --- Добавляем автопрокрутку ---
        function startAutoSlide() {
            // Убедитесь, что слайдер есть и в нем больше одного изображения
            if (slides.length > 1) {
                slideInterval = setInterval(nextSlide, 3000); // Переключать слайд каждые 3 секунды (3000 мс)
            }
        }
    
        function resetInterval() {
            clearInterval(slideInterval); // Очистить текущий интервал
            startAutoSlide(); // Запустить новый интервал
        }
    
        // Запустить автопрокрутку при загрузке страницы
        startAutoSlide();

} 
else {
    // Hide slider controls if no images
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (dotsContainer) dotsContainer.style.display = 'none';
}