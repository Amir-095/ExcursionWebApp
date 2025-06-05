from django.shortcuts import render,redirect, get_object_or_404
from .forms import *
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from .decorators import *
from django.http import JsonResponse,HttpResponseForbidden
import base64
from django.views.decorators.http import require_POST
from django.core.mail import send_mail
from .models import *
import json
from cryptography.fernet import Fernet
from django.conf import settings
import re
from datetime import datetime, date, timedelta
from django.template.defaultfilters import register
from random import sample
from django.utils.translation import gettext_lazy as _

# Регистрируем кастомный фильтр для шаблонов
@register.filter(name='to_base64')
def to_base64(value):
    if value:
        try:
            return base64.b64encode(value).decode('utf-8')
        except:
            return ''
    return ''

# Регистрируем кастомный фильтр для добавления классов к полям формы
@register.filter(name='add_class')
def add_class(field, css_class):
    return field.as_widget(attrs={"class": css_class})

#user
def registerPage(request):
    if request.method == 'POST':
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            form = CreateUserForm(request.POST)
            if form.is_valid():
                email = form.cleaned_data.get('email')
                phone_number = form.cleaned_data.get('phone_number')

                if CustomUser.objects.filter(email=email).exists():
                    return JsonResponse({'status': 'error', 'errors': {'email': _('Этот email уже зарегистрирован')}},
                                        status=400)

                if CustomUser.objects.filter(phone_number=phone_number).exists():
                    return JsonResponse({'status': 'error', 'errors': {'phone_number': _('Этот номер уже зарегистрирован')}},
                                        status=400)

                user = form.save(commit=False)
                first_name = form.cleaned_data.get('first_name', '').strip()
                last_name = form.cleaned_data.get('last_name', '').strip()
                user.username = f"{first_name} {last_name}".strip()
                if not user.username:
                    return JsonResponse({'status': 'error', 'errors': {
                        'first_name': _('Имя или фамилия должны быть заполнены.'),
                        'last_name': _('Имя или фамилия должны быть заполнены.')
                         }
                    }, status=400)
                user.save()

                return JsonResponse({'status': 'success'})

            # Обрабатываем ошибки формы
            errors = json.loads(form.errors.as_json())
            custom_error_messages = {}

            for field, error_list in errors.items():
                error_code = error_list[0]['code']

                if field == "email" and error_code == "unique":
                    custom_error_messages["email"] = _("Этот email уже зарегистрирован")
                elif field == "phone_number" and error_code == "unique":
                    custom_error_messages["phone_number"] = _("Этот номер уже зарегистрирован")
                elif field == "password2" and error_code == "password_mismatch":
                    custom_error_messages["password2"] = _("Пароли не совпадают")
                else:
                    custom_error_messages[field] = error_list[0]['message']

            return JsonResponse({'status': 'error', 'errors': custom_error_messages}, status=400)
        else:
            # Если это не AJAX запрос, возвращаем ошибку
            return JsonResponse({'status': 'error', 'message': _('Invalid request')}, status=400)

    # Для GET запросов возвращаем JSON с сообщением об ошибке
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'status': 'error', 'message': _('Method not allowed')}, status=405)
    
    # Для обычных GET запросов возвращаем страницу регистрации
    form = CreateUserForm()
    return render(request, 'register.html', {'form': form})


def loginPage(request):
    if request.method == 'POST':
        username = request.POST.get('username')  # Получаем username (email или номер)
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({'status': 'success'})
        else:
            errors = {
                'username': _('Неверное имя пользователя или пароль'),
                'password': _('Неверное имя пользователя или пароль')
            }
            return JsonResponse({'status': 'error', 'errors': errors}, status=400)

    return JsonResponse({'status': 'error', 'message': _('Invalid request')}, status=400)

def logoutUser(request):
    logout(request)
    return redirect('home')


@login_required(login_url='home')
def profile_view(request):
    # Забронированные экскурсии
    booked_excursions = BookedExcursion.objects.filter(user=request.user).select_related('excursion')
    current_language = request.LANGUAGE_CODE if hasattr(request, 'LANGUAGE_CODE') else 'ru'
    for booking in booked_excursions:
        if booking.excursion.images.first():
            first_image = booking.excursion.images.first()
            image_base64 = base64.b64encode(first_image.image).decode('utf-8')
            booking.excursion.image_url = f"data:image/jpeg;base64,{image_base64}"
        else:
            booking.excursion.image_url = "" # Or a placeholder image URL
        booking.excursion.translated_title = booking.excursion.get_translated_title(current_language)
    # Сохранённые карты пользователя
    saved_cards = request.user.cards.all()

    # Обработка формы загрузки аватара
    avatar_form = ProfileAvatarForm(request.POST or None, request.FILES or None, instance=request.user)
    avatar_success = False
    if request.method == 'POST' and 'avatar' in request.FILES:
        if avatar_form.is_valid():
            avatar_file = request.FILES['avatar']
            request.user.avatar = avatar_file.read()
            request.user.save()
            avatar_success = True

    return render(request, "profile.html", {
        'user': request.user,
        'booked_excursions': booked_excursions,
        'saved_cards': saved_cards,  # Все карты пользователя
        'avatar_form': avatar_form,
        'avatar_success': avatar_success,
    })

