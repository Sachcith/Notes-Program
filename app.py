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

        token = create_access_token(identity=user.username,expires_delta=timedelta(hours=3))

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
        db.rollback()
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
                "opening_balance": entity.opening_balance,
                "balance": entity.balance,
                "created_at": str(entity.created_at),
                "updated_at": str(entity.updated_at),
                "created_by": entity.created_by,
            })
        emit("entityData",entityData)

    except Exception as e:
        db.rollback()
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
        time = datetime.now(ZoneInfo("Asia/Kolkata"))
        newEntity = models.Entities(
            name = data.get("name"),
            phone = data.get("phone"),
            location = data.get("location"),
            opening_balance = data.get("balance"),
            last_closing_date = time,
            balance = data.get("balance"),
            type = models.EntityType[data.get("type").upper()],
            created_at=time,
            updated_at=time,
            created_by=current_user_id
        )
        db.add(newEntity)
        db.commit()
        db.refresh(newEntity)
        socketio.emit("saveEntityOk",{})
    except Exception as e:
        db.rollback()
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
        db.rollback()
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
        db.rollback()
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Save Entity!!"})
    finally:
        db.close()

@socketio.on("searchEntity")
def search_entity(data):
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
        entityClass = db.query(models.Entities).filter(models.Entities.name.ilike(f"%{data.get("value")}%"),models.Entities.type == data.get("type").upper()).all()
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
        db.rollback()
        print("Error: ",e)
        emit("error",{"message":"Error in Search Entity!!"})
    finally:
        db.close()

@socketio.on("searchEntityName")
def search_entity_name(data):
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
        db.rollback()
        print("Error",e)
        emit("error", {"msg": "invalid token"})
        return
    db = SessionLocal()
    try:
        entityClass = db.query(models.Entities).filter(models.Entities.name.ilike(f"%{data.get("value")}%")).distinct().limit(10).all()
        entityData = []
        for entity in entityClass:
            entityData.append({
                "entityName":entity.name
            })
        emit("EntityNameResults",entityData)

    except Exception as e:
        db.rollback()
        print("Error: ",e)
        emit("error",{"message":"Error in Search Entity!!"})
    finally:
        db.close()

@socketio.on("searchEntityLocation")
def search_entity_location(data):
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
        db.rollback()
        print("Error",e)
        emit("error", {"msg": "invalid token"})
        return
    db = SessionLocal()
    try:
        entityClass = db.query(models.Entities).filter(models.Entities.location.ilike(f"%{data.get("value")}%")).distinct().limit(10).all()
        entityData = []
        for entity in entityClass:
            entityData.append({"entityLocation":entity.location})
        emit("EntityLocationResults",entityData)

    except Exception as e:
        db.rollback()
        print("Error: ",e)
        emit("error",{"message":"Error in Search Entity!!"})
    finally:
        db.close()

@socketio.on("searchTransactionEntityName")
def search_transaction_entity_name(data):
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
        db.rollback()
        print("Error",e)
        emit("error", {"msg": "invalid token"})
        return
    db = SessionLocal()
    try:
        entityClass = db.query(models.Entities).filter(models.Entities.name.ilike(f"%{data.get("value")}%")).distinct().limit(10).all()
        entityData = []
        for entity in entityClass:
            entityData.append({
                "transactionEntityName":entity.name,
                "old_balance": get_old_balance(entity.id,data.get("created_at",None)),
            })
        emit("TransactionEntityNameResults",entityData)

    except Exception as e:
        db.rollback()
        print("Error: ",e)
        emit("error",{"message":"Error in Search Entity!!"})
    finally:
        db.close()

@socketio.on("searchItemName")
def search_item_name(data):
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
        db.rollback()
        print("Error",e)
        emit("error", {"msg": "invalid token"})
        return
    db = SessionLocal()
    try:
        itemClass = db.query(models.Item).filter(models.Item.name.ilike(f"%{data.get("value")}%")).distinct().limit(10).all()
        entity = db.query(models.Entities).filter_by(name=data.get("entity_name")).first()
        itemData = []
        for item in itemClass:
            if item.name=="Cash Gold":
                continue
            if item.name=="Rtgs Gold":
                continue
            rule = None
            if entity!=None:
                rule = db.query(models.Rule).filter(
                    models.Rule.item_id == item.id,
                    models.Rule.entity_id == entity.id,
                ).first()
            if rule==None:
                itemData.append({
                    "itemName":item.name,
                    "itemTouch":item.touch,
                })
            else:
                itemData.append({
                    "itemName":item.name,
                    "itemTouch":item.touch,
                    "itemProfit":rule.profit_percent,
                    "itemWastage":rule.wastage_percent,
                })
        emit("ItemNameResults",itemData)

    except Exception as e:
        db.rollback()
        print("Error: ",e)
        emit("error",{"message":"Error in Search Item Name!!"})
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
        db.rollback()
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
        db.rollback()
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
        db.rollback()
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
        db.rollback()
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Save Item!!"})
    finally:
        db.close()

