# Generated manually to remove redundant has_variants field

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0005_remove_productspecoption_spec_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='product',
            name='has_variants',
        ),
    ]

