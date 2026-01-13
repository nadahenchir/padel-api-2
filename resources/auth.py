from flask.views import MethodView
from flask_smorest import Blueprint
from flask import request
from marshmallow import Schema, fields
from db import db
from models.user import UserModel
import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

blp = Blueprint("Auth", "auth", description="User authentication")

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")
ADMIN_KEY = os.getenv("ADMIN_KEY", "admin-secret-key")

# Schemas
class RegisterSchema(Schema):
    email = fields.String(required=True, metadata={"description": "User email address"})
    password = fields.String(required=True, metadata={"description": "User password"})

class RegisterAdminSchema(Schema):
    email = fields.String(required=True, metadata={"description": "Admin email address"})
    password = fields.String(required=True, metadata={"description": "Admin password"})
    admin_key = fields.String(required=True, metadata={"description": "Secret admin key"})

class LoginSchema(Schema):
    email = fields.String(required=True, metadata={"description": "User email address"})
    password = fields.String(required=True, metadata={"description": "User password"})

@blp.route("/auth/register")
class Register(MethodView):
    @blp.arguments(RegisterSchema)
    def post(self, data):
        """Register a new regular user"""
        
        # Check if user already exists
        existing = UserModel.query.filter_by(email=data["email"]).first()
        if existing:
            return {"error": "Email already registered"}, 400
        
        # Create user with "user" role
        user = UserModel(email=data["email"], role="user")
        user.set_password(data["password"])
        db.session.add(user)
        db.session.commit()
        
        return {
            "message": "User registered successfully",
            "user": user.to_dict()
        }, 201

@blp.route("/auth/register-admin")
class RegisterAdmin(MethodView):
    @blp.arguments(RegisterAdminSchema)
    def post(self, data):
        """Register a new admin user (requires admin key)"""
        
        # Verify admin key
        if data["admin_key"] != ADMIN_KEY:
            return {"error": "Invalid admin key"}, 403
        
        # Check if user already exists
        existing = UserModel.query.filter_by(email=data["email"]).first()
        if existing:
            return {"error": "Email already registered"}, 400
        
        # Create admin user
        user = UserModel(email=data["email"], role="admin")
        user.set_password(data["password"])
        db.session.add(user)
        db.session.commit()
        
        return {
            "message": "Admin user registered successfully",
            "user": user.to_dict()
        }, 201

@blp.route("/auth/login")
class Login(MethodView):
    @blp.arguments(LoginSchema)
    def post(self, data):
        """Login and get JWT token"""
        
        # Find user
        user = UserModel.query.filter_by(email=data["email"]).first()
        if not user or not user.check_password(data["password"]):
            return {"error": "Invalid email or password"}, 401
        
        # Generate JWT token
        token = jwt.encode({
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "exp": datetime.utcnow() + timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")
        
        return {
            "message": "Login successful",
            "token": token,
            "user": user.to_dict()
        }, 200