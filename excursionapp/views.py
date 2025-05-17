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
from datetime import datetime
from django.template.defaultfilters import register

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
                    return JsonResponse({'status': 'error', 'errors': {'email': 'Этот email уже зарегистрирован'}},
                                        status=400)

                if CustomUser.objects.filter(phone_number=phone_number).exists():
                    return JsonResponse({'status': 'error', 'errors': {'phone_number': 'Этот номер уже зарегистрирован'}},
                                        status=400)

                user = form.save(commit=False)
                first_name = form.cleaned_data.get('first_name', '').strip()
                last_name = form.cleaned_data.get('last_name', '').strip()
                user.username = f"{first_name} {last_name}".strip()
                if not user.username:
                    # Если имя и фамилия пустые, username будет пустым.
                    # Это может быть проблемой, если username обязателен.
                    # Возвращаем ошибку, чтобы пользователь указал имя или фамилию.
                    return JsonResponse({'status': 'error', 'errors': {
                        'first_name': 'Имя или фамилия должны быть заполнены.',
                        'last_name': 'Имя или фамилия должны быть заполнены.'
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
                    custom_error_messages["email"] = "Этот email уже зарегистрирован"
                elif field == "phone_number" and error_code == "unique":
                    custom_error_messages["phone_number"] = "Этот номер уже зарегистрирован"
                elif field == "password2" and error_code == "password_mismatch":
                    custom_error_messages["password2"] = "Пароли не совпадают"
                else:
                    custom_error_messages[field] = error_list[0]['message']

            return JsonResponse({'status': 'error', 'errors': custom_error_messages}, status=400)
        else:
            # Если это не AJAX запрос, возвращаем ошибку
            return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)

    # Для GET запросов возвращаем JSON с сообщением об ошибке
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    
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
                'username': 'Неверное имя пользователя или пароль',
                'password': 'Неверное имя пользователя или пароль'
            }
            return JsonResponse({'status': 'error', 'errors': errors}, status=400)

    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)

def logoutUser(request):
    logout(request)
    return redirect('home')


@login_required(login_url='home')
def profile_view(request):
    # Забронированные экскурсии
    booked_excursions = BookedExcursion.objects.filter(user=request.user).select_related('excursion')
    for booking in booked_excursions:
        if booking.excursion.image:
            image_base64 = base64.b64encode(booking.excursion.image).decode('utf-8')
            booking.excursion.image_url = f"data:image/jpeg;base64,{image_base64}"

    # Сохранённые карты пользователя
    saved_cards = request.user.cards.all()

    # Передача данных в контекст
    return render(request, "profile.html", {
        'user': request.user,
        'booked_excursions': booked_excursions,
        'saved_cards': saved_cards,  # Все карты пользователя
    })

def check_auth(request):
    return JsonResponse({'is_authenticated': request.user.is_authenticated})
#user



#pages
def index(request):
    excursions = Excursion.objects.all().order_by('?')[:4]  # Получаем 4 случайные экскурсии
    for excursion in excursions:
        if excursion.image:
            # Конвертируем бинарные данные в base64 для отображения в HTML
            image_base64 = base64.b64encode(excursion.image).decode('utf-8')
            excursion.image_url = f"data:image/jpeg;base64,{image_base64}"
    return render(request, "index.html", {'excursions': excursions})
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
        excursions = excursions.filter(language__in=language)
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

    # Группируем экскурсии по локациям
    grouped_excursions = {}
    for excursion in excursions:
        if excursion.image:
            image_base64 = base64.b64encode(excursion.image).decode('utf-8')
            excursion.image_url = f"data:image/jpeg;base64,{image_base64}"
        if excursion.location not in grouped_excursions:
            grouped_excursions[excursion.location] = []
        grouped_excursions[excursion.location].append(excursion)

    # Если после всех фильтров ничего не найдено
    if not grouped_excursions:
        print("Нет результатов после применения всех фильтров")
    
    return render(request, "excursions.html", {'grouped_excursions': grouped_excursions})


@tour_agent_required
def create_excursion(request):
    if request.method == 'POST':
        form = ExcursionAdminForm(request.POST, request.FILES)
        if form.is_valid():
            excursion = form.save(commit=False)
            excursion.creator = request.user  # Сохраняем текущего пользователя как создателя
            excursion.save()
            return redirect('all_excursions')  # Перенаправление на страницу всех экскурсий
    else:
        form = ExcursionAdminForm()
    return render(request, 'create_excursion.html', {'form': form})

