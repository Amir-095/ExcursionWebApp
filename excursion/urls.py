"""
URL configuration for excursion project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from excursionapp import views
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns


urlpatterns = [
    path('i18n/', include('django.conf.urls.i18n')),
]

urlpatterns += i18n_patterns(
    path('admin/', admin.site.urls),
    path('', views.index,name='home'),
    path('register/', views.registerPage, name='register'),
    path('login/', views.loginPage, name='login'),
    path('logout', views.logoutUser, name='logout'),
    path('excursions/', views.all_excursions, name='all_excursions'),
    path('excursions', views.all_excursions),
    path('profile', views.profile_view, name='profile'),
    path('excursion/<int:excursion_id>/', views.excursion_detail, name='excursion_detail'),
    path('book-excursion/<int:excursion_id>/', views.book_excursion, name='book_excursion'),
    path('check-auth/', views.check_auth, name='check_auth'),
    path('create/', views.create_excursion, name='create_excursion'),
    path('update/<int:pk>/', views.update_excursion, name='update_excursion'),
    path('payment/<int:excursion_id>/', views.payment_page, name='payment_page'),
    path('process-payment/', views.process_payment, name='process_payment'),
    path('delete-card/<int:card_id>/', views.delete_card, name='delete_card'),
    path('create-tour-agent/', views.create_tour_agent, name='create_tour_agent'),
    path('check-card/', views.check_card, name='check_card'),
    path('my-excursions', views.tour_agent_excursions, name='my_excursions'),
    path('delete-excursion/<int:pk>/', views.delete_excursion, name='delete_excursion'),
    path('tour-agents/', views.tour_agent_list, name='tour_agent_list'),
    path('update-agent/<int:pk>/', views.update_tour_agent, name='update_agent'),
    path('send_feedback/', views.send_feedback, name='send_feedback'),
    path('search-api/', views.search_locations_excursions, name='search_api'),
    prefix_default_language=True
) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)