document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchClear = document.getElementById('searchClear');
    
    if (!searchInput || !searchResults) return;
    
    // Показать/скрыть кнопку очистки поиска
    searchInput.addEventListener('input', function() {
        if (this.value) {
            searchClear.style.display = 'block';
            fetchSearchResults(this.value);
        } else {
            searchClear.style.display = 'none';
            searchResults.innerHTML = '';
            searchResults.classList.remove('active');
        }
    });
    
    // Очистить поле поиска при нажатии на кнопку очистки
    searchClear.addEventListener('click', function() {
        searchInput.value = '';
        searchClear.style.display = 'none';
        searchResults.innerHTML = '';
        searchResults.classList.remove('active');
        searchInput.focus();
    });
    
    // Обработка нажатия Enter в поле поиска
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            if (searchInput.value) {
                performSearch();
            }
            e.preventDefault();
        }
    });
    
    // Обработка кликов на результатах поиска
    searchResults.addEventListener('click', function(e) {
        const resultItem = e.target.closest('.search-result-item');
        if (resultItem) {
            const url = resultItem.dataset.url;
            navigateToSearchResult(url);
        }
    });
    
    // Скрыть результаты при клике вне области поиска
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            searchResults.classList.remove('active');
        }
    });
    
    // Функция для выполнения поиска и перенаправления
    function performSearch() {
        if (searchInput.value) {
            // Поиск выполняется по первому найденному результату
            if (searchResults.querySelector('.search-result-item')) {
                const firstResult = searchResults.querySelector('.search-result-item');
                const url = firstResult.dataset.url;
                navigateToSearchResult(url);
            } else {
                // Если нет результатов, перенаправляем на страницу всех экскурсий
                window.location.href = `/excursions/?query=${encodeURIComponent(searchInput.value)}`;
            }
        }
    }
    
    // Функция для навигации по результату поиска
    function navigateToSearchResult(url) {
        // Перепроверяем локацию перед перенаправлением
        const isLocationSearch = url.includes('/excursions') && url.includes('location=');
        if (isLocationSearch) {
            // Гарантируем, что URL содержит слеш перед параметрами запроса
            const baseUrl = '/excursions/';
            const urlParams = new URLSearchParams(url.split('?')[1]);
            window.location.href = `${baseUrl}?${urlParams.toString()}`;
        } else {
            window.location.href = url;
        }
    }
    
    // Функция для получения результатов поиска
    function fetchSearchResults(query) {
        if (query.length < 2) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('active');
            return;
        }
        
        fetch(`/search-api/?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                renderSearchResults(data.results);
                searchResults.classList.add('active');
            } else {
                searchResults.innerHTML = '<div class="search-result-item">Ничего не найдено</div>';
                searchResults.classList.add('active');
            }
        })
        .catch(err => {
            console.error('Ошибка поиска:', err);
            searchResults.innerHTML = '<div class="search-result-item">Ошибка при выполнении поиска</div>';
            searchResults.classList.add('active');
        });
    }
    
    // Функция для отображения результатов поиска
    function renderSearchResults(results) {
        searchResults.innerHTML = '';
        
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.dataset.url = result.url;
            
            // Разный HTML в зависимости от типа результата
            if (result.type === 'location') {
                resultItem.innerHTML = `
                    <div class="search-result-icon">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <div class="search-result-content">
                        <div class="search-result-title">${result.title}</div>
                        <div class="search-result-location">Локация</div>
                    </div>
                `;
            } else if (result.type === 'excursion') {
                resultItem.innerHTML = `
                    <div class="search-result-icon">
                        <i class="fas fa-hiking"></i>
                    </div>
                    <div class="search-result-content">
                        <div class="search-result-title">${result.title}</div>
                        <div class="search-result-location">${result.location}</div>
                    </div>
                `;
            }
            
            searchResults.appendChild(resultItem);
        });
    }
}); 