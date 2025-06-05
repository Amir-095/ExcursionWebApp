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
    const last4 = cardNumber.replace(/\s+/g, '').slice(-4); 
    
    return fetch(checkCardUrl, { // Используем переменную checkCardUrl
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
            'X-Requested-With': 'XMLHttpRequest' // Добавляем этот заголовок
        },
        body: JSON.stringify({
            last4: last4,
            expiry_date: expiryDate,
            cardholder_name: cardholderName
        })
    })
    .then(response => {
        if (!response.ok) {
            // Попытка прочитать текст ошибки, если есть
            return response.text().then(text => {
                let errorMsg = `Ошибка при проверке карты: ${response.status}`;
                try { errorMsg = JSON.parse(text).message || text; } catch (e) { /* оставляем как есть */ }
                throw new Error(errorMsg);
            });
        }
        return response.json();
    })
    .then(data => {
        return data.exists; 
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
    const paymentButton = document.querySelector('.payment-btn');
    if (paymentButton) {
        paymentButton.classList.add('loading');
    }
    
    fetch(processPaymentUrl, { // Используем переменную processPaymentUrl
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'X-Requested-With': 'XMLHttpRequest' // Добавляем этот заголовок
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                let errorMsg = `Ошибка при обработке платежа: ${response.status}`;
                try { errorMsg = JSON.parse(text).message || text; } catch (e) { /* оставляем как есть */ }
                throw new Error(errorMsg);
            });
        }
        return response.json();
    })
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


