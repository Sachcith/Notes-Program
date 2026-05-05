from flask import Flask, render_template, redirect, url_for, jsonify, request
from flask_socketio import SocketIO, emit

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base


from db import SessionLocal
import Initialize_database as models

from flask_jwt_extended import JWTManager, create_access_token, decode_token
from flask_bcrypt import Bcrypt

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "this-is-a-much-longer-dev-secret-key-123456"
jwt = JWTManager(app)
bcrypt = Bcrypt(app)
socketio = SocketIO(app)

@app.route("/login")
def login_page():
    return render_template("login.html")

@app.route('/')
def root():
    return redirect("/login")

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json

    username = data["username"]
    password = data["password"]

    db = SessionLocal()

    try:
        user = db.query(models.Users).filter_by(username=username).first()

        if not user:
            return jsonify({"msg": "Invalid"}), 401

        if not bcrypt.check_password_hash(user.password_hash, password):
            return jsonify({"msg": "Invalid"}), 401

        token = create_access_token(identity=user.username,expires_delta=timedelta(hours=5))

        return jsonify({
            "token": token,
            "role": user.role.value
        })

    finally:
        db.close()

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json

    username = data["username"]
    password = data["password"]

    db = SessionLocal()

    try:
        hashed = bcrypt.generate_password_hash(password).decode("utf-8")

        user = models.Users(
            username=username,
            password_hash=hashed,
            role=models.UserRole.user
        )

        db.add(user)
        db.commit()

        return jsonify({"msg": "created"})

    except:
        db.rollback()
        return jsonify({"msg": "exists"}), 400

    finally:
        db.close()

@app.route('/dashboard')
def dashboard():
    return render_template("index.html")

@socketio.on("getEntity")
def getEntity(data=None):
    if not data:
        emit("error", {"msg": "no data received"})
        return
    token = data.get("token")

    if not token:
        emit("error", {"msg": "no token"})
        return
    token = str(token)
    try:
        decoded = decode_token(token)
        username = decoded["sub"]
    except Exception as e:
        print("Error",e)
        emit("error", {"msg": "invalid token"})
        return
    db = SessionLocal()
    try:
        entityClass = db.query(models.Entities).all()
        entityData = []
        for entity in entityClass:
            entityData.append({
                "id": entity.id,
                "name": entity.name,
                "type": entity.type.name,
                "phone": entity.phone,
                "location": entity.location,
                "balance": entity.balance,
                "created_at": str(entity.created_at),
                "updated_at": str(entity.updated_at),
                "created_by": entity.created_by,
            })
        emit("entityData",entityData)

    except Exception as e:
        print("Error: ",e)
        emit("error",{"message":"All Entity Error!!"})
    finally:
        db.close()

@socketio.on("saveEntity")
def saveEntity(data=None):
    token = data.get("token")

    if not token:
        emit("error", {"msg": "no token"})
        return
    db = SessionLocal()
    try:
        decoded = decode_token(token)
        current_user = decoded["sub"]
        user = db.query(models.Users).filter_by(username=current_user).first()
        current_user_id = user.id
    except Exception as e:
        print("Error",e)
        emit("error", {"msg": "invalid token"})
        return
    try:
        newEntity = models.Entities(
            name = data.get("name"),
            phone = data.get("phone"),
            location = data.get("location"),
            balance = data.get("balance"),
            type = models.EntityType[data.get("type").upper()],
            created_at=datetime.now(ZoneInfo("Asia/Kolkata")),
            updated_at=datetime.now(ZoneInfo("Asia/Kolkata")),
            created_by=current_user_id
        )
        db.add(newEntity)
        db.commit()
        db.refresh(newEntity)
        socketio.emit("saveEntityOk",{})
    except Exception as e:
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Save Entity!!"})
    finally:
        db.close()

@socketio.on("saveEntityEdit")
def saveEntityEdit(data=None):
    token = data.get("token")

    if not token:
        emit("error", {"msg": "no token"})
        return
    db = SessionLocal()
    try:
        decoded = decode_token(token)
        current_user = decoded["sub"]
        user = db.query(models.Users).filter_by(username=current_user).first()
        current_user_id = user.id
    except Exception as e:
        print("Error",e)
        emit("error", {"msg": "invalid token"})
        return
    try:
        entity = db.query(models.Entities).filter(models.Entities.id == data.get("id")).first()
        if entity:
            entity.name = data.get("name")
            entity.phone = data.get("phone")
            entity.location = data.get("location")
            entity.balance = data.get("balance")
            entity.type = models.EntityType[data.get("type").upper()]
            entity.updated_at = datetime.now(ZoneInfo("Asia/Kolkata"))

        db.commit()
        socketio.emit("editEntityOk",{})
    except Exception as e:
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Save Entity!!"})
    finally:
        db.close()

