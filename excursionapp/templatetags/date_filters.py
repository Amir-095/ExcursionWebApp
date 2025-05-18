from django import template
from django.utils import translation

register = template.Library()

MONTHS_RU = [
    '', 'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
]
MONTHS_KK = [
    '', 'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
    'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'
]
MONTHS_EN = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

@register.filter
def localized_date(value):
    """
    value — это объект date или datetime
    """
    if not value:
        return ''
    lang = translation.get_language()
    day = value.day
    year = value.year
    month_num = value.month

    if lang == 'kk':
        month = MONTHS_KK[month_num]
    elif lang == 'en':
        month = MONTHS_EN[month_num]
    else:
        month = MONTHS_RU[month_num]

    return f"{day} {month} {year}" 