def check_auth(request):
    return JsonResponse({'is_authenticated': request.user.is_authenticated})

@login_required
@require_POST # Ensures this view only accepts POST requests
def update_user_profile(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest': # Check if it's an AJAX request
        try:
            data = json.loads(request.body)
            user = request.user

            new_username = data.get('username', '').strip()
            new_email = data.get('email', '').strip()
            new_phone_number = data.get('phone_number', '').strip()

            # --- Validation ---
            errors = {}
            if not new_username:
                errors['username'] = _('Имя не может быть пустым.')
            if not new_email: # You might want to add email format validation here
                errors['email'] = _('Email не может быть пустым.')
            # Add phone number format validation if needed (e.g., regex)

            # Check for uniqueness if email changed
            if new_email.lower() != user.email.lower() and CustomUser.objects.filter(email__iexact=new_email).exclude(pk=user.pk).exists():
                errors['email'] = _('Этот email уже используется другим пользователем.')
            
            # Check for uniqueness if phone number changed (and is not empty)
            if new_phone_number and new_phone_number != user.phone_number and CustomUser.objects.filter(phone_number=new_phone_number).exclude(pk=user.pk).exists():
                errors['phone_number'] = _('Этот номер телефона уже используется другим пользователем.')

            if errors:
                return JsonResponse({'status': 'error', 'errors': errors, 'message': _('Пожалуйста, исправьте ошибки.')}, status=400)

            # --- Update user data ---
            user.username = new_username
            user.email = new_email
            user.phone_number = new_phone_number if new_phone_number else None # Save None if phone is empty
            user.save()

            # Important: If you use email for login and it changes,
            # Django's session authentication usually handles this fine as long as the user ID doesn't change.
            # If your custom authentication backend heavily relies on the email field value stored at login time,
            # you might need to call login(request, user) again to refresh the session,
            # or ensure your authenticate method fetches the user by ID and then checks credentials.
            # For most standard setups, user.save() is sufficient.

            return JsonResponse({
                'status': 'success',
                'message': _('Профиль успешно обновлен.'),
                'user_data': {
                    'username': user.username,
                    'email': user.email,
                    'phone_number': user.phone_number or '' # Return empty string for display if None
                }
            })
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': _('Неверный формат запроса.')}, status=400)
        except Exception as e:
            # Log the error for debugging:
            # import logging
            # logger = logging.getLogger(__name__)
            # logger.error(f"Error updating profile: {e}", exc_info=True)
            return JsonResponse({'status': 'error', 'message': _('Произошла ошибка на сервере.')}, status=500)
    
    return JsonResponse({'status': 'error', 'message': _('Допустимы только AJAX POST запросы.')}, status=405)

#user



#pages
def index(request):
    excursions = Excursion.objects.all().order_by('?')[:4]  # Получаем 4 случайные экскурсии
    current_language = request.LANGUAGE_CODE if hasattr(request, 'LANGUAGE_CODE') else 'ru'
    for excursion in excursions:
        if excursion.images.first():
            first_image = excursion.images.first()
            image_base64 = base64.b64encode(first_image.image).decode('utf-8')
            excursion.image_url = f"data:image/jpeg;base64,{image_base64}"
        else:
            excursion.image_url = "" # Or a placeholder image URL
        excursion.translated_title = excursion.get_translated_title(current_language)

    # Получаем 3 случайных отзыва
    all_reviews = list(SimpleReview.objects.all())
    random_reviews = sample(all_reviews, min(3, len(all_reviews))) if all_reviews else []
    reviews_for_main = []
    for review in random_reviews:
        author_avatar = None
        if review.author_id:
            try:
                user = CustomUser.objects.get(id=review.author_id)
                if user.avatar:
                    author_avatar = base64.b64encode(user.avatar).decode('utf-8')
            except CustomUser.DoesNotExist:
                pass
        translated_text = review.get_translated_text(current_language)
        reviews_for_main.append({
            'author': review.author,
            'author_avatar': author_avatar,
            'text': translated_text,
            'rating': review.rating,
        })

    return render(request, "index.html", {
        'excursions': excursions,
        'reviews_for_main': reviews_for_main,
    })
#pages



#excursion
def all_excursions(request):
    excursions = Excursion.objects.all().order_by('location')
    # Собираем все параметры фильтрации
    group_type = request.GET.getlist('group_type')
    duration = request.GET.getlist('duration')
    language = request.GET.getlist('language')
    location = request.GET.get('location')  # Может прийти из поиска
    
    # Применяем фильтры
    if group_type:
        excursions = excursions.filter(group_type__in=group_type)
    if duration:
        excursions = excursions.filter(duration__in=duration)
    if language:
        excursions = excursions.filter(languages__overlap=language)
    if location:  # Фильтрация по локации
        excursions = excursions.filter(location__iexact=location)

    # Добавляем логирование для отладки
    print(f"Фильтры: группа={group_type}, длительность={duration}, язык={language}, локация={location}")
    print(f"SQL запрос: {excursions.query}")
    
    # Проверка, есть ли результаты
    if not excursions.exists() and location:
        # Если результатов нет, попробуем более мягкий поиск по локации
        print(f"Результаты не найдены для точного совпадения локации. Пробуем нечеткий поиск.")
        excursions = Excursion.objects.filter(location__icontains=location).order_by('location')

    # Получаем текущий язык
    current_language = request.LANGUAGE_CODE if hasattr(request, 'LANGUAGE_CODE') else 'ru'

    # Группируем экскурсии по переведенным локациям
    grouped_excursions = {}
    for excursion in excursions:
        if excursion.images.first():
            first_image = excursion.images.first()
            image_base64 = base64.b64encode(first_image.image).decode('utf-8')
            excursion.image_url = f"data:image/jpeg;base64,{image_base64}"
        else:
            excursion.image_url = "" # Or a placeholder image URL
        # Получаем переведенное название локации
        translated_location = excursion.get_translated_location(current_language)

        if translated_location not in grouped_excursions:
            grouped_excursions[translated_location] = []
        grouped_excursions[translated_location].append(excursion)
        excursion.translated_title = excursion.get_translated_title(current_language)


    # Если после всех фильтров ничего не найдено
    if not grouped_excursions:
        print("Нет результатов после применения всех фильтров")
    
    return render(request, "excursions.html", {
        'grouped_excursions': grouped_excursions,
        'LANGUAGE_CODE': current_language,
    })


@tour_agent_required
def create_excursion(request):
    if request.method == 'POST':
        # Don't pass request.FILES to the form if 'images_to_upload' is not a form field.
        # Pass it only if 'guide_avatar' or other file fields are still on the form.
        form = ExcursionAdminForm(request.POST, request.FILES) # Keep request.FILES for guide_avatar

        if form.is_valid():
            excursion = form.save(commit=False)
            excursion.creator = request.user
            excursion.save()

            # MANUALLY HANDLE MULTIPLE IMAGE UPLOADS
            # The name 'images_to_upload' must match the 'name' attribute in your HTML input
            uploaded_images = request.FILES.getlist('images_to_upload') # Get all files with this name
            if uploaded_images:
                # Delete existing images for this excursion (if any)
                excursion.images.all().delete() # Delete all related ExcursionImage objects

                for uploaded_file in uploaded_images:
                    # Create new ExcursionImage instances
                    ExcursionImage.objects.create(
                        excursion=excursion,
                        image=uploaded_file.read(),  # Read content into bytes
                        image_name=uploaded_file.name
                    )
            return redirect('all_excursions')
    else:
        form = ExcursionAdminForm()
    return render(request, 'create_excursion.html', {'form': form})


@tour_agent_required
def update_excursion(request, pk):
    excursion = get_object_or_404(Excursion, pk=pk)

    if request.user != excursion.creator:
        return HttpResponseForbidden("Вы не можете редактировать эту экскурсию.")

    if request.method == 'POST':
        form = ExcursionAdminForm(request.POST, request.FILES, instance=excursion) # Keep request.FILES for guide_avatar
        if form.is_valid():
            form.save() # Saves the main excursion data

            # MANUALLY HANDLE MULTIPLE IMAGE UPLOADS (replace existing)
            uploaded_images = request.FILES.getlist('images_to_upload') # Get all files with this name
            if uploaded_images:
                # Delete all existing images for this excursion
                excursion.images.all().delete()

                # Save new images
                for uploaded_file in uploaded_images:
                    ExcursionImage.objects.create(
                        excursion=excursion,
                        image=uploaded_file.read(),
                        image_name=uploaded_file.name
                    )
            return redirect('my_excursions')
    else:
        form = ExcursionAdminForm(instance=excursion)
    # The template will display existing images by querying excursion.images.all()
    return render(request, 'update_excursion.html', {'form': form, 'excursion': excursion})

@login_required(login_url='home')
@require_POST
def delete_excursion(request, pk):
    excursion = get_object_or_404(Excursion, pk=pk)
    try:
        excursion.delete()
        return JsonResponse({'status': 'success', 'message': _('Экскурсия успешно удалена')})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': _('Произошла ошибка при удалении экскурсии: ') + str(e)})

def excursion_detail(request, excursion_id):
    excursion = get_object_or_404(Excursion, id=excursion_id)


    # Получение включённых и не включённых элементов
    included_items, not_included_items = excursion.get_inclusion_status()

    # Получаем текущий язык из запроса
    current_language = request.LANGUAGE_CODE if hasattr(request, 'LANGUAGE_CODE') else 'ru'
    
    # Предварительно переводим, чтобы не делать это в шаблоне многократно
    translated_description = excursion.get_translated_description(current_language)
    translated_program = excursion.get_translated_program(current_language)
    dates = excursion.get_dates_list()
    today = date.today().isoformat()
    default_date = None
    formatted_default_date = None
    months_ru = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ]
    months_kk = [
        'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
        'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'
    ]
    months = months_kk if current_language == 'kk' else months_ru
    for d in sorted(dates):
        if d > today:
            default_date = d
            # Форматируем дату в "D месяц" на нужном языке
            import datetime
            try:
                dt = datetime.datetime.strptime(d, '%Y-%m-%d')
                formatted_default_date = f"{dt.day} {months[dt.month - 1]}"
            except Exception:
                formatted_default_date = d
            break

    
    if request.method == 'POST' and 'review_text' in request.POST:
        if request.user.is_authenticated:
            author = request.user.username
        else:
            author = 'Аноним'
        text = request.POST.get('review_text', '').strip()
        try:
            rating = int(request.POST.get('review_rating', 5))
            if rating < 1 or rating > 5:
                rating = 5
        except (TypeError, ValueError):
            rating = 5
        if text:
            SimpleReview.objects.create(
                excursion=excursion,
                author=author,
                author_id=request.user.id if request.user.is_authenticated else None,
                text=text,
                rating=rating
            )
            return redirect('excursion_detail', excursion_id=excursion.id)
    # Формируем список отзывов с аватарками
    reviews_qs = excursion.simple_reviews.order_by('-created_at')
    reviews = []
    for review in reviews_qs:
        author_avatar = None
        if review.author_id:
            try:
                user = CustomUser.objects.get(id=review.author_id)
                if user.avatar:
                    author_avatar = base64.b64encode(user.avatar).decode('utf-8')
            except CustomUser.DoesNotExist:
                pass
        translated_text = review.get_translated_text(current_language)
        reviews.append({
            'id': review.id,
            'author': review.author,
            'author_id': review.author_id,
            'author_avatar': author_avatar,
            'text': translated_text,
            'created_at': review.created_at,
            'rating': review.rating,
        })
    excursion_images = []
    for img in excursion.images.all():
        if img.image:
            image_base64 = base64.b64encode(img.image).decode('utf-8')
            excursion_images.append(f"data:image/jpeg;base64,{image_base64}")
    
    return render(request, 'excursion_detail.html',
        {'excursion': excursion,
         'excursion_images': excursion_images,
        'included_items': included_items,
        'not_included_items': not_included_items,
        'dates': excursion.get_dates_list(),
        'google_maps_api_key': settings.GOOGLE_MAPS_API_KEY,
        'current_language': current_language,
        'translated_description': translated_description,
        'translated_program': translated_program,
        'default_date': default_date,
        'formatted_default_date': formatted_default_date,
        'reviews': reviews,
        'user_id': request.user.id if request.user.is_authenticated else None,
        })

