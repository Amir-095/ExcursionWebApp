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
    const selectedDate = document.getElementById('selectedDate').value;
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

// Функция для выбора даты
function selectDate(date) {
    // Обновляем скрытое поле с выбранной датой
    document.getElementById('selectedDate').value = date;

    // Обновляем активную кнопку
    const dateOptions = document.querySelectorAll('.date-option');
    dateOptions.forEach(option => {
        const dateValueElement = option.querySelector('.date-value');
        if (dateValueElement && dateValueElement.innerText === date) {
            option.classList.add('active');
        } else if (!option.classList.contains('date-picker')) {
            option.classList.remove('active');
        }
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем общую цену
    updateTotalPrice();
});


function validateCardNumber(cardNumber) {
    // Убираем пробелы из номера карты
    cardNumber = cardNumber.replace(/\s+/g, '');

    // Проверяем, что номер карты состоит только из цифр и длина от 13 до 19 символов
    if (!/^\d{13,19}$/.test(cardNumber)) {
        return false;
    }

    // Алгоритм Луна
    let sum = 0;
    let shouldDouble = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i]);

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
}

function validatePaymentData(cardNumber, expiryDate, cvc, cardholderName) {
    // Проверка номера карты (используем функцию validateCardNumber)
    if (!validateCardNumber(cardNumber)) {
        showToast('error', 'Ошибка проверки карты', 'Номер карты некорректен. Пожалуйста, проверьте введённые данные.');
        return false;
    }

    // Проверка срока действия карты в формате MM/YY
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        showToast('error', 'Ошибка проверки карты', 'Срок действия карты некорректен. Используйте формат ММ/ГГ.');
        return false;
    }

    // Разделяем месяц и год для дальнейшей проверки
    const [month, year] = expiryDate.split('/').map(num => parseInt(num, 10));
    const currentYear = new Date().getFullYear() % 100; // Последние 2 цифры текущего года
    const currentMonth = new Date().getMonth() + 1; // Текущий месяц (от 1 до 12)

    // Проверка месяца
    if (month < 1 || month > 12) {
        showToast('error', 'Ошибка проверки карты', 'Месяц окончания карты некорректен.');
        return false;
    }

    // Проверка, что срок действия карты не истёк
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        showToast('error', 'Ошибка проверки карты', 'Срок действия карты истёк.');
        return false;
    }

    // Проверка CVC-кода
    if (!/^\d{3,4}$/.test(cvc)) {
        showToast('error', 'Ошибка проверки карты', 'CVC-код некорректен.');
        return false;
    }

    // Проверка имени владельца карты
    if (!cardholderName || cardholderName.trim().length < 2) {
        showToast('error', 'Ошибка проверки карты', 'Имя владельца карты некорректно.');
        return false;
    }

    return true;
}

// Временное хранение данных формы для модального подтверждения
let tempFormData = null;
let processingExcursionId = null;

function processPayment(excursionId) {
    // Добавляем анимацию загрузки на кнопку
    const paymentButton = document.querySelector('.payment-btn');
    if (paymentButton) {
        paymentButton.classList.add('loading');
    }

    const formData = new FormData(document.getElementById('paymentForm')); // Сбор данных из формы
    const savedCardSelect = document.getElementById('savedCardSelect');
    const selectedSavedCard = savedCardSelect.value; // Выбранная карта

    // Добавляем информацию о карте в данные формы
    if (!selectedSavedCard) {
        // Если выбрана новая карта, сохраняем параметры новой карты
        const cardNumber = document.querySelector('input[name="card_number"]').value.trim();
        const expiryDate = document.querySelector('input[name="expiry_date"]').value.trim();
        const cvc = document.querySelector('input[name="cvc"]').value.trim();
        const cardholderName = document.querySelector('input[name="cardholder_name"]').value.trim();

        // Проверяем корректность введённых данных карты
        if (!validatePaymentData(cardNumber, expiryDate, cvc, cardholderName)) {
            console.log("Ошибка валидации данных карты");
            // Убираем анимацию загрузки при ошибке
            if (paymentButton) {
                paymentButton.classList.remove('loading');
            }
            return;
        }

        // Сначала проверяем, существует ли карта уже у пользователя
        checkCardExists(cardNumber, expiryDate, cardholderName)
            .then(exists => {
                if (exists) {
                    console.log("Карта уже существует, пропускаем запрос на сохранение");
                    // Устанавливаем значение "false" для сохранения карты, так как она уже есть
                    formData.append('save_card', "false");
                    
                    // Добавляем данные карты к запросу
                    formData.append('card_number', cardNumber);
                    formData.append('expiry_date', expiryDate);
                    formData.append('cvc', cvc);
                    formData.append('cardholder_name', cardholderName);
                    
                    // НЕ убираем анимацию загрузки здесь, пусть она останется до завершения запроса
                    submitPaymentRequest(formData, excursionId);
                } else {
                    // Сохраняем данные формы и ID экскурсии для последующей обработки
                    tempFormData = new FormData(document.getElementById('paymentForm'));
                    
                    // Добавляем данные карты к временной форме
                    tempFormData.append('card_number', cardNumber);
                    tempFormData.append('expiry_date', expiryDate);
                    tempFormData.append('cvc', cvc);
                    tempFormData.append('cardholder_name', cardholderName);
                    
                    processingExcursionId = excursionId;

                    // Показываем модальное окно для подтверждения сохранения карты
                    showSaveCardModal();
                    
                    // Убираем анимацию загрузки при показе модального окна
                    if (paymentButton) {
                        paymentButton.classList.remove('loading');
                    }
                }
            })
            .catch(error => {
                console.error("Ошибка при проверке карты:", error);
                // При ошибке проверки карты, всё равно показываем модальное окно
                tempFormData = new FormData(document.getElementById('paymentForm'));
                
                // Добавляем данные карты к временной форме
                tempFormData.append('card_number', cardNumber);
                tempFormData.append('expiry_date', expiryDate);
                tempFormData.append('cvc', cvc);
                tempFormData.append('cardholder_name', cardholderName);
                
                processingExcursionId = excursionId;
                showSaveCardModal();
                
                // Убираем анимацию загрузки при ошибке
                if (paymentButton) {
                    paymentButton.classList.remove('loading');
                }
            });
    } else {
        // Если выбрана сохранённая карта, передаём её ID
        formData.append('saved_card', selectedSavedCard);
        
        // Продолжаем с отправкой запроса
        submitPaymentRequest(formData, excursionId);
    }
}

