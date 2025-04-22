function updateButtonVisibility(container) {
    const cards = container.querySelector('.excursion-cards');
    const isStart = cards.scrollLeft === 0;
    const isEnd = Math.abs(cards.scrollLeft + cards.offsetWidth - cards.scrollWidth) < 1;
    
    container.querySelector('.prev').style.display = isStart ? 'none' : 'flex';
    container.querySelector('.next').style.display = isEnd ? 'none' : 'flex';
}

function slideCards(button, direction) {
    const container = button.closest('.excursion-slider-container');
    const cards = container.querySelector('.excursion-cards');
    const cardWidth = 328; // card width + gap
    const currentScroll = cards.scrollLeft;
    const newScroll = currentScroll + (cardWidth * direction);
    
    // Обновляем видимость кнопок сразу
    updateButtonVisibility(container);
    
    cards.scrollTo({
        left: newScroll,
        behavior: 'smooth'
    });
    
    // Добавляем слушатель для обновления во время скролла
    cards.addEventListener('scroll', () => {
        updateButtonVisibility(container);
    }, { passive: true });
}

// Initialize button visibility on page load
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.excursion-slider-container').forEach(container => {
        const cards = container.querySelector('.excursion-cards');
        
        // Начальная проверка видимости кнопок
        updateButtonVisibility(container);
        
        // Добавляем слушатель для обновления во время скролла
        cards.addEventListener('scroll', () => {
            updateButtonVisibility(container);
        }, { passive: true });
    });
}); 