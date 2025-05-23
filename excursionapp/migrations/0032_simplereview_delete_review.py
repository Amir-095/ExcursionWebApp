# Generated by Django 5.2.1 on 2025-05-20 18:51

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('excursionapp', '0031_review'),
    ]

    operations = [
        migrations.CreateModel(
            name='SimpleReview',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('author', models.CharField(max_length=100)),
                ('text', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('excursion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='simple_reviews', to='excursionapp.excursion')),
            ],
        ),
        migrations.DeleteModel(
            name='Review',
        ),
    ]
