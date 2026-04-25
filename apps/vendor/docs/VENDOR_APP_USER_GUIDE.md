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
- **Publish your own branded storefront** at `<your-name>.albazdelivery.com` (or your own custom domain) so customers can browse, order, and pay without you sending links by hand. Orders land in your existing dashboard automatically.
- **Use restaurant mode** (for restaurants/cafes) with menu categories, dine-in/takeaway/delivery workflows, table service, and kitchen-friendly order handling.

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

## 7. Your Public Storefront (Subdomain & Custom Domain)

Every vendor on AlBaz gets a free **public ordering page** that works like a mini ordering site (similar to take.app, Linktree-shop, etc.). Customers can browse your catalog, build a cart, and place a guest order — no app install, no login. Orders land directly in your existing dashboard and (if WhatsApp is configured) trigger the same WhatsApp notification you already get.

### 7.1 Pick your subdomain (free, available on every plan)

1. Open **Settings → Domains** (or the **Domains** card inside the Settings tab).  
2. In **Subdomain**, type a short, easy-to-share name — for example `taj-mahal`, `pizza-amine`, or `boutique-yasmine`.  
   - Letters, numbers, and dashes only.  
   - The app blocks reserved names (`admin`, `api`, `vendor`, etc.).  
3. Click **Save**. Your storefront is immediately live at:  

   ```
   https://<your-subdomain>.albazdelivery.com
   ```

4. Use the **Preview** button to open it in a new tab and share the link with customers (WhatsApp Status, Instagram bio, business cards, QR codes…).

### 7.2 Bring your own domain (paid plans)

If you already own a domain like `shop.mybrand.com`, you can point it at your AlBaz storefront so customers see your brand in the URL bar.

> Available on **PROFESSIONAL** and above. **STARTER** is limited to the free `.albazdelivery.com` subdomain.

1. In **Settings → Domains**, type your full domain into the **Custom domain** field (no `https://`, no `/`).  
2. Click **Save**. The app will switch the status to **PENDING** and show two DNS records:

   | Type  | Host                       | Value                                  |
   |-------|----------------------------|----------------------------------------|
   | TXT   | `_albaz-verify.<domain>`   | a unique token (shown in the card)     |
   | CNAME | `<domain>` (or `www`)      | `cname.vercel-dns.com`                 |

3. Log in to your DNS provider (GoDaddy, Cloudflare, Namecheap, IONOS, OVH, etc.) and create both records exactly as shown.  
4. Wait a few minutes for DNS to propagate, then click **Verify** in the Domains card.  
5. When the status flips to **VERIFIED**:
   - Your storefront is reachable on your custom domain.  
   - SSL (HTTPS) is provisioned automatically — no certificate file to upload.  
   - Both your subdomain and your custom domain keep working.

> Need to remove or replace the custom domain? Just clear the field and save. The old domain is detached automatically.

### 7.3 Brand your storefront

In the same Settings area you can set:

- **Logo** — appears in the storefront header.  
- **Hero image / cover** — large image at the top of the homepage.  
- **Tagline** — one-line message shown under your name.  
- **Accent color** — controls the button/link color.  
- **WhatsApp number** — used by customers who tap the contact button on the storefront.

Save and reload your storefront to see the changes.

### 7.4 What customers see

The storefront has the following pages, all under your subdomain or custom domain:

| Page                           | What it shows                                                                 |
|--------------------------------|-------------------------------------------------------------------------------|
| `/`                            | Homepage with hero, tagline, and your products grouped by store.              |
| `/products/<id>`               | Single product page with image, description, price, quantity, add-to-cart.    |
| `/cart`                        | Cart review with quantity adjustments and checkout button.                    |
| `/checkout`                    | Guest checkout form (name, phone, address, payment method).                   |
| `/orders/<id>?token=...`       | Order confirmation page (the link is shown right after checkout).             |

Cart contents are saved in the customer's browser, so they can come back later without losing items.

### 7.5 What happens when an order comes in

When a customer completes checkout on your storefront:

1. AlBaz finds (or creates) a guest customer record using their phone number.  
2. A real `Order` is created in your dashboard — it appears in the **Sales / Orders** tab just like any other order.  
3. If WhatsApp notifications are configured, you receive the **same WhatsApp message** you'd get for an order from the customer app.  
4. Loyalty points are awarded automatically using your active loyalty rule (if any).  
5. The customer sees an order confirmation page with their order number.

You manage and fulfill these orders exactly like POS or delivery orders — there is no separate "storefront orders" inbox.

### 7.6 WhatsApp notifications and vendor numbers

By default, AlBaz can send order alerts through the **platform WhatsApp API**. This is the easiest setup because you do not need to create or connect your own WhatsApp Business API account.

For larger vendors and restaurant brands, AlBaz may offer an upgraded setup where your business connects its **own WhatsApp Business API**:

- Customers see your restaurant/shop identity instead of a shared platform number.
- You can use your own approved templates and customer conversations.
- Your messaging limits and Meta quality score are isolated from other vendors.