@login_required(login_url='home')
@require_POST
def book_excursion(request, excursion_id):
    excursion = get_object_or_404(Excursion, id=excursion_id)
    data = json.loads(request.body)

    selected_date = data.get('selected_date')
    ticket_count = data.get('ticket_count', 1)  # Default to 1 ticket if not provided

    # Рассчитываем общую стоимость
    final_price = excursion.price * ticket_count

    if not selected_date or selected_date not in excursion.get_dates_list():
        return JsonResponse({'status': 'error', 'message': _('Выбранная дата недоступна для этой экскурсии')})

    if ticket_count <= 0:
        return JsonResponse({'status': 'error', 'message': _('Количество билетов должно быть больше нуля')})

    # Проверяем, была ли оплата за эту экскурсию с указанной датой
    paid_booking = BookedExcursion.objects.filter(
        user=request.user,
        excursion=excursion,
        booking_date=selected_date,
        is_paid=True  # Учитываем только оплаченные бронирования
    ).first()

    if not paid_booking:
        return JsonResponse({'status': 'error', 'message': _('Оплата не была выполнена. Забронировать экскурсию невозможно.')})

    # Проверяем, чтобы одно бронирование для пользователя и даты не создавалось повторно
    if BookedExcursion.objects.filter(
        user=request.user, excursion=excursion, booking_date=selected_date, is_paid=True
    ).exists():
        return JsonResponse({'status': 'error', 'message': _('Вы уже забронировали эту экскурсию на указанную дату.')})

    # Если всё успешно, возвращаем подтверждение
    return JsonResponse({'status': 'success', 'message': _('Бронирование подтверждено.')})

