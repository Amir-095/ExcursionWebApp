# Generated by Django 5.1.6 on 2025-03-24 12:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('excursionapp', '0014_bookedexcursion_is_paid'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='role',
            field=models.CharField(choices=[('admin', 'Администратор'), ('tour_agent', 'Турагент'), ('user', 'Пользователь')], default='user', max_length=20),
        ),
    ]
