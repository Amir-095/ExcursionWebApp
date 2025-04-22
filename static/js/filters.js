let filterTimeout;

function handleFilterChange(event) {
    // Отменяем предыдущий таймаут, если он есть
    clearTimeout(filterTimeout);
    
    // Устанавливаем новый таймаут для отправки формы
    filterTimeout = setTimeout(() => {
        const form = document.getElementById('filterForm');
        
        // Собираем все выбранные значения
        const formData = new FormData(form);
        const params = new URLSearchParams();
        
        // Группируем параметры по именам
        const groupedParams = {};
        for (const [key, value] of formData.entries()) {
            if (!groupedParams[key]) {
                groupedParams[key] = [];
            }
            groupedParams[key].push(value);
        }
        
        // Добавляем параметры в URL
        for (const [key, values] of Object.entries(groupedParams)) {
            values.forEach(value => {
                params.append(key, value);
            });
        }
        
        // Перенаправляем на URL с параметрами
        window.location.href = `${form.action}?${params.toString()}`;
    }, 500); // Задержка в 500мс перед отправкой
}

// Устанавливаем начальные значения чекбоксов при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const form = document.getElementById('filterForm');
    
    // Для каждого параметра в URL
    for (const [key, value] of params.entries()) {
        // Находим соответствующий чекбокс
        const checkbox = form.querySelector(`input[name="${key}"][value="${value}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    }
}); 