#excursion

#tour_agent

@login_required(login_url='home')
def create_tour_agent(request):
    # Проверяем, что пользователь является администратором
    if not request.user.role == 'admin':
        return HttpResponseForbidden("Доступ запрещён: только для администратора.")

    if request.method == 'POST':
        # Проверяем, является ли запрос AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        username = request.POST.get('username')
        email = request.POST.get('email')
        phone_number = request.POST.get('phone_number')
        password = request.POST.get('password')
        password2 = request.POST.get('password2')
        
        # Проверка паролей
        if password != password2:
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': _('Пароли не совпадают')})
            else:
                form = TourAgentCreationForm()
                return render(request, 'create_tour_agent.html', {'form': form, 'error': _('Пароли не совпадают')})
        
        # Проверка уникальности username
        if CustomUser.objects.filter(username=username).exists():
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': _('Пользователь с таким именем уже существует')})
            else:
                form = TourAgentCreationForm()
                return render(request, 'create_tour_agent.html', {'form': form, 'error': _('Пользователь с таким именем уже существует')})
        
        # Проверка уникальности email
        if CustomUser.objects.filter(email=email).exists():
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': _('Пользователь с таким email уже существует')})
            else:
                form = TourAgentCreationForm()
                return render(request, 'create_tour_agent.html', {'form': form, 'error': _('Пользователь с таким email уже существует')})
        
        # Проверка уникальности номера телефона
        if phone_number and CustomUser.objects.filter(phone_number=phone_number).exists():
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': _('Пользователь с таким номером телефона уже существует')})
            else:
                form = TourAgentCreationForm()
                return render(request, 'create_tour_agent.html', {'form': form, 'error': _('Пользователь с таким номером телефона уже существует')})
        
        try:
            # Создаем пользователя
            user = CustomUser.objects.create_user(
                username=username,
                email=email,
                password=password,
                phone_number=phone_number,
                role='tour_agent'
            )
            
            if is_ajax:
                return JsonResponse({'status': 'success', 'message': _('Турагент успешно создан')})
            else:
                return redirect('tour_agent_list')
                
        except Exception as e:
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': _(f'Ошибка при создании турагента: {str(e)}')})
            else:
                form = TourAgentCreationForm()
                return render(request, 'create_tour_agent.html', {'form': form, 'error': _(f'Ошибка при создании турагента: {str(e)}')})
    else:
        form = TourAgentCreationForm()
        return render(request, 'create_tour_agent.html', {'form': form})


