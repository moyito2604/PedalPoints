from cryptography.fernet import Fernet
from cryptography.fernet import InvalidToken
import os

def generate_key():
    if os.path.exists("db.key"):
        with open("db.key", 'r') as file:
            key = file.read()
    else:
        key = Fernet.generate_key().decode()
        with open("db.key", 'w') as file:
            file.write(key)
    return key

def encrypt(message: str):
    key = generate_key().encode()
    fernet = Fernet(key)
    token = fernet.encrypt(message.encode())
    return token.decode()

def decrypt(token: str):
    key = generate_key().encode()
    fernet = Fernet(key)
    try:
        message = fernet.decrypt(token)
    except InvalidToken:
        message = "N/A".encode()
    return message.decode()

if __name__ == "__main__":
    msg = "Testing Message Encryption"
    print(generate_key())
    encrypted = encrypt(msg)
    print(encrypted)
    print(decrypt(encrypted))