@socketio.on("searchItem")
def search_item(data):
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
        itemClass = db.query(models.Item).filter(models.Item.name.ilike(f"%{data.get("value")}%")).all()
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
        db.rollback()
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Search Item!!"})
    finally:
        db.close()

@socketio.on("getTransaction")
def getTransaction(data=None):
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
        transactions = db.query(models.Transaction).order_by(models.Transaction.created_at.desc()).all()
        transactionData = []
        for bill in transactions:
            entity_id = bill.entity_id
            entity_name = db.query(models.Entities).filter_by(id=entity_id).first().name
            entity_location = db.query(models.Entities).filter_by(id=entity_id).first().location
            entity_type = db.query(models.Entities).filter_by(id=entity_id).first().type
            transactionData.append({
                "id": bill.id,
                "name": entity_name,
                "old_balance": bill.old_balance,
                "new_balance": bill.new_balance,
                "base_weight": bill.base_weight,
                "final_weight": bill.final_weight,
                "created_at": str(bill.created_at),
                "updated_at": str(bill.updated_at),
                "created_by": bill.created_by,
                "location": entity_location,
                "type": entity_type.name,
            })
        emit("transactionData",transactionData)
    except Exception as e:
        db.rollback()
        print("Error: ",e)
        emit("error",{"message":"All Transaction Error!!"})
    finally:
        db.close()

@socketio.on("saveTransaction")
def saveTransaction(data):
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
        entity_id = db.query(models.Entities).filter_by(name=data.get("name")).first().id
        time = datetime.now(ZoneInfo("Asia/Kolkata"))
        newTransaction = models.Transaction(
            entity_id = entity_id,
            old_balance = data.get("old_balance"),
            new_balance = data.get("new_balance"),
            base_weight = data.get("base_weight"),
            final_weight = data.get("final_weight"),
            cash = data.get("cash"),
            gold_rate = data.get("gold_rate"),
            created_at = time,
            updated_at = time,
            created_by=current_user_id,
        )
        db.add(newTransaction)
        db.commit()
        db.refresh(newTransaction)

        refresh_oldbalance(entity_id,data.get("new_balance",None))

        items = data.get("items")
        transaction_id = db.query(models.Transaction).filter_by(created_at=time).first().id
        print(items)
        
        #{'itemname': '', 'baseweight': 0, 'seal': 0, 
        # 'profit': 0, 'wastage': 0, 'stone': 0, 
        # 'qty': 0, 'finalweight': 0, 'type': 'SELL'}]
        for item in items:
            item_id = db.query(models.Item).filter(
                models.Item.name==item.get("itemname"),
                models.Item.touch==item.get("touch")
            ).first().id
            type = item.get("type")
            if type == "BUY":
                type = "PURCHASE"
            seal = db.query(models.Entities).filter_by(name=item.get("seal","")).first()
            if seal:
                newTransactionItem = models.TransactionItem(
                    transaction_id = transaction_id,
                    item_id = item_id,
                    touch = item.get("touch",92),
                    seal = seal.id,
                    profit_percent = item.get("profit",0),
                    wastage_percent = item.get("wastage",0),
                    stone_less = item.get("stone",0),
                    type = models.TransactionType[type],
                    quantity = item.get("qty",0),
                    base_weight = item.get("baseweight"),
                    final_weight = item.get("finalweight"),
                    cash = item.get("cash"),
                    created_by = current_user_id,
                )
                db.add(newTransactionItem)
                db.commit()
                db.refresh(newTransactionItem)
            else:
                newTransactionItem = models.TransactionItem(
                    transaction_id = transaction_id,
                    item_id = item_id,
                    touch = item.get("touch",92),
                    profit_percent = item.get("profit",0),
                    wastage_percent = item.get("wastage",0),
                    stone_less = item.get("stone",0),
                    type = models.TransactionType[type],
                    quantity = item.get("qty",0),
                    base_weight = item.get("baseweight"),
                    final_weight = item.get("finalweight"),
                    cash = item.get("cash"),
                    created_by = current_user_id,
                )
                db.add(newTransactionItem)
                db.commit()
                db.refresh(newTransactionItem)


            rule = db.query(models.Rule).filter(
                models.Rule.entity_id==entity_id,
                models.Rule.item_id==item_id).first()
            if rule==None:
                newRule = models.Rule(
                    entity_id = entity_id,
                    item_id = item_id,
                    profit_percent = item.get("profit",0),
                    wastage_percent = item.get("wastage",0),
                    created_at = time,
                    updated_at = time,
                    created_by = current_user_id
                )
                db.add(newRule)
                db.commit()
                db.refresh(newRule)
            
            stock = db.query(models.Stock).filter_by(item_id=item_id).first()
            if stock:
                if type=="PURCHASE":
                    stock.current_stock = stock.current_stock + item.get("baseweight")
                else:
                    stock.current_stock = stock.current_stock - item.get("baseweight")
                db.commit()


        new_balance_function, flag = calculate_new_balance(data.get("old_balance"),data.get("items"))
        if flag==False:
            print("Error in Total Checking!!")
            socketio.emit("error",{"message":"Error in the Total compared from front-end and back-end!!"})
            socketio.emit("openEditTransaction",transaction_id)
            #### Under Construction in saveTransaction too
        refresh_oldbalance(entity_id,data.get("new_balance"))
        socketio.emit("saveTransactionOk",{})
    
    except Exception as e:
        db.rollback()
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Save Transaction!!"})
    finally:
        db.close()