@tour_agent_required
def tour_agent_excursions(request):
    # Ensure the user is a tour agent
    if not request.user.role == 'tour_agent':
        return HttpResponseForbidden("Доступ запрещён: только для турагентов.")

    # Fetch excursions created by the logged-in tour agent
    created_excursions = Excursion.objects.filter(creator=request.user)
    grouped_excursions = {}
    for excursion in created_excursions:
        if excursion.images.first():
            first_image = excursion.images.first()
            image_base64 = base64.b64encode(first_image.image).decode('utf-8')
            excursion.image_url = f"data:image/jpeg;base64,{image_base64}"
        else:
            excursion.image_url = "" # Or a placeholder image URL
        if excursion.location not in grouped_excursions:
            grouped_excursions[excursion.location] = []
        grouped_excursions[excursion.location].append(excursion)
    return render(request, 'tour_agent_excursions.html', {'excursions': created_excursions,'grouped_excursions': grouped_excursions})


@login_required(login_url='home')
def tour_agent_list(request):
    if not request.user.role == 'admin':
        return HttpResponseForbidden("Доступ запрещён: только для администратора.")

    # Fetch excursions created by the logged-in tour agent
    tour_agents = CustomUser.objects.filter(role='tour_agent')
    return render(request, 'tour_agent_list.html', {'tour_agents': tour_agents})