// Функция для проверки существования карты через API
function checkCardExists(cardNumber, expiryDate, cardholderName) {
    const last4 = cardNumber.replace(/\s+/g, '').slice(-4); // Последние 4 цифры
    
    return fetch('/check-card/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            last4: last4,
            expiry_date: expiryDate,
            cardholder_name: cardholderName
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при проверке карты');
        }
        return response.json();
    })
    .then(data => {
        return data.exists; // true или false
    });
}

// Функция для отображения модального окна подтверждения
function showSaveCardModal() {
    const modal = document.getElementById('saveCardModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Функция для скрытия модального окна
function hideSaveCardModal() {
    const modal = document.getElementById('saveCardModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Функция для отправки запроса на оплату
function submitPaymentRequest(formData, excursionId) {
    // Добавляем анимацию загрузки на кнопку
    const paymentButton = document.querySelector('.payment-btn');
    if (paymentButton) {
        paymentButton.classList.add('loading');
    }
    
    // Отправляем запрос на сервер
    fetch('/process-payment/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        // Убираем анимацию загрузки
        if (paymentButton) {
            paymentButton.classList.remove('loading');
        }

        if (data.status === 'success') {
            showToast('success', 'Оплата успешна', data.message);
            // Перенаправляем на список экскурсий после небольшой задержки
            setTimeout(() => {
                window.location.href = "/excursions";
            }, 2000);
        } else {
            showToast('error', 'Ошибка оплаты', data.message);
        }
    })
    .catch(error => {
        console.error('Ошибка при обработке оплаты:', error);
        showToast('error', 'Ошибка', 'Произошла ошибка при обработке оплаты. Попробуйте ещё раз.');
        
        // Убираем анимацию загрузки при ошибке
        if (paymentButton) {
            paymentButton.classList.remove('loading');
        }
    });
}

// Функции для работы с кредитной картой
function showHideNewCardFields() {
    const newCardFields = document.getElementById('newCardFields');
    const savedCardSelect = document.getElementById('savedCardSelect');
    
    if (newCardFields && savedCardSelect) {
        if (savedCardSelect.value === "") {
            newCardFields.style.display = 'block';
        } else {
            newCardFields.style.display = 'none';
        }
    }
}

function flipCard(direction) {
    const creditCard = document.getElementById('creditCard');
    if (creditCard) {
        if (direction === 'back') {
            creditCard.classList.add('flipped');
        } else {
            creditCard.classList.remove('flipped');
        }
    }
}

// Функция для автофокуса на CVC поле при переворота карты
function focusOnCVC() {
    setTimeout(function() {
        const cvcInput = document.getElementById('cvc');
        if (cvcInput) {
            cvcInput.focus();
        }
    }, 600); // Время анимации переворота
}

// Инициализация обработчиков событий для страницы оплаты
function initPaymentPage() {
    // Обработчик для селекта сохраненных карт
    const savedCardSelect = document.getElementById('savedCardSelect');
    if (savedCardSelect) {
        savedCardSelect.addEventListener('change', showHideNewCardFields);
    }

    // Обработчики для кнопок переворота карты
    const flipToBackBtn = document.getElementById('flipToBack');
    const flipToFrontBtn = document.getElementById('flipToFront');

    if (flipToBackBtn) {
        flipToBackBtn.addEventListener('click', function(e) {
            e.preventDefault();
            flipCard('back');
            focusOnCVC();
        });
    }

    if (flipToFrontBtn) {
        flipToFrontBtn.addEventListener('click', function(e) {
            e.preventDefault();
            flipCard('front');
        });
    }
    
    // Обработчики для модального окна сохранения карты
    const confirmSaveCardBtn = document.getElementById('confirmSaveCard');
    const cancelSaveCardBtn = document.getElementById('cancelSaveCard');
    
    if (confirmSaveCardBtn) {
        confirmSaveCardBtn.addEventListener('click', function() {
            // Устанавливаем значение "true" для сохранения карты
            document.getElementById('saveCardInput').value = "true";
            if (tempFormData) {
                tempFormData.set('save_card', "true");
                submitPaymentRequest(tempFormData, processingExcursionId);
            }
            hideSaveCardModal();
        });
    }
    
    if (cancelSaveCardBtn) {
        cancelSaveCardBtn.addEventListener('click', function() {
            // Устанавливаем значение "false" для НЕ сохранения карты
            document.getElementById('saveCardInput').value = "false";
            if (tempFormData) {
                tempFormData.set('save_card', "false");
                submitPaymentRequest(tempFormData, processingExcursionId);
            }
            hideSaveCardModal();
        });
    }
}

// Инициализация функций при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, находимся ли мы на странице оплаты
    if (document.getElementById('paymentForm')) {
        initPaymentPage();
    } else {
        // Инициализируем общую цену для страницы деталей экскурсии
        if (document.getElementById('ticketCount')) {
            updateTotalPrice();
        }
    }
});

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
