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
        return dateStr >= today;
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
                dateLabel.textContent = 'Завтра';
            } else if (futureDates[i] === dayAfterTomorrowISO) {
                dateLabel.textContent = 'Послезавтра';
            } else {
                // Если не завтра и не послезавтра, просто показываем формат даты
                dateLabel.textContent = 'Доступная дата';
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

// Обновляем функцию selectDate для работы с новым форматом дат
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
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
        return dateStr >= today;
    }).sort(); // Сортируем по возрастанию
    
    // Если нет доступных дат, не инициализируем datepicker
    if (!futureDates.length) return;
    
    // Инициализируем flatpickr
    const datePickerBtn = document.getElementById('datepicker-btn');
    if (datePickerBtn) {
        flatpickr(datePickerBtn, {
            inline: false,
            enable: futureDates,
            dateFormat: "Y-m-d",
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
                    dateValueEl.textContent = formatDateToRussian(dateStr);
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
