from django import template
from mimetypes import guess_type

register = template.Library()

@register.filter
def file_extension(value, ext_type):
    mime, _ = guess_type(value.url)
    if mime and mime.startswith(ext_type):
        return True
    return False