def refresh_oldbalance(id,balance=None):
    try:
        db = SessionLocal()
        latest_data = db.query(models.Transaction).filter_by(entity_id=id).first()
        if latest_data==None:
            entity = db.query(models.Entities).filter_by(id=id).first()
            entity.balance = entity.opening_balance
            entity.updated_at = datetime.now(ZoneInfo("Asia/Kolkata"))
            db.commit()
            return
        if balance==None:
            latest_data = db.query(models.Transaction).filter_by(entity_id=id).order_by(models.Transaction.created_at.desc()).first()
            updated_balance = latest_data.new_balance
            update_time = datetime.now(ZoneInfo("Asia/Kolkata"))
            entity = db.query(models.Entities).filter_by(id=id).first()
            if entity:
                entity.balance = updated_balance
                entity.updated_at = update_time
            db.commit()
        else:
            updated_balance = balance
            update_time = datetime.now(ZoneInfo("Asia/Kolkata"))
            entity = db.query(models.Entities).filter_by(id=id).first()
            if entity:
                entity.balance = updated_balance
                entity.updated_at = update_time
            db.commit()

    except Exception as e:
        db.rollback()
        print("Refresh OldBalance Error")
        print("Error:",e)
    finally:
        db.close()

def get_old_balance(entity_id,created_at=None):
    db = SessionLocal()
    entity = db.query(models.Entities).filter_by(id=entity_id).first()
    if created_at==None:
        previous_transaction = db.query(models.Transaction).filter_by(entity_id=entity_id).first()
        if previous_transaction!=None:
            return entity.balance
        return entity.opening_balance
    previous_transaction = db.query(models.Transaction).filter(
        models.Transaction.entity_id==entity.id,
        models.Transaction.created_at < created_at
    ).order_by(models.Transaction.created_at.desc()).first()
    if previous_transaction==None:
        return entity.opening_balance
    return previous_transaction.new_balance

# {'itemname': 'Casting Rings', 'baseweight': 100,
#  'touch': 92, 'seal': 'Narendran', 'profit': 0, 
# 'wastage': 3, 'stone': 0, 'qty': '1', 
# 'finalweight': 0, 'type': 'BUY'}

def calculate_final_per_item(item):
    try:
        baseweight = float(item.get("baseweight"))
        touch = float(item.get("touch"))
        profit = float(item.get("profit"))
        wastage = float(item.get("wastage"))
        stone = float(item.get("stone"))
        finalweight = float(item.get("finalweight"))
        item_type = item.get("type")
        if abs(wastage) > 0.0001:
            stoneless = baseweight - stone
            final = stoneless*((100+wastage)/100)
            if touch == 92:
                final = final*91.7/100
            else:
                final = final*touch/100
            return_value = 0
            return_bool = True
            if abs(final - finalweight) < 0.0001:
                return_value, return_bool = finalweight,True
            else:
                return_value, return_bool = final,False
            if item_type=="BUY":
                return -1*return_value, return_bool
            return return_value, return_bool
        else:
            stoneless = baseweight - stone
            total_touch = (touch + profit)/100
            final = stoneless*total_touch
            return_value = 0
            return_bool = True
            if abs(final - finalweight) < 0.0001:
                return_value, return_bool = finalweight,True
            else:
                return_value, return_bool = final,False
            if item_type=="BUY":
                return -1*return_value, return_bool
            return return_value, return_bool
    except Exception as e:
        print("Error:",e,"at Calculate Final Per Item")
        return 0,False

def calculate_new_balance(old_balance,items):
    try:
        totalWeight = 0
        for item in items:
            weight,flag = calculate_final_per_item(item)
            if flag:
                totalWeight += weight
            else:
                return 0,False
        return old_balance + totalWeight,True
    except Exception as e:
        print("Error:",e,"at Calculate New Balance")
        return 0,False
    
