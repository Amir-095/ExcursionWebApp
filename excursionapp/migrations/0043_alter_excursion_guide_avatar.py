# Generated by Django 5.2.1 on 2025-06-05 19:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('excursionapp', '0042_remove_excursion_image_remove_excursion_image_name_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='excursion',
            name='guide_avatar',
            field=models.BinaryField(blank=True, editable=True, null=True, verbose_name='Аватар гида'),
        ),
    ]