@login_required(login_url='home')
def update_tour_agent(request, pk):
    if not request.user.role == 'admin':
        return HttpResponseForbidden("Доступ запрещён: только для администратора.")

    agent = get_object_or_404(CustomUser, pk=pk)

    if request.method == 'POST':
        # Получаем данные из запроса
        username = request.POST.get('username')
        email = request.POST.get('email')
        phone_number = request.POST.get('phone_number')
        new_password = request.POST.get('new_password')
        
        # Проверяем, является ли запрос AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        if is_ajax:
            # Обновляем данные пользователя
            agent.username = username
            agent.email = email
            agent.phone_number = phone_number
            
            # Если введён новый пароль — обновляем
            if new_password:
                agent.set_password(new_password)
            
            try:
                agent.save()
                return JsonResponse({'status': 'success', 'message': _('Данные турагента успешно обновлены')})
            except Exception as e:
                return JsonResponse({'status': 'error', 'message': _(f'Ошибка при обновлении: {str(e)}')})
        else:
            # Обрабатываем обычную форму (для обратной совместимости)
            form = TourAgentUpdateForm(request.POST, instance=agent)
            if form.is_valid():
                user = form.save(commit=False)
                
                # Если введён новый пароль — обновляем
                if new_password:
                    user.set_password(new_password)
                
                user.save()
                return redirect('tour_agent_list')
    else:
        form = TourAgentUpdateForm(instance=agent)

    return render(request, {'form': form, 'agent': agent})

#tour_agent








#payment

@login_required(login_url='home')
@require_POST
def delete_card(request, card_id):
    card = get_object_or_404(Card, id=card_id, user=request.user)
    try:
        card.delete()
        return JsonResponse({'status': 'success', 'message': _('Карта успешно удалена')})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': _('Произошла ошибка при удалении карты: ') + str(e)})


@login_required(login_url='home')
def payment_page(request, excursion_id):
    excursion = get_object_or_404(Excursion, id=excursion_id)
    selected_date = request.GET.get('date')
    ticket_count = int(request.GET.get('tickets', 1))
    total_price = excursion.price * ticket_count

    # Передаём сохранённые карты пользователя
    saved_cards = request.user.cards.all()

    return render(request, 'payment.html', {
        'excursion': excursion,
        'selected_date': selected_date,
        'ticket_count': ticket_count,
        'total_price': total_price,
        'saved_cards': saved_cards
    })


def validate_card_number(card_number):
    # Проверка на соответствие алгоритму Луна
    card_number = card_number.replace(" ", "")  # Удаление пробелов
    if not re.fullmatch(r'\d{13,19}', card_number):
        return {'status': 'error', 'message': _('Некорректный номер карты')}

    # Алгоритм Луна для проверки
    sum_digits = 0
    is_second = False
    for digit in reversed(card_number):
        d = int(digit)
        if is_second:
            d *= 2
            if d > 9:
                d -= 9
        sum_digits += d
        is_second = not is_second
    return sum_digits % 10 == 0


def validate_expiry_date(expiry_date):
    # Проверка формата MM/YY
    if not re.fullmatch(r'\d{2}/\d{2}', expiry_date):
        return {'status': 'error', 'message': _('Срок действия карты истёк или некорректен')}

    # Сравнение с текущей датой
    month, year = map(int, expiry_date.split("/"))
    current_date = datetime.now()
    current_year = current_date.year % 100
    current_month = current_date.month

    if year < current_year or (year == current_year and month < current_month):
        return {'status': 'error', 'message': _('Срок действия карты истёк или некорректен')}
    return 1 <= month <= 12


def validate_cvc(cvc):
    # Проверка длины CVC (обычно 3-4 цифры)
    if not re.fullmatch(r'\d{3,4}', cvc):
        return {'status': 'error', 'message': _('Некорректный CVC')}
    return True


def validate_payment_data(card_number, expiry_date, cvc, cardholder_name):
    # Изменил эти вызовы, чтобы они не возвращали JsonResponse напрямую, а возвращали словарь
    # В JS-функции showToast будет вызываться с этими сообщениями
    if not validate_card_number(card_number):
        return {'status': 'error', 'message': _('Некорректный номер карты')}

    if not validate_expiry_date(expiry_date):
        return {'status': 'error', 'message': _('Срок действия карты истёк или некорректен')}

    if not validate_cvc(cvc):
        return {'status': 'error', 'message': _('Некорректный CVC')}

    if not cardholder_name or len(cardholder_name.strip()) < 2:
        return {'status': 'error', 'message': _('Имя держателя карты некорректно')}

    return {'status': 'success'}