@socketio.on("triggerEditTransactionSequence")
def trigerEditTransactionSequence(data):
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
        bill = db.query(models.Transaction).filter_by(id=data.get("id")).first()
        entity_id = bill.entity_id
        entity_name = db.query(models.Entities).filter_by(id=entity_id).first().name
        entity_location = db.query(models.Entities).filter_by(id=entity_id).first().location
        entity_type = db.query(models.Entities).filter_by(id=entity_id).first().type
        items = db.query(models.TransactionItem).filter_by(transaction_id=data.get("id")).all()
        items_data = []
        for item in items:
            item_name = db.query(models.Item).filter_by(id=item.item_id).first().name
            seal_name = db.query(models.Entities).filter_by(id=item.seal).first()
            if seal_name:
                seal_name = seal_name.name
            else:
                seal_name = ""
            items_data.append({
                "id": item.id,
                "item_name": item_name,
                "touch": item.touch,
                "seal": seal_name,
                "profit_percent": item.profit_percent,
                "wastage_percent": item.wastage_percent,
                "stone_less": item.stone_less,
                "type": item.type.name,
                "quantity": item.quantity,
                "base_weight": item.base_weight,
                "cash": item.cash,
                # "final_weight": item.final_weight,
                # "created_by": item.created_by,
            })
        transactionData = {
            "id": bill.id,
            "name": entity_name,
            "old_balance": bill.old_balance,
            "new_balance": bill.new_balance,
            "base_weight": bill.base_weight,
            "final_weight": bill.final_weight,
            "created_at": str(bill.created_at),
            "updated_at": str(bill.updated_at),
            "goldRate": bill.gold_rate,
            "cash": bill.cash,
            # "created_by": bill.created_by,
            "location": entity_location,
            "type": entity_type.name,
            "items": items_data,
            "created_at": str(bill.created_at),
        }
        emit("triggerEditTransactionSequenceFromServer",transactionData)
    except Exception as e:
        db.rollback()
        print("Error: ",e)
        import traceback
        traceback.print_exc()
        emit("error",{"message":"Edit Transaction Error!!"})
    finally:
        db.close()

