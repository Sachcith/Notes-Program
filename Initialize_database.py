from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base

from sqlalchemy import Column, Integer, String, DateTime, Identity
from datetime import datetime
from zoneinfo import ZoneInfo

from enum import Enum

from sqlalchemy import Enum as SQLEnum

from sqlalchemy import ForeignKey, Float

from db import Base, engine

class EntityType(Enum):
    CUSTOMER = "customer"
    MANUFACTURER = "manufacturer"
    WHOLESALER = "wholesaler"


class TransactionType(Enum):
    SALE = "sale"
    PURCHASE = "purchase"

class PhotoSent(Enum):
    SENT = "sent"
    NOT_SENT = "not_sent"

class Entities(Base):
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True)
    name = Column(String,nullable=False)
    type = Column(SQLEnum(EntityType), nullable=False)
    phone = Column(String)
    location = Column(String)

    opening_balance = Column(Float,default=0)
    balance = Column(Float,default=0)
    last_closing_date = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Asia/Kolkata")))

    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Asia/Kolkata")))
    updated_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Asia/Kolkata")))
    created_by = Column(Integer)

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    touch = Column(Float)

    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Asia/Kolkata")))
    created_by = Column(Integer)

class Rule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True)
    entity_id = Column(Integer, ForeignKey("entities.id"))
    item_id = Column(Integer, ForeignKey("items.id"))

    profit_percent = Column(Float)
    wastage_percent = Column(Float)

    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Asia/Kolkata")))
    updated_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Asia/Kolkata")))
    created_by = Column(Integer)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True)
    entity_id = Column(Integer, ForeignKey("entities.id"))

    old_balance = Column(Float,nullable=False,default=0)
    new_balance = Column(Float,nullable=False,default=0)

    base_weight = Column(Float)
    final_weight = Column(Float)

    cash = Column(Integer)
    gold_rate = Column(Float)

    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Asia/Kolkata")))
    updated_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Asia/Kolkata")))

    photo = Column(SQLEnum(PhotoSent),default=PhotoSent.NOT_SENT,nullable=False)

    created_by = Column(Integer)

class TransactionItem(Base):
    __tablename__ = "transaction_items"

    id = Column(Integer, primary_key=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))

    item_id = Column(Integer, ForeignKey("items.id"))
    touch = Column(Float)

    seal = Column(Integer, ForeignKey("entities.id"))

    profit_percent = Column(Float)
    wastage_percent = Column(Float)
    stone_less = Column(Float)

    type = Column(SQLEnum(TransactionType), nullable=False)

    quantity = Column(Float)
    base_weight = Column(Float)
    final_weight = Column(Float)

    cash = Column(Float)

    created_by = Column(Integer)

class Location(Base):
    __tablename__ = "location_colors"

    id = Column(Integer, primary_key=True)

    color = Column(String,nullable=False)


class UserRole(Enum):
    user = "user"
    admin = "admin"

class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)

    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.user)

Base.metadata.create_all(engine)
