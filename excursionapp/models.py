from django.db import models
from django.urls import reverse
from django.contrib.auth.models import User
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from cryptography.fernet import Fernet
from django.contrib.auth import get_user_model
from deep_translator import GoogleTranslator
from django.utils.translation import get_language

# Create your models here.

class Excursion(models.Model):
    GROUP_TYPE_CHOICES = [
        ('Групповые', 'Групповые'),
        ('Индивидуальные', 'Индивидуальные'),
        ('Семейные', 'Семейные'),
    ]

    DURATION_CHOICES = [
        ('Несколько часов', 'Несколько часов'),
        ('1 день', '1 день'),
        ('Несколько дней', 'Несколько дней'),
    ]

    LANGUAGE_CHOICES = [
        ('Казахский', 'Казахский'),
        ('Русский', 'Русский'),
        ('Английский', 'Английский'),
    ]
    creator = models.ForeignKey(
        'excursionapp.CustomUser',  # Указывает на модель пользователя
        on_delete=models.CASCADE,  # Удаление экскурсии при удалении пользователя
        related_name='created_excursions',
        verbose_name="Создатель",
        null=True,  # Allow NULL values temporarily
        blank=True
    )
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.BinaryField(null=True, blank=True)
    image_name = models.CharField(max_length=100, null=True, blank=True)
    location = models.CharField(max_length=100, default='Unknown')
    meeting_address = models.CharField(max_length=200, blank=True, null=True, verbose_name="Адрес места встречи")
    end_location = models.CharField(max_length=200, blank=True, null=True, verbose_name="Место окончания экскурсии")
    group_type = models.CharField(max_length=50, choices=GROUP_TYPE_CHOICES, default='Group')
    duration = models.CharField(max_length=50, choices=DURATION_CHOICES, default='1 day')
    number_of_days = models.PositiveIntegerField(null=True, blank=True, verbose_name="Количество дней")
    language = models.CharField(max_length=50, choices=LANGUAGE_CHOICES, default='English')
    start_time = models.TimeField()  # Время начала экскурсии
    end_time = models.TimeField(null=True, blank=True)  # Время окончания экскурсии (может быть пустым для многодневных экскурсий)
    description = models.TextField()  # Описание экскурсии
    guide_name = models.CharField(max_length=100)  # Имя гида
    program = models.TextField(blank=True, null=True, verbose_name="Программа экскурсии")  # Программа экскурсии
    guide_avatar = models.BinaryField(null=True, blank=True, verbose_name="Аватар гида") # Аватар гида

    guide_services = models.BooleanField(default=False, verbose_name="Услуги гида/водителя")
    transfer_service = models.BooleanField(default=False, verbose_name="Трансфер на протяжении всего пути")
    group_first_aid = models.BooleanField(default=False, verbose_name="Групповая аптечка")
    included_lunch = models.BooleanField(default=False, verbose_name="Включенный обед")
    food_included = models.BooleanField(default=False, verbose_name="Питание")
    dates = models.JSONField(verbose_name="Даты проведения", default=list, blank=True)

    def get_dates_list(self):
        return self.dates or []

    def add_date(self, date):
        if not self.dates:
            self.dates = []
        if str(date) not in self.dates:
            self.dates.append(str(date))
            self.save()

    def remove_date(self, date):
        if date in self.dates:
            self.dates.remove(date)
            self.save()

    def translate_text(self, text, target_lang='kk'):
        """Переводит текст на указанный язык с помощью deep-translator"""
        if not text:
            return ""
        
        try:
            # Определяем язык перевода
            if target_lang == 'en':
                translator = GoogleTranslator(source='ru', target='en')
            else:
                translator = GoogleTranslator(source='ru', target=target_lang)
            
            # Разделяем текст на части для соблюдения лимитов API
            max_chunk_size = 4999  # Google Translate API ограничение
            
            if len(text) <= max_chunk_size:
                return translator.translate(text)
            else:
                # Разбиваем текст на абзацы
                paragraphs = text.split('\n')
                translated_paragraphs = []
                
                current_chunk = ""
                for paragraph in paragraphs:
                    if len(current_chunk) + len(paragraph) + 1 <= max_chunk_size:
                        if current_chunk:
                            current_chunk += '\n' + paragraph
                        else:
                            current_chunk = paragraph
                    else:
                        # Переводим накопленный чанк
                        if current_chunk:
                            translated_paragraphs.append(translator.translate(current_chunk))
                        current_chunk = paragraph
                
                # Переводим оставшийся текст
                if current_chunk:
                    translated_paragraphs.append(translator.translate(current_chunk))
                
                return '\n'.join(translated_paragraphs)
        except Exception as e:
            # В случае ошибки возвращаем исходный текст
            print(f"Translation error: {e}")
            return text

    def get_translated_description(self, lang_code):
        """Возвращает переведенное описание экскурсии"""
        if lang_code == 'ru' or not self.description:
            return self.description
        return self.translate_text(self.description, lang_code)
    
    def get_translated_program(self, lang_code):
        """Возвращает переведенную программу экскурсии"""
        if lang_code == 'ru' or not self.program:
            return self.program
        return self.translate_text(self.program, lang_code)

    def get_translated_title(self, lang_code):
        """Возвращает переведенное название экскурсии"""
        if lang_code == 'ru' or not self.title:
            return self.title
        return self.translate_text(self.title, lang_code)

    def get_translated_location(self, lang_code):
        """Возвращает переведенную локацию экскурсии"""
        if lang_code == 'ru' or not self.location:
            return self.location
        return self.translate_text(self.location, lang_code)

    def get_inclusion_status(self):
        included = []
        not_included = []

        options = [
            (self.guide_services, "Услуги гида/водителя"),
            (self.transfer_service, "Трансфер на протяжении всего пути"),
            (self.group_first_aid, "Групповая аптечка"),
            (self.included_lunch, "Включенный обед"),
            (self.food_included, "Питание"),
        ]

        for option, label in options:
            if option:
                included.append(label)
            else:
                not_included.append(label)

        return included, not_included

    def people_count_range(self):
        if self.group_type == 'Групповые':
            return "10-15 человек"
        elif self.group_type == 'Индивидуальные':
            return "1-4 человека"
        elif self.group_type == 'Семейные':
            return "5-8 человек"
        else:
            return "Неизвестно"

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('excursion_detail', args=[str(self.id)])