@socketio.on("saveEditTransaction")
def saveEditTransaction(data):
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
        transaction_id = data.get("id")
        transaction = db.query(models.Transaction).filter_by(id=transaction_id).first()
        entity_id = db.query(models.Entities).filter_by(name=data.get("name")).first().id
        if transaction:
            transaction.entity_id = entity_id
            transaction.old_balance = data.get("old_balance")
            transaction.new_balance = data.get("new_balance")
            transaction.base_weight = data.get("base_weight")
            transaction.final_weight = data.get("final_weight")
            transaction.cash = data.get("cash")
            transaction.gold_rate = data.get("gold_rate")
            transaction.updated_at = datetime.now(ZoneInfo("Asia/Kolkata"))
        db.flush()

        items = data.get("items")
        compareItems = []
        for item in items:
            if item.get("id") not in [None, "", "null", "undefined"]:
                temp_data = db.query(models.TransactionItem).filter_by(id=item.get("id")).first()
                if temp_data:
                    compareItems.append(temp_data.id)

        actual_items = db.query(models.TransactionItem).filter_by(transaction_id=transaction_id).all()
        for item in actual_items:
            if item.id not in compareItems:
                db.delete(item)
                db.flush()
                stock = db.query(models.Stock).filter_by(item_id=item.item_id).first()
                if stock:
                    if item.type.name=="PURCHASE":
                        stock.current_stock = stock.current_stock - item.base_weight
                    else:
                        stock.current_stock = stock.current_stock + item.base_weight
                    db.flush()
            
        #{'itemname': '', 'baseweight': 0, 'seal': 0, 
        # 'profit': 0, 'wastage': 0, 'stone': 0, 
        # 'qty': 0, 'finalweight': 0, 'type': 'SELL'}]
        time = datetime.now(ZoneInfo("Asia/Kolkata"))
        for item in items:
            item_id = db.query(models.Item).filter(
                models.Item.name==item.get("itemname"),
                models.Item.touch==item.get("touch")
            ).first().id
            item_type = item.get("type")
            if item_type == "BUY":
                item_type = "PURCHASE"
            seal = db.query(models.Entities).filter_by(name=item.get("seal","")).first()
            if item.get("id") not in [None, "", "null", "undefined"]:
                transactionItem = db.query(models.TransactionItem).filter_by(id=item.get("id")).first()
                if item_id==transactionItem.item_id:
                    stock = db.query(models.Stock).filter_by(item_id=transactionItem.item_id).first()
                    if stock:
                        if transactionItem.type.name=="PURCHASE":
                            stock.current_stock = stock.current_stock - transactionItem.base_weight
                        else:
                            stock.current_stock = stock.current_stock + transactionItem.base_weight
                        if item_type=="PURCHASE":
                            stock.current_stock = stock.current_stock + item.get("baseweight")
                        else:
                            stock.current_stock = stock.current_stock - item.get("baseweight")
                else:
                    prevstock = db.query(models.Stock).filter_by(item_id=transactionItem.item_id).first()
                    if prevstock:
                        if transactionItem.type.name=="PURCHASE":
                            prevstock.current_stock = prevstock.current_stock - transactionItem.base_weight
                        else:
                            prevstock.current_stock = prevstock.current_stock + transactionItem.base_weight
                    stock = db.query(models.Stock).filter_by(item_id=item_id).first()
                    if stock:
                        if item_type=="PURCHASE":
                            stock.current_stock = stock.current_stock + item.get("baseweight")
                        else:
                            stock.current_stock = stock.current_stock - item.get("baseweight")
                db.flush()

                if transactionItem:
                    transactionItem.item_id = item_id
                    transactionItem.touch = item.get("touch")
                    transactionItem.profit_percent = item.get("profit")
                    transactionItem.wastage_percent = item.get("wastage")
                    transactionItem.stone_less = item.get("stone")
                    transactionItem.type = models.TransactionType[item_type]
                    transactionItem.quantity = item.get("qty",0)
                    transactionItem.base_weight = item.get("baseweight")
                    transactionItem.final_weight = item.get("finalweight")
                    transactionItem.cash = item.get("cash")
                    # transactionItem.created_by = current_user_id
                    if seal:
                        transactionItem.seal = seal.id
                    db.flush()
            else:
                if seal:
                    newTransactionItem = models.TransactionItem(
                        transaction_id = transaction_id,
                        item_id = item_id,
                        touch = item.get("touch",92),
                        seal = seal.id,
                        profit_percent = item.get("profit",0),
                        wastage_percent = item.get("wastage",0),
                        stone_less = item.get("stone",0),
                        type = models.TransactionType[item_type],
                        quantity = item.get("qty",0),
                        base_weight = item.get("baseweight"),
                        final_weight = item.get("finalweight"),
                        cash = item.get("cash"),
                        created_by = current_user_id,
                    )
                    db.add(newTransactionItem)
                    db.flush()
                    db.refresh(newTransactionItem)
                else:
                    newTransactionItem = models.TransactionItem(
                        transaction_id = transaction_id,
                        item_id = item_id,
                        touch = item.get("touch",92),
                        profit_percent = item.get("profit",0),
                        wastage_percent = item.get("wastage",0),
                        stone_less = item.get("stone",0),
                        type = models.TransactionType[item_type],
                        quantity = item.get("qty",0),
                        base_weight = item.get("baseweight"),
                        final_weight = item.get("finalweight"),
                        cash = item.get("cash"),
                        created_by = current_user_id,
                    )
                    db.add(newTransactionItem)
                    db.flush()
                    db.refresh(newTransactionItem)
            
                stock = db.query(models.Stock).filter_by(item_id=item_id).first()
                if stock:
                    if item_type=="PURCHASE":
                        stock.current_stock = stock.current_stock + item.get("baseweight")
                    else:
                        stock.current_stock = stock.current_stock - item.get("baseweight")
                    db.flush()
            


            rule = db.query(models.Rule).filter(
                models.Rule.entity_id==entity_id,
                models.Rule.item_id==item_id).first()
            if rule==None:
                newRule = models.Rule(
                    entity_id = entity_id,
                    item_id = item_id,
                    profit_percent = item.get("profit",0),
                    wastage_percent = item.get("wastage",0),
                    created_at = time,
                    updated_at = time,
                    created_by = current_user_id
                )
                db.add(newRule)
                db.flush()
                db.refresh(newRule)
        db.flush()

        new_balance_function, flag = calculate_new_balance(data.get("old_balance"),data.get("items"))
        if flag==False:
            print("Error in Total Checking!!")
            socketio.emit("error",{"message":"Error in the Total compared from front-end and back-end!!"})
            socketio.emit("openEditTransaction",transaction_id)
            #### Under Construction in saveTransaction too
        backup_entity_id = db.query(models.Entities).filter_by(name=data.get("backup_name")).first().id
        transaction_correction_sequence(transaction_id=transaction_id,entity_id=None,created_at=transaction.created_at)
        transaction_correction_sequence(transaction_id=None,entity_id=backup_entity_id,created_at=transaction.created_at,old_balance_backup=data.get("old_balance_backup"))
        refresh_oldbalance(entity_id)
        refresh_oldbalance(backup_entity_id)
        db.commit()
        socketio.emit("saveEditTransactionOk",{})
    
    except Exception as e:
        db.rollback()
        print("Error:",e)
        import traceback
        traceback.print_exc()
        socketio.emit("error",{"message":"Error At Save Edit Transaction!!"})
    finally:
        db.close()

