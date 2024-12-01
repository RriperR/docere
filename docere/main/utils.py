menu = [
    {'title': 'Загрузить данные', 'url_name': 'upload'},
    {'title' : 'Добавить пациента', 'url_name' : 'add_patient'},
    {'title' : 'Добавить информацию', 'url_name' : 'add_info'},
    {'title' : 'О сайте', 'url_name' : 'about'},
    {'title' : 'Обратная связь', 'url_name' : 'contact'},
]

class DataMixin():
    title_page = None
    extra_context = {}

    def __init__(self):
        if self.title_page:
            self.extra_context['title'] = self.title_page

    def get_mixin_context(self, context, **kwargs):
        context.update(kwargs)
        return context