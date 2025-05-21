from django.contrib import admin
from .models import Excursion,BookedExcursion,CustomUser,Card,SimpleReview
from .forms import ExcursionAdminForm

# Register your models here.
class ExcursionAdmin(admin.ModelAdmin):
    form = ExcursionAdminForm

    def save_model(self, request, obj, form, change):
        if form.cleaned_data.get('image_file'):
            image_file = form.cleaned_data['image_file']
            obj.image = image_file.read()
            obj.image_name = image_file.name
        super().save_model(request, obj, form, change)

admin.site.register(Excursion, ExcursionAdmin)
admin.site.register(BookedExcursion)
admin.site.register(CustomUser)
admin.site.register(Card)
admin.site.register(SimpleReview)