@socketio.on("deleteEntity")
def deleteEntity(data):
    token = data.get("token")

    if not token:
        emit("error", {"msg": "no token"})
        return
    db = SessionLocal()
    try:
        decoded = decode_token(token)
        current_user = decoded["sub"]
        user = db.query(models.Users).filter_by(username=current_user).first()
        current_user_id = user.id
    except Exception as e:
        print("Error",e)
        emit("error", {"msg": "invalid token"})
        return
    try:
        entity = db.query(models.Entities).filter(models.Entities.id == data.get("id")).first()
        if entity:
            db.delete(entity)
            db.commit()
        socketio.emit("deleteEntityOk",{})
    except Exception as e:
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Save Entity!!"})
    finally:
        db.close()

@socketio.on("getItem")
def getItem(data):
    token = data.get("token")

    if not token:
        emit("error", {"msg": "no token"})
        return
    db = SessionLocal()
    try:
        decoded = decode_token(token)
        current_user = decoded["sub"]
        user = db.query(models.Users).filter_by(username=current_user).first()
        current_user_id = user.id
    except Exception as e:
        print("Error",e)
        emit("error", {"msg": "invalid token"})
        return
    try:
        itemClass = db.query(models.Item).all()
        itemData = []
        for item in itemClass:
            itemData.append({
                "id": item.id,
                "name": item.name,
                "touch": item.touch,
                "created_at": str(item.created_at),
                "created_by": item.created_by,
            })
        emit("itemData",itemData)

    except Exception as e:
        print("Error: ",e)
        emit("error",{"message":"All Item Error!!"})
    finally:
        db.close()
    
@socketio.on("saveItem")
def saveItem(data=None):
    token = data.get("token")

    if not token:
        emit("error", {"msg": "no token"})
        return
    db = SessionLocal()
    try:
        decoded = decode_token(token)
        current_user = decoded["sub"]
        user = db.query(models.Users).filter_by(username=current_user).first()
        current_user_id = user.id
    except Exception as e:
        print("Error",e)
        emit("error", {"msg": "invalid token"})
        return
    try:
        newItem = models.Item(
            name = data.get("name"),
            touch = data.get("touch"),
            created_at=datetime.now(ZoneInfo("Asia/Kolkata")),
            created_by=current_user_id
        )
        db.add(newItem)
        db.commit()
        db.refresh(newItem)
        socketio.emit("saveItemOk",{})
    except Exception as e:
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Save Item!!"})
    finally:
        db.close()

@socketio.on("saveItemEdit")
def saveItemEdit(data=None):
    token = data.get("token")

    if not token:
        emit("error", {"msg": "no token"})
        return
    db = SessionLocal()
    try:
        decoded = decode_token(token)
        current_user = decoded["sub"]
        user = db.query(models.Users).filter_by(username=current_user).first()
        current_user_id = user.id
    except Exception as e:
        print("Error",e)
        emit("error", {"msg": "invalid token"})
        return
    try:
        item = db.query(models.Item).filter(models.Item.id == data.get("id")).first()
        if item:
            item.name = data.get("name")
            item.touch = data.get("touch")

        db.commit()
        socketio.emit("editItemOk",{})
    except Exception as e:
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Save Item!!"})
    finally:
        db.close()

@socketio.on("deleteItem")
def deleteItem(data):
    token = data.get("token")

    if not token:
        emit("error", {"msg": "no token"})
        return
    db = SessionLocal()
    try:
        decoded = decode_token(token)
        current_user = decoded["sub"]
        user = db.query(models.Users).filter_by(username=current_user).first()
        current_user_id = user.id
    except Exception as e:
        print("Error",e)
        emit("error", {"msg": "invalid token"})
        return
    try:
        item = db.query(models.Item).filter(models.Item.id == data.get("id")).first()
        if item:
            db.delete(item)
            db.commit()
        socketio.emit("deleteItemOk",{})
    except Exception as e:
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Save Item!!"})
    finally:
        db.close()

if __name__=="__main__":
    socketio.run(app,debug=True,port=5000)