@tour_agent_required
def update_excursion(request, pk):
    excursion = get_object_or_404(Excursion, pk=pk)

    # Проверяем, что текущий пользователь является создателем экскурсии
    if request.user != excursion.creator:
        return HttpResponseForbidden("Вы не можете редактировать эту экскурсию.")

    form = ExcursionAdminForm(request.POST or None, request.FILES or None, instance=excursion)
    if form.is_valid():
        form.save()
        return redirect('my_excursions')
    return render(request, 'update_excursion.html', {'form': form, 'excursion': excursion})

@login_required(login_url='home')
@require_POST
def delete_excursion(request, pk):
    excursion = get_object_or_404(Excursion, pk=pk)
    try:
        excursion.delete()
        return JsonResponse({'status': 'success', 'message': 'Экскурсия успешно удалена'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': 'Произошла ошибка при удалении экскурсии: ' + str(e)})

def excursion_detail(request, excursion_id):
    excursion = get_object_or_404(Excursion, id=excursion_id)
    image_base64 = base64.b64encode(excursion.image).decode('utf-8')
    excursion.image_url = f"data:image/jpeg;base64,{image_base64}"

    # Получение включённых и не включённых элементов
    included_items, not_included_items = excursion.get_inclusion_status()

    return render(request, 'excursion_detail.html',
{'excursion': excursion,
        'included_items': included_items,
        'not_included_items': not_included_items,
        'dates': excursion.get_dates_list(),
        'google_maps_api_key': settings.GOOGLE_MAPS_API_KEY,
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
        return JsonResponse({'status': 'error', 'message': 'Выбранная дата недоступна для этой экскурсии'})

    if ticket_count <= 0:
        return JsonResponse({'status': 'error', 'message': 'Количество билетов должно быть больше нуля'})

    # Проверяем, была ли оплата за эту экскурсию с указанной датой
    paid_booking = BookedExcursion.objects.filter(
        user=request.user,
        excursion=excursion,
        booking_date=selected_date,
        is_paid=True  # Учитываем только оплаченные бронирования
    ).first()

    if not paid_booking:
        return JsonResponse({'status': 'error', 'message': 'Оплата не была выполнена. Забронировать экскурсию невозможно.'})

    # Проверяем, чтобы одно бронирование для пользователя и даты не создавалось повторно
    if BookedExcursion.objects.filter(
        user=request.user, excursion=excursion, booking_date=selected_date, is_paid=True
    ).exists():
        return JsonResponse({'status': 'error', 'message': 'Вы уже забронировали эту экскурсию на указанную дату.'})

    # Если всё успешно, возвращаем подтверждение
    return JsonResponse({'status': 'success', 'message': 'Бронирование подтверждено.'})

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
                return JsonResponse({'status': 'error', 'message': 'Пароли не совпадают'})
            else:
                form = TourAgentCreationForm()
                return render(request, 'create_tour_agent.html', {'form': form, 'error': 'Пароли не совпадают'})
        
        # Проверка уникальности username
        if CustomUser.objects.filter(username=username).exists():
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': 'Пользователь с таким именем уже существует'})
            else:
                form = TourAgentCreationForm()
                return render(request, 'create_tour_agent.html', {'form': form, 'error': 'Пользователь с таким именем уже существует'})
        
        # Проверка уникальности email
        if CustomUser.objects.filter(email=email).exists():
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': 'Пользователь с таким email уже существует'})
            else:
                form = TourAgentCreationForm()
                return render(request, 'create_tour_agent.html', {'form': form, 'error': 'Пользователь с таким email уже существует'})
        
        # Проверка уникальности номера телефона
        if phone_number and CustomUser.objects.filter(phone_number=phone_number).exists():
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': 'Пользователь с таким номером телефона уже существует'})
            else:
                form = TourAgentCreationForm()
                return render(request, 'create_tour_agent.html', {'form': form, 'error': 'Пользователь с таким номером телефона уже существует'})
        
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
                return JsonResponse({'status': 'success', 'message': 'Турагент успешно создан'})
            else:
                return redirect('tour_agent_list')
                
        except Exception as e:
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': f'Ошибка при создании турагента: {str(e)}'})
            else:
                form = TourAgentCreationForm()
                return render(request, 'create_tour_agent.html', {'form': form, 'error': f'Ошибка при создании турагента: {str(e)}'})
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
        if excursion.image:
            # Конвертируем бинарные данные в base64 для отображения в HTML
            image_base64 = base64.b64encode(excursion.image).decode('utf-8')
            excursion.image_url = f"data:image/jpeg;base64,{image_base64}"
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
                return JsonResponse({'status': 'success', 'message': 'Данные турагента успешно обновлены'})
            except Exception as e:
                return JsonResponse({'status': 'error', 'message': f'Ошибка при обновлении: {str(e)}'})
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
        return JsonResponse({'status': 'success', 'message': 'Карта успешно удалена'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': 'Произошла ошибка при удалении карты: ' + str(e)})


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
        return False

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
        return False

    # Сравнение с текущей датой
    month, year = map(int, expiry_date.split("/"))
    current_date = datetime.now()
    current_year = current_date.year % 100
    current_month = current_date.month

    if year < current_year or (year == current_year and month < current_month):
        return False
    return 1 <= month <= 12


def validate_cvc(cvc):
    # Проверка длины CVC (обычно 3-4 цифры)
    return re.fullmatch(r'\d{3,4}', cvc) is not None


def validate_payment_data(card_number, expiry_date, cvc, cardholder_name):
    if not validate_card_number(card_number):
        return {'status': 'error', 'message': 'Некорректный номер карты'}

    if not validate_expiry_date(expiry_date):
        return {'status': 'error', 'message': 'Срок действия карты истёк или некорректен'}

    if not validate_cvc(cvc):
        return {'status': 'error', 'message': 'Некорректный CVC'}

    if not cardholder_name or len(cardholder_name.strip()) < 2:
        return {'status': 'error', 'message': 'Имя держателя карты некорректно'}

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
        return JsonResponse({'status': 'error', 'message': 'Некорректный метод запроса'}, status=400)

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
        return JsonResponse({'status': 'error', 'message': 'Количество билетов некорректно'}, status=400)

    # Получаем экскурсию
    try:
        excursion = get_object_or_404(Excursion, id=excursion_id)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': 'Экскурсия не найдена'}, status=400)

    # Проверяем доступность выбранной даты
    if not selected_date or selected_date not in excursion.get_dates_list():
        return JsonResponse({'status': 'error', 'message': 'Выбранная дата недоступна для этой экскурсии'}, status=400)

    # Проверяем стоимость
    expected_total_price = excursion.price * ticket_count
    provided_total_price_str = request.POST.get('total_price', '0')
    provided_total_price = float(provided_total_price_str.replace(',', '.'))

    if provided_total_price != expected_total_price:
        return JsonResponse({
            'status': 'error',
            'message': 'Некорректная стоимость билетов. Попробуйте ещё раз.'
        }, status=400)

    # Проверяем карту (сохранённую или новую)
    if saved_card_id:
        try:
            saved_card = get_object_or_404(Card, id=saved_card_id, user=request.user)
            card_number = saved_card.decrypt_card_number()
            expiry_date = saved_card.expiry_date
            cardholder_name = saved_card.cardholder_name
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': 'Не удалось получить сохранённую карту'}, status=400)
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
                'message': 'Вы уже забронировали эту экскурсию на указанную дату.'
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

        return JsonResponse({'status': 'success', 'message': 'Оплата прошла успешно. Бронирование выполнено.'})
    
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': 'Произошла ошибка на сервере'}, status=500)
#payment

@require_POST
def send_feedback(request):
    try:
        email = request.POST.get('email')
        message = request.POST.get('message')
        
        if not email or not message:
            return JsonResponse({
                'status': 'error',
                'message': 'Необходимо заполнить все поля'
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
            'message': 'Сообщение успешно отправлено'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

# API для автокомплита и поиска
def search_locations_excursions(request):
    query = request.GET.get('query', '').strip()
    
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
    
    # Объединяем результаты, сначала локации, потом экскурсии
    results = location_results + excursion_results
    
    return JsonResponse({'results': results})