def transaction_correction_sequence(transaction_id=None,entity_id=None,created_at=None,old_balance_backup=None):
    try:
        db = SessionLocal()
        if entity_id==None:
            entity_id = db.query(models.Transaction).filter_by(id=transaction_id).first().entity_id
        if created_at==None:
            created_at = db.query(models.Transaction).filter_by(id=transaction_id).first().created_at
            
        sequenceData = db.query(models.Transaction).filter(
            models.Transaction.entity_id==entity_id,
            models.Transaction.created_at>created_at,
        ).order_by(models.Transaction.created_at)
        prev_balance = get_old_balance(entity_id,created_at)
        for seqData in sequenceData:
            temp_balance = seqData.old_balance
            seqData.old_balance = prev_balance
            seqData.new_balance = seqData.new_balance - temp_balance + prev_balance
            prev_balance = seqData.new_balance
        db.commit()
    
    except Exception as e:
        db.rollback()
        print("Error:",e)
        import traceback
        traceback.print_exc()
        socketio.emit("error",{"message":"Error At Save Edit Transaction!!"})
    finally:
        db.close()


@socketio.on("deleteTransaction")
def deleteTransaction(data):
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
        id = data.get("id")
        items = db.query(models.TransactionItem).filter_by(transaction_id=id).all()
        for item in items:
            stock = db.query(models.Stock).filter_by(item_id=item.item_id).first()
            if stock:
                if item.type.name == "SALE":
                    stock.current_stock = stock.current_stock + item.base_weight
                else:
                    stock.current_stock = stock.current_stock - item.base_weight
            db.delete(item)
            db.commit()
        transaction = db.query(models.Transaction).filter_by(id=id).first()
        entity_id = transaction.entity_id
        created_at = transaction.created_at
        if transaction:
            db.delete(transaction)
            db.commit()
        transaction_correction_sequence(transaction_id=None,entity_id=entity_id,created_at=created_at,old_balance_backup=data.get("old_balance"))
        refresh_oldbalance(entity_id)
        socketio.emit("deleteTransactionOk",{})
    except Exception as e:
        db.rollback()
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Delete Transaction!!"})
    finally:
        db.close()

@socketio.on("addItemsForEntitiesSequence")
def addItemsForEntitiesSequence(data):
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
        ruleClass = db.query(models.Rule).filter_by(entity_id=data.get("entity_id")).order_by(models.Rule.created_at.desc()).distinct().limit(10).all()
        itemData = []
        for rule in ruleClass:
            item = db.query(models.Item).filter_by(id=rule.item_id).first()
            itemData.append({
                "item_name": item.name,
                "profit_percent": rule.profit_percent,
                "wastage_percent": rule.wastage_percent,
                "touch": item.touch,
            })
        actualData = {
            "items": itemData,
        }
        socketio.emit("addItemsForEntities",actualData)
    except Exception as e:
        db.rollback()
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Add Item For Entities!!"})
    finally:
        db.close()

@socketio.on("saveItemRule")
def saveItemRule(data):
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
        item_name = data.get("item_name","")
        entity_id = data.get("entity_id","")
        touch = data.get("touch",0)
        profit = data.get("profit",0)
        wastage = data.get("wastage",0)
        item_id = db.query(models.Item).filter(
            models.Item.name==item_name,
            models.Item.touch==touch).first().id
        rule = db.query(models.Rule).filter(
            models.Rule.item_id == item_id,
            models.Rule.entity_id == entity_id
        ).first()
        if rule:
            rule.profit_percent = profit
            rule.wastage_percent = wastage
            db.commit()
        else:
            time = datetime.now(ZoneInfo("Asia/Kolkata"))
            newRule = models.Rule(
                item_id = item_id,
                entity_id = entity_id,
                profit_percent = profit,
                wastage_percent = wastage,
                created_at = time,
                updated_at = time,
                created_by = current_user_id,
            )
            db.add(newRule)
            db.commit()
    except Exception as e:
        db.rollback()
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Save Item Rule!!"})
    finally:
        db.close()


@socketio.on("getStock")
def getStock(data):
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
        stockClass = db.query(models.Stock).all()
        itemData = []
        for stock in stockClass:
            item = db.query(models.Item).filter_by(id=stock.item_id).first()
            itemData.append({
                "id": stock.id,
                "name": item.name,
                "touch": item.touch,
                "current_stock": stock.current_stock,
                "created_at": str(item.created_at),
                "created_by": item.created_by,
            })
        emit("stockData",itemData)

    except Exception as e:
        db.rollback()
        print("Error: ",e)
        emit("error",{"message":"All Item Error!!"})
    finally:
        db.close()
    