@login_required(login_url='home')
@require_POST
def check_card(request):
    data = json.loads(request.body)
    last4 = data.get('last4')
    expiry_date = data.get('expiry_date')
    cardholder_name = data.get('cardholder_name')

    print("Проверка карты с параметрами:", last4, expiry_date, cardholder_name)

    # Проверяем существование карты
    card_exists = any(
        card.decrypt_four_card_number() == last4 and
        card.expiry_date == expiry_date and
        card.cardholder_name == cardholder_name
        for card in request.user.cards.all()
    )

    print("Результат проверки карты:", card_exists)
    return JsonResponse({'exists': card_exists})


@login_required(login_url='home')
def process_payment(request):
    print("Запрос process_payment начат.")  # Отладочный вывод

    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': _('Некорректный метод запроса')}, status=400)

    # Получаем данные из запроса
    excursion_id = request.POST.get('excursion_id')
    selected_date = request.POST.get('selected_date')
    ticket_count = request.POST.get('ticket_count')
    saved_card_id = request.POST.get('saved_card')  # ID сохранённой карты
    card_number = request.POST.get('card_number')
    expiry_date = request.POST.get('expiry_date')
    cvc = request.POST.get('cvc')
    cardholder_name = request.POST.get('cardholder_name')
    save_card = request.POST.get('save_card', 'false') == 'true'

    # Приводим ticket_count к числу и выполняем проверки
    try:
        ticket_count = int(ticket_count)
        if ticket_count <= 0:
            raise ValueError("Количество билетов должно быть больше нуля.")
    except ValueError as e:
        return JsonResponse({'status': 'error', 'message': _('Количество билетов некорректно')}, status=400)

    # Получаем экскурсию
    try:
        excursion = get_object_or_404(Excursion, id=excursion_id)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': _('Экскурсия не найдена')}, status=400)

    # Проверяем доступность выбранной даты
    if not selected_date or selected_date not in excursion.get_dates_list():
        return JsonResponse({'status': 'error', 'message': _('Выбранная дата недоступна для этой экскурсии')}, status=400)

    # Проверяем стоимость
    expected_total_price = excursion.price * ticket_count
    provided_total_price_str = request.POST.get('total_price', '0')
    provided_total_price = float(provided_total_price_str.replace(',', '.'))

    if provided_total_price != expected_total_price:
        return JsonResponse({
            'status': 'error',
            'message': _('Некорректная стоимость билетов. Попробуйте ещё раз.')
        }, status=400)

    # Проверяем карту (сохранённую или новую)
    if saved_card_id:
        try:
            saved_card = get_object_or_404(Card, id=saved_card_id, user=request.user)
            card_number = saved_card.decrypt_card_number()
            expiry_date = saved_card.expiry_date
            cardholder_name = saved_card.cardholder_name
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': _('Не удалось получить сохранённую карту')}, status=400)
    else:
        validation_result = validate_payment_data(card_number, expiry_date, cvc, cardholder_name)
        if validation_result['status'] == 'error':
            return JsonResponse(validation_result, status=400)

    try:
        # Проверяем, существует ли уже бронирование на эту дату
        existing_booking = BookedExcursion.objects.filter(
            user=request.user,
            excursion=excursion,
            booking_date=selected_date,
            is_paid=True
        ).exists()
        
        if existing_booking:
            return JsonResponse({
                'status': 'error', 
                'message': _('Вы уже забронировали эту экскурсию на указанную дату.')
            }, status=400)
            
        # Обработка сохранения карты
        if save_card and not saved_card_id:
            try:
                cipher = Fernet(settings.FERNET_KEY)
                encrypted_card_number = cipher.encrypt(card_number.encode())
                last4_new_card = card_number[-4:]  # Последние 4 цифры карты

                # Проверяем, существует ли карта
                card_exists = any(
                    card.decrypt_four_card_number() == last4_new_card and
                    card.expiry_date == expiry_date and
                    card.cardholder_name == cardholder_name
                    for card in request.user.cards.all()
                )

                if not card_exists:
                    Card.objects.create(
                        user=request.user,
                        encrypted_card_number=encrypted_card_number,
                        expiry_date=expiry_date,
                        cardholder_name=cardholder_name
                    )
            except Exception as e:
                print("Ошибка при сохранении карты:", str(e))

        # Создание бронирования
        BookedExcursion.objects.create(
            user=request.user,
            excursion=excursion,
            booking_date=selected_date,
            ticket_count=ticket_count,
            total_price=expected_total_price,
            is_paid=True  # Указываем, что оплата завершена
        )

        # Отправка уведомления пользователю
        subject = "Оплата экскурсии подтверждена"
        message = f"""
            Здравствуйте, {request.user.first_name}!

            Ваша оплата экскурсии "{excursion.title}" прошла успешно.
            Дата экскурсии: {selected_date}
            Количество билетов: {ticket_count}
            Итоговая стоимость: {expected_total_price} KZT

            Спасибо за вашу покупку! Ждем вас на экскурсии!
            """
        send_mail(subject, message, settings.EMAIL_HOST_USER, [request.user.email])

        return JsonResponse({'status': 'success', 'message': _('Оплата прошла успешно. Бронирование выполнено.')})
    
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': _('Произошла ошибка на сервере')}, status=500)
#payment