const cryptoDataStore = {
    'BTC': { network: 'Bitcoin', address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', iconClass: 'fab fa-bitcoin' },
    'ETH': { network: 'Ethereum (ERC-20)', address: '0x0123456789abcdef0123456789abcdef01234567', iconClass: 'fab fa-ethereum' },
    'USDT': { network: 'Tron (TRC-20)', address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', iconClass: 'fas fa-dollar-sign' },
    'SOL': { network: 'Solana', address: 'SoL1U2b9kU3yB8t1n9c4w8hY5g7xW3zP2jA6mQeK', iconClass: 'fas fa-atom' },
    'BNB': { network: 'Binance Smart Chain (BEP-20)', address: '0x00112233445566778899aabbccddeeff00112233', iconClass: 'fas fa-cubes' }
};

// ... (handlePaymentMethodChange остается без изменений) ...
function handlePaymentMethodChange() {
    const cardPaymentSection = document.getElementById('cardPaymentSection');
    const cashPaymentSection = document.getElementById('cashPaymentSection');
    const cryptoPaymentSection = document.getElementById('cryptoPaymentSection');

    if (document.getElementById('payByCardRadio').checked) {
        cardPaymentSection.style.display = 'block';
        cashPaymentSection.style.display = 'none';
        cryptoPaymentSection.style.display = 'none';
    } else if (document.getElementById('payByCashRadio').checked) {
        cardPaymentSection.style.display = 'none';
        cashPaymentSection.style.display = 'block';
        cryptoPaymentSection.style.display = 'none';
    } else if (document.getElementById('payByCryptoRadio').checked) {
        cardPaymentSection.style.display = 'none';
        cashPaymentSection.style.display = 'none';
        cryptoPaymentSection.style.display = 'block';
    }
}


// Обновленная функция для отображения деталей криптовалюты
function updateCryptoDetails() {
    const selectedCurrency = document.getElementById('selectedCryptoCurrency').value; // Читаем из hidden input
    const networkDisplay = document.getElementById('cryptoNetworkDisplay');
    const addressDisplay = document.getElementById('cryptoAddressDisplay');
    const qrCodeWrapper = document.getElementById('cryptoQrCodeWrapper');
    const iconDisplay = document.getElementById('cryptoIconDisplay');
    const iconText = document.getElementById('cryptoIconText');

    if (selectedCurrency && cryptoDataStore[selectedCurrency]) {
        const data = cryptoDataStore[selectedCurrency];
        networkDisplay.textContent = data.network;
        addressDisplay.textContent = data.address;
        
        iconDisplay.className = data.iconClass; // Устанавливаем класс иконки
        iconText.textContent = `${selectedCurrency} Icon/QR (Макет)`;
        qrCodeWrapper.style.display = 'block';
    } else {
        // Этого состояния не должно быть, если всегда есть активная кнопка по умолчанию
        networkDisplay.textContent = '{% trans "не выбрана" %}';
        addressDisplay.textContent = '{% trans "не выбран" %}';
        qrCodeWrapper.style.display = 'none';
        iconDisplay.className = '';
        iconText.textContent = '{% trans "(QR-код/Иконка валюты)" %}';
    }
}


// Обновленная функция инициализации
function initPaymentPage() {
    // ... (существующие слушатели для savedCardSelect, flip кнопок, модального окна) ...
    const savedCardSelect = document.getElementById('savedCardSelect');
    if (savedCardSelect) {
        savedCardSelect.addEventListener('change', showHideNewCardFields);
        showHideNewCardFields(); 
    }

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
    
    const confirmSaveCardBtn = document.getElementById('confirmSaveCard');
    const cancelSaveCardBtn = document.getElementById('cancelSaveCard');
    
    if (confirmSaveCardBtn) {
        confirmSaveCardBtn.addEventListener('click', function() {
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
            document.getElementById('saveCardInput').value = "false";
            if (tempFormData) {
                tempFormData.set('save_card', "false");
                submitPaymentRequest(tempFormData, processingExcursionId);
            }
            hideSaveCardModal();
        });
    }
    // --- Конец существующих слушателей ---


    const paymentMethodButtons = document.querySelectorAll('.payment-method-btn');
    paymentMethodButtons.forEach(button => {
        button.addEventListener('click', function() {
            paymentMethodButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const selectedMethod = this.dataset.method;
            
            document.getElementById('payByCardRadio').checked = (selectedMethod === 'card');
            document.getElementById('payByCashRadio').checked = (selectedMethod === 'cash');
            document.getElementById('payByCryptoRadio').checked = (selectedMethod === 'crypto');
            
            handlePaymentMethodChange();
        });
    });

    // --- NEW: Слушатели для кнопок выбора криптовалюты ---
    const cryptoCurrencyButtons = document.querySelectorAll('.crypto-currency-btn');
    const selectedCryptoInput = document.getElementById('selectedCryptoCurrency');

    cryptoCurrencyButtons.forEach(button => {
        button.addEventListener('click', function() {
            cryptoCurrencyButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            selectedCryptoInput.value = this.dataset.currency; // Обновляем hidden input
            updateCryptoDetails();
        });
    });
    
    // Первоначальные вызовы для установки состояний
    handlePaymentMethodChange();
    updateCryptoDetails(); // Вызываем для установки деталей для BTC по умолчанию

    const mockButtons = document.querySelectorAll('.mock-payment-btn');
    mockButtons.forEach(button => {
        button.addEventListener('click', function() {
            const paymentButton = this;
            const paymentDataType = paymentButton.dataset.paymentType; // Используем data-атрибут

            // Для локализации этих строк в JS, вам понадобится механизм i18n для JavaScript.
            // Например, Django `javascript_catalog` или передача переведенных строк через data-атрибуты.
            // Ниже приведены строки как msgid для вашего .po файла.
            let successTitle = "Заказ успешно оформлен!"; // msgid "Заказ успешно оформлен!"
            let successMessage = "";

            if (paymentDataType === "cash") {
                successMessage = "Оплата наличными будет подтверждена гидом при встрече."; // msgid "Оплата наличными будет подтверждена гидом при встрече."
            } else if (paymentDataType === "crypto") {
                const selectedCryptoCode = selectedCryptoInput ? selectedCryptoInput.value : "Криптовалютой"; // msgid "Криптовалютой" (как запасной вариант)
                let baseCryptoMessage = "Ваш заказ на оплату %s принят к обработке. (Это демонстрация)"; // msgid "Ваш заказ на оплату %s принят к обработке. (Это демонстрация)"
                successMessage = baseCryptoMessage.replace("%s", selectedCryptoCode);
            } else {
                // Этот блок не должен вызываться, если у всех mock-кнопок есть data-payment-type
                successMessage = "Ваш заказ принят к обработке."; // msgid "Ваш заказ принят к обработке."
            }

            paymentButton.classList.add('loading');
            paymentButton.disabled = true;

            setTimeout(() => {
                // paymentButton.classList.remove('loading'); // Не обязательно, если идет редирект
                // paymentButton.disabled = false;

                showToast('success', successTitle, successMessage);
                setTimeout(() => {
                    window.location.href = typeof excursionsListUrl !== 'undefined' ? excursionsListUrl : "/excursions";
                }, 2000);
            }, 1500);
        });
    });
}

// Инициализация функций при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем страницу оплаты
    initPaymentPage();
}); 