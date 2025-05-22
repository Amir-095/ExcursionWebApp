from django.forms import ModelForm, inlineformset_factory
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django import forms
from .models import *

class CreateUserForm(UserCreationForm):
    phone_number = forms.CharField(max_length=15, required=False, label="Номер телефона")

    class Meta:
        model = CustomUser
        fields = ['first_name','last_name', 'email', 'phone_number', 'password1', 'password2']
    
class ExcursionAdminForm(forms.ModelForm):
    selected_dates = forms.CharField(
        label="Выберите даты",  # Этот label будет скрыт
        required=False,
        widget=forms.HiddenInput()  # Скрываем поле
    )
    existing_dates = forms.MultipleChoiceField(
        label="Удалить существующие даты",
        required=False,
        widget=forms.CheckboxSelectMultiple,
    )
    guide_avatar = forms.ImageField(required=False)
    languages = forms.MultipleChoiceField(
        choices=Excursion.LANGUAGE_CHOICES,
        widget=forms.CheckboxSelectMultiple,
        required=True,
        label='Языки проведения'
    )

    class Meta:
        model = Excursion
        fields = [
            'title', 'price', 'location', 'meeting_address', 'end_location', 'group_type',
            'duration', 'languages','start_time', 'end_time', 'description',
            'guide_name', 'program', 'guide_services', 'transfer_service','group_first_aid', 'included_lunch',
            'food_included', 'existing_dates', 'number_of_days'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Устанавливаем доступные даты как варианты для MultipleChoiceField
        if self.instance and self.instance.dates:
            self.fields['existing_dates'].choices = [(date, date) for date in self.instance.dates]
        # Для редактирования: выставляем выбранные языки
        if self.instance and self.instance.pk:
            self.initial['languages'] = self.instance.languages

    def save(self, commit=True):
        instance = super().save(commit=False)
        new_dates = self.cleaned_data.get('selected_dates')
        dates_to_remove = self.cleaned_data.get('existing_dates')
        uploaded_avatar = self.cleaned_data.get('guide_avatar')
        if uploaded_avatar:
            instance.guide_avatar = uploaded_avatar.read()
        # Обработка новых дат
        if new_dates:
            for date in new_dates.split(','):  # Разделяем строки по запятым
                instance.add_date(date.strip())
        # Удаление существующих дат
        if dates_to_remove:
            for date in dates_to_remove:
                instance.remove_date(date)
        # Сохраняем выбранные языки
        instance.languages = self.cleaned_data.get('languages', [])
        if commit:
            instance.save()
        return instance


class TourAgentCreationForm(UserCreationForm):
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'phone_number', 'password1', 'password2']

class TourAgentUpdateForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'phone_number']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Чтобы не было проверки на уникальность текущего username/email, если он не меняется
        self.fields['username'].widget.attrs['readonly'] = True  # или убери, если хочешь редактируемым

class ProfileAvatarForm(forms.ModelForm):
    avatar = forms.ImageField(required=False, label='Аватар')

    class Meta:
        model = CustomUser
        fields = ['avatar']


