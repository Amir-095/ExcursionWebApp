# Generated by Django 5.1.6 on 2025-04-11 02:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('excursionapp', '0017_alter_excursion_creator'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='username',
            field=models.CharField(help_text='Имя пользователя', max_length=150),
        ),
    ]