@socketio.on("saveStock")
def saveStock(data=None):
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
        """
            If stock already exist, that means Item already exist,
            just update the Stock.
            Else update Stock as well as Item table.

            Similarly continue the Edit Stock thingy anad
            delete stock thingy too

        """
        name = data.get("name")
        touch = data.get("touch")
        item = db.query(models.Item).filter(
            models.Item.name == name,
            models.Item.touch == touch,
        ).first()
        if item==None:
            newItem = models.Item(
                name = name,
                touch = touch,
                created_at=datetime.now(ZoneInfo("Asia/Kolkata")),
                created_by=current_user_id
            )
            db.add(newItem)
            db.commit()
            db.refresh(newItem)
            item = db.query(models.Item).filter(
                models.Item.name == name,
                models.Item.touch == touch,
            ).first()
        else:
            stock = db.query(models.Stock).filter_by(item_id=item.id).first()
            if stock:
                socketio.emit("stockAlert",{"message":"Stock already exist. Please choose a different Item Name to Proceed."})
                return
        newStock = models.Stock(
            item_id = item.id,
            current_stock = data.get("current_stock"),
        )
        db.add(newStock)
        db.commit()
        db.refresh(newStock)
        
        socketio.emit("saveStockOk",{})
    except Exception as e:
        db.rollback()
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Save Stock!!"})
    finally:
        db.close()

@socketio.on("saveStockEdit")
def saveStockEdit(data=None):
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
        stock = db.query(models.Stock).filter_by(id=data.get("id")).first()
        item = db.query(models.Item).filter_by(id=stock.item_id).first()
        name = data.get("name")
        touch = data.get("touch")
        current_stock = data.get("current_stock")
        # print(item.name,name)
        # print(type(item.touch),type(touch))
        if item.name == name and item.touch==touch:
            stock.current_stock = current_stock
            db.commit()
            socketio.emit("editStockOk",{})
            return
        checkItem = db.query(models.Item).filter(
            models.Item.name == name,
            models.Item.touch == touch,
        ).first()
        if checkItem:
            checkStock = db.query(models.Stock).filter_by(item_id=checkItem.id).first()
            if checkStock:
                socketio.emit("stockAlert",{"message":"Stock already exist. Please choose a different Item Name to Proceed."})
                return
            stock.item_id = checkItem.id
            stock.current_stock = current_stock
            db.commit()
        else:
            newItem = models.Item(
                name = name,
                touch = touch,
                created_at=datetime.now(ZoneInfo("Asia/Kolkata")),
                created_by=current_user_id
            )
            db.add(newItem)
            db.commit()
            db.refresh(newItem)
            item = db.query(models.Item).filter(
                models.Item.name == name,
                models.Item.touch == touch,
            ).first()
            
            stock.item_id = item.id
            stock.current_stock = current_stock

        db.commit()
        socketio.emit("editStockOk",{})
    except Exception as e:
        db.rollback()
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Save Edit Stock!!"})
    finally:
        db.close()

@socketio.on("deleteStock")
def deleteStock(data):
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
        stock = db.query(models.Stock).filter_by(id=data.get("id")).first()
        if stock:
            db.delete(stock)
            db.commit()
        socketio.emit("deleteStockOk",{})
    except Exception as e:
        db.rollback()
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Delete Stock!!"})
    finally:
        db.close()


@socketio.on("getTransactionsForEntity")
def getTransactionsForEntity(data):
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
        transactions = (db.query(models.Transaction).filter_by(entity_id=data.get("entity_id")).order_by(models.Transaction.created_at.desc()).limit(15).all())
        transactions = sorted(transactions,key=lambda x: x.created_at)
        finalData = []
        for transaction in transactions:
            transaction_items = (db.query(models.TransactionItem).filter_by(transaction_id=transaction.id).all())
            for item in transaction_items:
                itemData = (
                    db.query(models.Item)
                    .filter_by(id=item.item_id)
                    .first()
                )
                tempItem = {
                    "baseweight":100,
                    "touch":item.touch,
                    "profit":item.profit_percent,
                    "wastage":item.wastage_percent,
                    "stone":item.stone_less,
                    "finalweight":0,
                    "type":"SALE",
                }
                finalWastage,bool = calculate_final_per_item(tempItem)
                finalData.append({
                    "transaction_id":transaction.id,
                    "date":transaction.created_at.strftime("%Y-%m-%d"),
                    "photo_sent":transaction.photo.name,
                    "old_balance":transaction.old_balance,
                    "new_balance":transaction.new_balance,
                    "transaction_item_id":item.id,
                    "item_name":itemData.name if itemData else "",
                    "touch":item.touch,
                    "base_weight":item.base_weight,
                    "stone_less":item.stone_less,
                    "wastage":finalWastage,
                    "final_pure":item.final_weight,
                    "quantity":item.quantity,
                    "type":item.type.name,
                    "profit_percent":item.profit_percent,
                    "cash":item.cash,
                })
        emit("entityTransactions",{"transactions": finalData})
    except Exception as e:
        db.rollback()
        print("Get All Transactions For Entity Error")
        print("Error: ",e)
        import traceback
        traceback.print_exc()
        emit("error",{"message":"All Transaction Error!!"})
    finally:
        db.close()