Most pilot vendors should start with the default AlBaz WhatsApp channel. Use your own WhatsApp API only if your business needs branded conversations, automation, or high message volume.

### 7.7 Tips & best practices

- **Pick a short, memorable subdomain** — easier for customers to type and remember.  
- **Print a QR code** of your storefront URL and put it on your shop window or receipts.  
- **Add it to your WhatsApp Business profile** as your website link.  
- **Test your own storefront** end-to-end (browse → cart → place a small order) before sharing the link widely.  
- **Keep products available** — out-of-stock or hidden products are not shown on the storefront.

### 7.8 Troubleshooting

| Symptom                                              | Likely cause                                                                 | Fix                                                                                              |
|------------------------------------------------------|------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| "Subdomain is already in use"                        | Another vendor already has it, or it is a reserved word.                     | Try variants like `<name>-shop`, `<name>-dz`, etc.                                               |
| Custom domain stuck on **PENDING** after Verify      | DNS records have not propagated yet, or one of the records is wrong.         | Wait 5–30 minutes and click **Verify** again. Double-check TXT host and CNAME target.            |
| Storefront shows "Vendor not found"                  | The domain is set but verification has not succeeded yet.                    | Run **Verify** again. While **PENDING**, only the verified subdomain works.                      |
| Customers see no products                            | Products are marked unavailable or the store is inactive.                    | In the **Inventory** tab, set products to "Available" and ensure the store is **Active**.       |
| Order notification did not arrive on WhatsApp        | WhatsApp number missing or WhatsApp integration not configured.              | Set **WhatsApp number** in Settings → Domains/Branding, and confirm WhatsApp integration is on.  |

---

## 8. Restaurant Mode (For Restaurants & Cafes)

If your shop type is **Restaurant**, **Cafe**, **Fast Food**, or similar, AlBaz can be used as a restaurant POS and online ordering system.

### 8.1 Restaurant daily workflow

1. Open the **POS** tab.
2. Choose the order type:
   - **Dine-in** — customer eats at a table.
   - **Takeaway** — customer collects from the counter.
   - **Delivery** — order will be delivered.
   - **Storefront / online** — customer placed the order from your public link.
3. Add menu items by category (pizza, sandwiches, drinks, desserts, etc.).
4. Add notes or modifiers where needed (extra cheese, no onions, spicy, size).
5. Send or confirm the order.
6. Print the receipt or kitchen ticket if your printer is configured.

### 8.2 Menu management

Use **Inventory** / **Products** to manage your menu:

- Create menu categories: starters, mains, drinks, desserts, combos.
- Mark unavailable dishes as **not available** so they disappear from the storefront.
- Keep prices updated for POS and online ordering.
- Use clear product names and photos for customer-facing storefront items.

### 8.3 Online restaurant ordering

Your storefront works especially well for restaurants:

- Customers open your link or scan a QR code.
- They browse the menu, add items to cart, and enter delivery/pickup details.
- You receive the order in your dashboard and WhatsApp alert channel.
- You prepare the order using the same workflow as phone or counter orders.

For dine-in restaurants, you can print the storefront QR code and place it on tables so customers can browse the menu before ordering.

### 8.4 Recommended restaurant setup

- Set a short subdomain, for example `pizza-amine.albazdelivery.com`.
- Add a good logo, hero image, and WhatsApp number.
- Keep your menu categories simple and easy to scan.
- Use product photos for best-selling dishes.
- Test one full order before sharing the public link.
- If your brand is serious about WhatsApp communication, ask AlBaz support about connecting your own WhatsApp Business API.

For internal planning and future restaurant features, see `apps/vendor/docs/VENDOR_APP_RESTAURANT_VERSION_ANALYSIS.md`.

---

## 9. RFID Features (If Enabled)

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

## 10. Backup, Restore & Sync

### 10.1 Backup & Restore

- Use the **Sync & Save** tab:
  - **Backup**: create and download a JSON backup file. Store it on external media or cloud.  
  - **Restore**: select a backup JSON to restore all local data to a previous point-in-time.

> Tip: Do at least one backup per day, and always before major updates.

### 10.2 Cloud Sync (if configured)

- When the internet is available and a backend is configured:
  - The app can automatically sync new sales and changes every few minutes.  
  - The **Sync & Save** tab shows whether auto-sync is on and when the last sync happened.

---

## 11. Staff & Permissions

1. Open the **Personnel & Permissions** tab.  
2. In **Staff**:
   - Add staff members with names, roles, and optional PINs.  
   - Use PINs for quick local login on the POS.
3. In **Permissions**:
   - See which roles can perform sensitive actions (refunds, price changes, etc.).  
   - Adjust permissions according to your shop policy (where configurable).

---

## 12. Getting Help

- If you encounter issues:
  - Note what you were doing (e.g., “completing a sale”, “opening inventory”).  
  - Take a photo or screenshot of any error message.  
  - Provide your **app version** (from Settings → System status) and Windows version.  
- Share this with your AlBaz support contact. For internal teams, also attach the latest logs as described in the **Support & Operations Playbook**.