@require_POST
def send_feedback(request):
    try:
        email = request.POST.get('email')
        message = request.POST.get('message')
        
        if not email or not message:
            return JsonResponse({
                'status': 'error',
                'message': _('Необходимо заполнить все поля')
            }, status=400)

        # Отправка email
        send_mail(
            subject=f'Новое сообщение обратной связи {request.user.get_role_display()}',
            message=f'От: {email}\n\nСообщение:\n{message}',
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[settings.EMAIL_HOST_USER],
            fail_silently=False,
        )

        return JsonResponse({
            'status': 'success',
            'message': _('Сообщение успешно отправлено')
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

# API для автокомплита и поиска
def search_locations_excursions(request):
    query = request.GET.get('query', '').strip()
    current_language = request.LANGUAGE_CODE if hasattr(request, 'LANGUAGE_CODE') else 'ru'
    
    if not query or len(query) < 2:
        return JsonResponse({'results': []})
    
    # Поиск по локациям
    locations = Excursion.objects.filter(
        location__icontains=query
    ).values('location').distinct()
    
    location_results = [{
        'id': f"location_{idx}",
        'title': location['location'],
        'type': 'location',
        'url': f"/excursions/?location={location['location']}"
    } for idx, location in enumerate(locations)]
    
    # Поиск по названиям экскурсий
    excursions = Excursion.objects.filter(
        title__icontains=query
    ).values('id', 'title', 'location')
    
    excursion_results = [{
        'id': f"excursion_{excursion['id']}",
        'title': excursion['title'],
        'location': excursion['location'],
        'type': 'excursion',
        'url': f"/excursion/{excursion['id']}/"
    } for excursion in excursions]
    
    # Если язык не русский, добавляем результаты поиска по переведенным названиям и локациям
    if current_language != 'ru':
        # Поиск по переведенным локациям
        for excursion in Excursion.objects.all():
            translated_location = excursion.get_translated_location(current_language)
            if query.lower() in translated_location.lower():
                location_results.append({
                    'id': f"location_translated_{excursion.id}",
                    'title': translated_location,
                    'type': 'location',
                    'url': f"/excursions/?location={excursion.location}"
                })
        
        # Поиск по переведенным названиям
        for excursion in Excursion.objects.all():
            translated_title = excursion.get_translated_title(current_language)
            if query.lower() in translated_title.lower():
                excursion_results.append({
                    'id': f"excursion_translated_{excursion.id}",
                    'title': translated_title,
                    'location': excursion.get_translated_location(current_language),
                    'type': 'excursion',
                    'url': f"/excursion/{excursion.id}/"
                })
    
    # Удаляем дубликаты из результатов
    seen_locations = set()
    unique_location_results = []
    for result in location_results:
        if result['title'] not in seen_locations:
            seen_locations.add(result['title'])
            unique_location_results.append(result)
    
    seen_excursions = set()
    unique_excursion_results = []
    for result in excursion_results:
        if result['id'] not in seen_excursions:
            seen_excursions.add(result['id'])
            unique_excursion_results.append(result)
    
    # Объединяем результаты, сначала локации, потом экскурсии
    results = unique_location_results + unique_excursion_results
    
    return JsonResponse({'results': results})

@login_required(login_url='home')
@require_POST
def delete_review(request, review_id):
    try:
        review = get_object_or_404(SimpleReview, id=review_id)
        if review.author_id != request.user.id:
            return JsonResponse({'status': 'error', 'message': _('Нет прав на удаление этого отзыва.')}, status=403)
        review.delete()
        return JsonResponse({'status': 'success', 'message': _('Отзыв успешно удалён')})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@login_required(login_url='home')
@require_POST
def edit_review(request, review_id):
    review = get_object_or_404(SimpleReview, id=review_id)
    if review.author_id != request.user.id:
        return JsonResponse({'status': 'error', 'message': _('Нет прав на редактирование этого отзыва.')}, status=403)
    data = json.loads(request.body)
    text = data.get('text', '').strip()
    rating = int(data.get('rating', 5))
    if not (1 <= rating <= 5):
        rating = 5
    if not text:
        return JsonResponse({'status': 'error', 'message': _('Текст отзыва не может быть пустым.')}, status=400)
    review.text = text
    review.rating = rating
    review.save()
    return JsonResponse({'status': 'success', 'message': _('Отзыв обновлён.')})