@socketio.on("clearBalance")
def clearBalance(data):
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
        entity = db.query(models.Entities).filter_by(id=data.get("id")).first()
        nil_balance = entity.balance
        if abs(nil_balance)==0:
            return
        nil_balance = -1*nil_balance
        nil_name = "Nil Correction"
        nill_item = db.query(models.Item).filter_by(name=nil_name).first()
        if nill_item:
            pass
        else:
            newItem = models.Item(
                name = nil_name,
                touch = 100,
                created_at=datetime.now(ZoneInfo("Asia/Kolkata")),
                created_by=current_user_id
            )
            db.add(newItem)
            db.flush()
            db.refresh(newItem)
            socketio.emit("saveItemOk",{})
            nill_item = db.query(models.Item).filter_by(name=nil_name).first()

        prev_transaction = db.query(models.Transaction).filter_by(entity_id=data.get("id")).order_by(models.Transaction.created_at.desc()).first()

        entity_id = data.get("id")
        time = datetime.now(ZoneInfo("Asia/Kolkata"))
        newTransaction = models.Transaction(
            entity_id = entity_id,
            old_balance = prev_transaction.new_balance,
            new_balance = 0,
            base_weight = nil_balance,
            final_weight = nil_balance,
            cash = 0,
            gold_rate = 0,
            created_at = time,
            updated_at = time,
            created_by=current_user_id,
        )
        db.add(newTransaction)
        db.commit()
        db.refresh(newTransaction)

        refresh_oldbalance(entity_id,data.get("new_balance",None))

        items = [{'itemname': nil_name, 'baseweight': nil_balance, 
                  'touch': 100, 'seal': '', 'profit': 0, 'wastage': 0,
                  'stone': 0, 'qty': 0,
                  'finalweight': nil_balance, 'type': 'BUY', 'cash': 0}]
        
        if nil_balance>0:
            items[0]["type"] = "SALE"

        transaction_id = db.query(models.Transaction).filter_by(created_at=time).first().id
        
        #{'itemname': '', 'baseweight': 0, 'seal': 0, 
        # 'profit': 0, 'wastage': 0, 'stone': 0, 
        # 'qty': 0, 'finalweight': 0, 'type': 'SELL'}]
        for item in items:
            item_id = db.query(models.Item).filter(
                models.Item.name==item.get("itemname"),
                models.Item.touch==item.get("touch")
            ).first().id
            type = item.get("type")
            if type == "BUY":
                type = "PURCHASE"
            newTransactionItem = models.TransactionItem(
                transaction_id = transaction_id,
                item_id = item_id,
                touch = item.get("touch",92),
                seal = entity_id,
                profit_percent = item.get("profit",0),
                wastage_percent = item.get("wastage",0),
                stone_less = item.get("stone",0),
                type = models.TransactionType[type],
                quantity = item.get("qty",0),
                base_weight = item.get("baseweight"),
                final_weight = item.get("finalweight"),
                cash = item.get("cash"),
                created_by = current_user_id,
            )
            db.add(newTransactionItem)
            db.commit()
            db.refresh(newTransactionItem)
        socketio.emit("clearBalanceOk",{})
        
    except Exception as e:
        db.rollback()
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Clear Balance!!"})
    finally:
        db.close()

@socketio.on("deleteRule")
def deleteRule(data):
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
        item_id = db.query(models.Item).filter(
            models.Item.name == data.get("itemName"),
            models.Item.touch == data.get("touch"),
        ).first().id
        entity_id = data.get("entity_id")
        rule = db.query(models.Rule).filter(
            models.Rule.item_id == item_id,
            models.Rule.entity_id == entity_id,
        ).first()
        if rule:
            db.delete(rule)
            db.flush()
        socketio.emit("deleteRuleOk",{})
        db.commit()

    except Exception as e:
        db.rollback()
        print("Error:",e)
        socketio.emit("error",{"message":"Error At Clear Balance!!"})
    finally:
        db.close()

if __name__=="__main__":
    socketio.run(app,debug=True,port=5000)