class BookedExcursion(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    excursion = models.ForeignKey(Excursion, on_delete=models.CASCADE)
    booking_date = models.DateField()  # Дата бронирования
    ticket_count = models.PositiveIntegerField(default=1)  # Количество билетов
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Общая цена
    is_paid = models.BooleanField(default=False)  # Статус оплаты

    class Meta:
        unique_together = ['user', 'excursion', 'booking_date']

    def __str__(self):
        return f"{self.user.username} - {self.excursion.title} ({self.booking_date} - {self.ticket_count} билетов, {self.total_price} KZT)"



class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Администратор'),
        ('tour_agent', 'Турагент'),
        ('user', 'Пользователь'),
    ]
    # Переопределяем поле username, убирая уникальность
    username = models.CharField(
        max_length=150,
        unique=False,
        help_text='Имя пользователя',
    )
    phone_number = models.CharField(max_length=15, unique=True, blank=True, null=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')

    def __str__(self):
        return self.username

class Card(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='cards')  # Связь с пользователем
    encrypted_card_number = models.BinaryField(blank=True, null=True)  # Зашифрованный номер карты
    expiry_date = models.CharField(max_length=5)  # Срок действия (формат MM/YY)
    cardholder_name = models.CharField(max_length=100)  # Имя владельца карты
    added_at = models.DateTimeField(auto_now_add=True)  # Дата добавления карты

    def decrypt_card_number(self):
        cipher = Fernet(settings.FERNET_KEY)
        encrypted_card_number_bytes = bytes(self.encrypted_card_number)
        return cipher.decrypt(encrypted_card_number_bytes).decode()

    def decrypt_four_card_number(self):
        cipher = Fernet(settings.FERNET_KEY)
        encrypted_card_number_bytes = bytes(self.encrypted_card_number)
        card = cipher.decrypt(encrypted_card_number_bytes).decode()  # Сохранение последних 4 цифр
        return card[-4:]

    def save_card_number(self, card_number):
        cipher = Fernet(settings.FERNET_KEY)
        self.encrypted_card_number = cipher.encrypt(card_number.encode())