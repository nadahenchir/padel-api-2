from functools import wraps
from flask import request, jsonify
import jwt
import os
from dotenv import load_dotenv
from models.user import UserModel

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")

def get_jwt_identity():
    """Extract user from JWT token"""
    token = request.headers.get("Authorization")
    
    if not token:
        return None
    
    try:
        # Remove "Bearer " prefix
        token = token.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user = UserModel.query.get(payload.get("user_id"))
        return user
    except:
        return None

def admin_required(fn):
    """Decorator to require admin role"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = get_jwt_identity()
        
        if not user:
            return {"error": "Unauthorized - Please login"}, 401
        
        if not user.is_admin():
            return {"error": "Forbidden - Admin privileges required"}, 403
        
        return fn(*args, **kwargs)
    
    return wrapper

def token_required(fn):
    """Decorator to require valid token"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = get_jwt_identity()
        
        if not user:
            return {"error": "Unauthorized - Please login"}, 401
        
        return fn(*args, **kwargs)
    
    return wrapper