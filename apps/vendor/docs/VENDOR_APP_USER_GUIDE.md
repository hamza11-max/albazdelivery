## AlBaz Vendor Desktop – User Guide (Pilot Version)

This guide is for **shop owners and staff** using the AlBaz Vendor desktop app (POS + inventory + RFID).

---

## 1. What You Can Do With AlBaz Vendor

- **Sell products quickly** using the POS screen (scanner, search, manual entry).  
- **Manage inventory**: add/edit products, track stock, and see low-stock alerts.  
- **Track sales history and reports**: daily/weekly/monthly totals, top products, and customer spending.  
- **Run loyalty programs** via the Loyalty tab (tiers, rules, and customer points).  
- **Use RFID (if enabled)** for live dashboards, gate activity, and alerts.  
- **Back up your data and sync to the cloud** (for supported environments).

---

## 2. First-Time Setup (Electron Desktop)

1. **Install the app**  
   - Your technician or installer will provide an `.exe` file.  
   - Recommended path: `C:\AlBazVendor` or `E:\AlBazVendor` (avoid paths with spaces).

2. **Device passkey**  
   - On first launch, you will be asked for a **device passkey**.  
   - For pilots, this is provided by AlBaz. Keep it private.  

3. **Create the owner account**  
   - Enter owner name, phone, and email.  
   - Set a strong password (this account controls staff and settings).

4. **Configure shop type and schedule**  
   - In Settings, select your shop type (restaurant / retail / grocery / other).  
   - Optionally configure opening hours and order limits.

---

## 3. Everyday POS Workflow

### 3.1 Creating a Sale

1. Go to the **POS** tab.  
2. Add items to the cart by:
   - Scanning a barcode, or  
   - Searching and clicking on a product, or  
   - Manually entering a quick item (if enabled).  
3. Adjust quantities or discounts if needed.  
4. Choose the **payment method** (cash or card).  
5. Click **Complete sale**.

The sale is stored **locally** immediately. If the internet is available and cloud sync is configured, it will also be sent to the server.

### 3.2 Printing or Emailing a Receipt

- After a sale, a **receipt dialog** appears:  
  - To **print**, use your thermal printer or a standard printer.  
  - To **email the receipt**, enter the customer’s email in the dialog and send.

---

## 4. Inventory Management

1. Open the **Inventory** tab.  
2. Use the **Products** sub-tab to:
   - Add new products.  
   - Edit names, prices, barcodes, and stock levels.  
   - Import product lists from a file (where available).
3. The **Alertes stock** (low stock) area highlights items that are nearly out of stock.

> In offline/Electron mode, products are stored locally and can be backed up from the Sync & Save tab.

---

## 5. Sales History & Reports

### 5.1 Sales History

- Go to the **Historique** / **Sales** tab.  
- You can:
  - See each completed sale (date, total, items, payment method).  
  - Open a **detailed invoice** for printing or export.

### 5.2 Reports

- Go to the **Reports** tab.  
- Choose:
  - **Type of report**: Sales, Products, Customers, or Financial.  
  - **Date range** (today, last 7 days, last 30 days, etc.).  
- You can export data as **CSV or PDF** for accounting or analysis.

---

## 6. Loyalty & Customers

1. Open the **Clients & Loyalty** tab.  
2. Use the **Loyalty** sub-tab to:
   - Define **tiers** (Bronze, Silver, Gold…) with minimum points and discounts.  
   - Create **rules** that define how many points are earned per DZD.  
3. When a sale is recorded with a customer, the app can automatically award points using the active loyalty rule.

---

## 7. RFID Features (If Enabled)

If your installation includes RFID hardware and licenses:

- **RFID Dashboard**  
  - Shows recent tag reads, gate activity, and alerts.  
  - Lets you drill into a specific tag to see item details.

- **RFID Device Management**  
  - Configure readers and serial ports.  
  - Test connections and see which readers are online.

- **RFID Alerts & Live Feed**  
  - Monitor abnormal movements or exceptions (depending on your configuration).

For setup and troubleshooting of RFID devices, coordinate with your installer or support, as this often requires hardware access and serial port configuration.

---

## 8. Backup, Restore & Sync

### 8.1 Backup & Restore

- Use the **Sync & Save** tab:
  - **Backup**: create and download a JSON backup file. Store it on external media or cloud.  
  - **Restore**: select a backup JSON to restore all local data to a previous point-in-time.

> Tip: Do at least one backup per day, and always before major updates.

### 8.2 Cloud Sync (if configured)

- When the internet is available and a backend is configured:
  - The app can automatically sync new sales and changes every few minutes.  
  - The **Sync & Save** tab shows whether auto-sync is on and when the last sync happened.

---

## 9. Staff & Permissions

1. Open the **Personnel & Permissions** tab.  
2. In **Staff**:
   - Add staff members with names, roles, and optional PINs.  
   - Use PINs for quick local login on the POS.
3. In **Permissions**:
   - See which roles can perform sensitive actions (refunds, price changes, etc.).  
   - Adjust permissions according to your shop policy (where configurable).

---

## 10. Getting Help

- If you encounter issues:
  - Note what you were doing (e.g., “completing a sale”, “opening inventory”).  
  - Take a photo or screenshot of any error message.  
  - Provide your **app version** (from Settings → System status) and Windows version.  
- Share this with your AlBaz support contact. For internal teams, also attach the latest logs as described in the **Support & Operations Playbook**.

