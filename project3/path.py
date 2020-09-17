import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if not os.environ.get('SECRET_KEY'):
    try:
        with open(os.path.join(BASE_DIR, 'sk.txt')) as f:
            local_key = f.read().strip()
            print(local_key)
    except FileNotFoundError:
        print("No secret key found - please set one for this environment.")
else:
    SECRET_KEY = os.environ['SECRET_KEY']


