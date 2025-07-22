# Excursion

Веб-приложение на Django для поиска и бронирования экскурсий по Казахстану

## Требования

- Python 3.10+
- PostgreSQL
- pip

## Установка

1. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/anablos/ExcursionWebApp.git
   cd excursion
   ```

2. **Создайте и активируйте виртуальное окружение:**
   ```bash
   python -m venv venv
   venv\Scripts\Activate
   ```

3. **Установите зависимости:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Настройте базу данных PostgreSQL:**
   - Создайте базу данных и пользователя, соответствующих переменным из `.env`.

5. **Создайте файл `.env` в корне проекта и заполните его (см. пример ниже).**
```bash
SECRET_KEY= ваш секретный ключ django
FERNET_KEY= ваш fernet ключ для шифрования
POSTGRES_DB= имя вашей базы данных
POSTGRES_US= имя пользователя бд
POSTGRES_PASSWORD= пароль пользователя бд
POSTGRES_HOST = хост бд ( обычно "localhost" )
POSTGRES_PORT = порт бд ( обычно 5432 )
EMAIL_HOST_USER= ваш email для отправки писем
EMAIL_HOST_PASSWORD= специальныйпароль от email
GOOGLE_MAPS_API_KEY= ваш api ключ от google maps
```

6. **Примените миграции:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

7. **Создайте суперпользователя:**
   ```bash
   python manage.py createsuperuser
   ```

9. **Запустите сервер:**
   ```bash
   python manage.py runserver
   ```


## Локализация

Проект поддерживает несколько языков: русский, казахский, английский. Файлы переводов находятся в папке `locale/`.

## Статические файлы

CSS, JS и изображения находятся в папке `static/`.
