# Qa3at Backend API (لوحة التحكم والخدمات الخلفية لمشروع قاعات)

تطبيق خدمات خلفية مبني باستخدام **Node.js** و **Express** و **MongoDB (Mongoose)**، ومُهيّأ بالكامل للرفع والتشغيل كـ **Serverless Functions** على منصة **Vercel** باستخدام **pnpm** كمدير حزم أساسي.

---

## ⚙️ متطلبات التشغيل والبيئة (Environment Variables)

يجب إنشاء ملف `.env` في المجلد الرئيسي لبيئة التطوير المحلية، أو إضافة هذه المتغيرات في منصة Vercel عند الرفع:

| المتغير | الوصف | مثال للقيمة |
| :--- | :--- | :--- |
| `MONGODB_URI` | رابط الاتصال بقاعدة بيانات MongoDB Atlas | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | مفتاح تشفير التوكن الخاص بالمصادقة | `your_super_jwt_secret_key` |
| `JWT_EXPIRES_IN` | مدة صلاحية توكن تسجيل الدخول | `30d` |
| `PORT` | المنفذ المحلي لتشغيل السيرفر (افتراضي: 3000) | `3000` |
| `NODE_ENV` | بيئة التشغيل الحالية | `development` أو `production` |

---

## 🚀 التشغيل والتثبيت محلياً (Local Development)

لإعداد وتشغيل المشروع محلياً باستخدام **pnpm**:

1. **تثبيت الاعتماديات**:
   ```bash
   pnpm install
   ```

2. **تهيئة قاعدة البيانات (تغذية البيانات Seed)**:
   لتغذية قاعدة البيانات بقائمة قاعات الأفراح (53 قاعة) والصور (210 صورة):
   ```bash
   pnpm run seed:fresh
   ```

3. **تشغيل السيرفر في وضع المطور**:
   ```bash
   pnpm dev
   ```
   سيعمل السيرفر على الرابط: `http://localhost:3000`  
   وفحص الحالة على: `http://localhost:3000/health`

---

## 🛣️ دليل روابط الـ API (API Routes)

جميع الاستجابات تُرجع البيانات مغلفة داخل كائن قياسي بالصيغة التالية:
```json
{
  "success": true,
  "data": { ... }
}
```

### 1. نظام الحسابات والمصادقة (Authentication)
*المسار الأساسي: `/api/auth`*

* **تسجيل حساب جديد**:
  - **الرابط**: `POST /api/auth/register`
  - **محتوى الطلب (JSON)**:
    ```json
    {
      "email": "user@example.com",
      "password": "securepassword123",
      "name": "Mohamed Ahmed",
      "phone": "+97333333333"
    }
    ```

* **تسجيل الدخول التقليدي**:
  - **الرابط**: `POST /api/auth/login`
  - **محتوى الطلب (JSON)**:
    ```json
    {
      "email": "user@example.com",
      "password": "securepassword123"
    }
    ```

* **تسجيل الدخول عبر Google**:
  - **الرابط**: `POST /api/auth/google-login`
  - **محتوى الطلب (JSON)**:
    ```json
    {
      "email": "googleuser@gmail.com",
      "name": "Google User",
      "phone": "+97333333333"
    }
    ```

* **جلب الملف الشخصي (محمي 🔒)**:
  - **الرابط**: `GET /api/auth/profile`
  - **العناوين (Headers)**: `Authorization: Bearer <TOKEN>`

---

### 2. القاعات (Venues)
*المسار الأساسي: `/api/venues`*

* **جلب كل المدن التي تحتوي على قاعات**:
  - **الرابط**: `GET /api/venues/cities`
  - **الاستجابة**: قائمة ديناميكية بالمدن البحرينية المتوفرة بقاعدة البيانات مع أسمائها بالعربية والإنجليزية.

* **البحث وجلب القاعات (مع الفرز والصفحات)**:
  - **الرابط**: `GET /api/venues`
  - **المعاملات الاختيارية (Query Params)**:
    - `city`: اسم المدينة (مثال: `Manama`)
    - `type`: نوع القاعة (`HOTEL`, `HALL`, `RESORT`)
    - `capacity`: الحد الأدنى للمدعوين (رقم)
    - `search`: بحث نصي في الاسم والوصف
    - `featured`: جلب المميزة فقط (`true`)
    - `page`: رقم الصفحة (الافتراضي: `1`)
    - `limit`: عدد النتائج بالصفحة (الافتراضي: `20`)

* **جلب تفاصيل قاعة محددة**:
  - **الرابط**: `GET /api/venues/:id`

---

### 3. الباقات والإضافات (Packages & Add-ons)
*المسار الأساسي: `/api/packages`*

* **جلب الباقات المتاحة**:
  - **الرابط**: `GET /api/packages`
  - **المعاملات الاختيارية (Query Params)**:
    - `category`: القسم (`DECORATION`, `CATERING`, `PHOTOGRAPHY`, `MUSIC`, `VENUE`)
    - `tier`: الفئة (`SILVER`, `GOLD`, `DIAMOND`)

* **جلب الخدمات الإضافية**:
  - **الرابط**: `GET /api/packages/addons`
  - **المعاملات الاختيارية (Query Params)**:
    - `category`: تصنيف الإضافات

* **جلب الفترات الزمنية المتاحة للحجز (Time Slots)**:
  - **الرابط**: `GET /api/packages/time-slots`

---

### 4. الحجوزات (Bookings 🔒 - جميع المسارات تحتاج توكن)
*المسار الأساسي: `/api/bookings`*

* **إنشاء حجز جديد**:
  - **الرابط**: `POST /api/bookings`
  - **محتوى الطلب (JSON)**:
    ```json
    {
      "venueId": "venue_id_here",
      "slotId": "time_slot_id_here",
      "date": "2026-06-20",
      "guestCount": 150,
      "packageIds": ["pkg_id_1"],
      "addonIds": ["addon_id_1"],
      "notes": "تفاصيل إضافية للحفلة"
    }
    ```

* **جلب حجوزات المستخدم الحالي**:
  - **الرابط**: `GET /api/bookings`

* **جلب تفاصيل حجز معين**:
  - **الرابط**: `GET /api/bookings/:id`

* **إلغاء حجز**:
  - **الرابط**: `PATCH /api/bookings/:id/cancel`

---

### 5. المساعد الذكي (AI Assistant Chat)
*المسار الأساسي: `/api/assistant`*

* **المحادثة مع المساعد**:
  - **الرابط**: `POST /api/assistant/chat`
  - **محتوى الطلب (JSON)**:
    ```json
    {
      "message": "أريد حجز قاعة تتسع لـ 200 شخص في المنامة",
      "language": "ar"
    }
    ```

---

## ☁️ استضافة Vercel Serverless

المشروع مُعد مسبقاً للعمل كـ Serverless على منصة Vercel عبر:
1. **[connectDB.js](file:///home/csi/Desktop/qa3at/new-backend/lib/connectDB.js)**: لإعادة استخدام الاتصال بقاعدة البيانات ومنع انقطاع أو استهلاك الحد الأقصى للاتصالات (Connection Pooling).
2. **[vercel.json](file:///home/csi/Desktop/qa3at/new-backend/vercel.json)**: لتوجيه الطلبات لمحرك Vercel Node.js.
3. تفادي استخدام `app.listen` في بيئة الإنتاج وتصدير الـ `app` بدلاً منها.
