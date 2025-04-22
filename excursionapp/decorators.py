from django.http import HttpResponseForbidden

def tour_agent_required(view_func):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated or request.user.role != 'tour_agent':
            return HttpResponseForbidden("Доступ запрещён: только для турагентов.")
        return view_func(request, *args, **kwargs)
    return wrapper