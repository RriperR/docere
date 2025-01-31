from .utils import menu

def get_main_context(request):
    return {'mainmenu': menu}