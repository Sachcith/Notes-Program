# Jewellery ERP System

A complete Jewellery ERP system designed for managing gold transactions, customer balances, inventory stock, cash settlements, and business reporting.

The application provides a real-time web interface powered by Flask and Socket.IO, allowing users to manage daily gold trading operations, maintain accurate customer ledgers, track stock movement, and generate financial reports.

---

## Overview

This project was built to simplify the management of jewellery and gold trading businesses.

The system includes:

* Customer & Vendor Management
* Gold Transaction Processing
* Inventory Tracking
* Customer Gold Ledger
* Cash & RTGS Management
* Automated Balance Calculation
* Transaction Editing & Deletion
* Historical Balance Correction
* Reporting Dashboard
* Real-Time Updates

The objective is to maintain accurate gold balances, stock records, and transaction history while reducing manual bookkeeping.

---

## Features

### Entity Management

Manage customers, vendors, and business partners.

Features include:

* Add entities
* Edit entity details
* Delete entities
* Search entities
* Track running gold balance
* Maintain transaction history

---

### Item Management

Manage jewellery item categories and default transaction rules.

Features include:

* Add item types
* Configure touch percentage
* Set default profit percentage
* Set default wastage percentage
* Auto-fill transaction values

---

### Transaction Management

Record gold purchases and sales with automatic balance calculation.

Each transaction supports:

* Customer selection
* Multiple items
* Weight entry
* Touch percentage
* Profit percentage
* Wastage percentage
* Stone deduction
* Quantity tracking
* Cash adjustment
* RTGS adjustment

---

### Automatic Gold Calculations

The system automatically converts transaction details into final gold weight.

Supports:

#### Profit-Based Calculation

```text
Final Weight =
(Base Weight - Stone Less)
× (Touch + Profit) / 100
```

#### Wastage-Based Calculation

```text
Final Weight =
(Base Weight - Stone Less)
× (100 + Wastage) / 100
× Touch / 100
```

All calculations are updated instantly while entering data.

---

### Customer Balance Ledger

Each entity maintains a running gold balance.

```text
New Balance =
Old Balance + Transaction Weight
```

The system automatically updates balances after:

* New transactions
* Transaction edits
* Transaction deletion

---

### Cash & RTGS Tracking

The ERP supports cash settlements converted into gold value.

Special transaction types:

* Cash Gold
* RTGS Gold

Calculation:

```text
Gold Weight =
Cash Amount ÷ Gold Rate
```

This allows simultaneous tracking of:

* Gold movement
* Cash movement
* RTGS movement

---

### Stock Management

Inventory is updated automatically from transaction entries.

#### Purchase

```text
Stock += Base Weight
```

#### Sale

```text
Stock -= Base Weight
```

Features:

* Real-time stock updates
* Item-wise stock balance
* Touch-based gold valuation

---

### Transaction Editing

Existing transactions can be modified at any time.

The system automatically:

* Updates transaction records
* Recalculates stock
* Recalculates customer balances
* Preserves historical consistency

---

### Transaction Deletion

Transactions can be removed safely using a soft-delete mechanism.

Deletion automatically:

* Reverses stock changes
* Updates customer balances
* Preserves audit history
* Stores recovery information

---

### Historical Balance Correction

One of the core features of the system is automatic balance correction.

If an old transaction is edited:

```text
Transaction 1 → Balance 100
Transaction 2 → Balance 120
Transaction 3 → Balance 140
```

After modifying Transaction 2:

```text
Transaction 2 → Balance 130
```

The system automatically updates:

```text
Transaction 3 → Balance 150
```

This ensures ledger consistency across all historical records.

---

### Reporting

The ERP provides multiple business reports.

#### Gold Report

Displays:

* Customer gold balances
* Stock gold value
* Total gold position

---

#### Cash Report

Displays:

* Cash inflow
* Cash outflow
* RTGS inflow
* RTGS outflow
* Current balances

---

## Workflow

Typical business flow:

```text
Create Entity
      ↓
Create Items
      ↓
Enter Transaction
      ↓
Update Customer Balance
      ↓
Update Stock
      ↓
Generate Reports
```

---

## Real-Time Architecture

The application uses Socket.IO for instant communication between client and server.

Benefits include:

* Live transaction updates
* Immediate balance calculations
* Real-time stock updates
* Faster user experience

---

## Technology Stack

### Backend

* Python
* Flask
* Flask-SocketIO
* SQLAlchemy
* JWT Authentication

---

### Frontend

* HTML
* CSS
* JavaScript

---

### Database

* SQLAlchemy ORM
* Postgresql
* Relational Database Support

---

## Project Structure

```text
.
├── app.py
├── models.py
├── static
│   ├── css
│   │   └── styles.css
│   └── js
│       ├── main.js
│       ├── entity.js
│       ├── item.js
│       ├── transaction.js
│       ├── stock.js
│       ├── cash.js
│       └── report.js
├── templates
│   └── index.html
├── requirements.txt
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/Sachcith/Notes-Program
cd Notes-Program
```

---

### Create Virtual Environment

```bash
python -m venv venv
```

Activate:

#### Linux / macOS

```bash
source venv/bin/activate
```

#### Windows

```bash
venv\Scripts\activate
```

---

### Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Run Application

Start the server:

```bash
python app.py
```

Open:

```text
http://localhost:5000
```

---

## Key Highlights

This project demonstrates:

* Real-Time ERP Development
* Gold Ledger Management
* Inventory Management
* Financial Transaction Processing
* Automated Balance Reconciliation
* Stock Tracking
* Socket.IO Communication
* Business Workflow Automation
* Audit-Friendly Transaction History

---

## Future Improvements

* Multi-user roles and permissions
* Advanced accounting integration
* GST invoicing
* Barcode support
* Multi-branch management
* Export to Excel/PDF
* Mobile application support
* Dashboard analytics
* Automated backups

---

## Author

Developed as a complete Jewellery ERP solution for managing gold transactions, inventory, customer balances, cash settlements, and business reporting through a unified real-time web application.
