from PIL import Image, ImageDraw, ImageFont
import os

# ساخت پوشه‌ها
os.makedirs('icons', exist_ok=True)
os.makedirs('screenshots', exist_ok=True)

BG = (102, 126, 234)  # #667eea

# پیدا کردن یک فونت که از ایموجی پشتیبانی کند
def get_font(size):
    """تلاش برای پیدا کردن فونت مناسب ویندوز"""
    paths = [
        'C:/Windows/Fonts/seguiemj.ttf',  # Segoe UI Emoji
        'C:/Windows/Fonts/segoeui.ttf',
        'C:/Windows/Fonts/tahoma.ttf',
        'C:/Windows/Fonts/arial.ttf',
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except:
                continue
    return ImageFont.load_default()

# ==================== ساخت آیکون ====================
def make_icon(size, filename):
    img = Image.new('RGB', (size, size), BG)
    draw = ImageDraw.Draw(img)

    # دایره سفید نیمه‌شفاف پشت ایموجی
    margin = size // 8
    # رسم مستطیل گرد سفید
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=size // 8,
        fill=(255, 255, 255, 30)
    )

    # رسم ایموجی کتاب
    font = get_font(int(size * 0.55))
    text = "📚"
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        x = (size - tw) // 2 - bbox[0]
        y = (size - th) // 2 - bbox[1]
        draw.text((x, y), text, fill=(255, 255, 255), font=font, embedded_color=True)
    except:
        # اگر ایموجی پشتیبانی نشد، یک مستطیل ساده بکش
        draw.rectangle(
            [size // 3, size // 3, 2 * size // 3, 2 * size // 3],
            fill=(255, 255, 255)
        )

    img.save(filename, 'PNG', optimize=True)
    print(f"✅ ساخته شد: {filename}")

# ==================== ساخت اسکرین‌شات ====================
def make_screenshot(width, height, filename):
    img = Image.new('RGB', (width, height), BG)
    draw = ImageDraw.Draw(img)

    # عنوان بالا
    font_big = get_font(int(height * 0.06))
    font_med = get_font(int(height * 0.035))
    font_small = get_font(int(height * 0.025))

    title = "کتابخانه خانگی"
    try:
        bbox = draw.textbbox((0, 0), title, font=font_big)
        tw = bbox[2] - bbox[0]
        draw.text(((width - tw) // 2, int(height * 0.05)), title,
                  fill=(255, 255, 255), font=font_big)
    except:
        pass

    # چهار کارت آماری
    card_y = int(height * 0.18)
    card_h = int(height * 0.12)
    card_w = (width - int(width * 0.15)) // 4
    gap = int(width * 0.02)
    start_x = int(width * 0.05)

    stats = [("کل", "12"), ("موجود", "8"), ("امانت", "4"), ("تأخیر", "1")]
    for i, (label, val) in enumerate(stats):
        x = start_x + i * (card_w + gap)
        draw.rounded_rectangle([x, card_y, x + card_w, card_y + card_h],
                               radius=15, fill=(255, 255, 255))
        # عدد
        try:
            bbox = draw.textbbox((0, 0), val, font=font_big)
            tw = bbox[2] - bbox[0]
            draw.text((x + (card_w - tw) // 2, card_y + int(card_h * 0.1)),
                      val, fill=BG, font=font_big)
        except:
            pass
        # برچسب
        try:
            bbox = draw.textbbox((0, 0), label, font=font_small)
            tw = bbox[2] - bbox[0]
            draw.text((x + (card_w - tw) // 2, card_y + int(card_h * 0.65)),
                      label, fill=(120, 120, 120), font=font_small)
        except:
            pass

    # کارت لیست کتاب‌ها
    list_y = card_y + card_h + int(height * 0.03)
    list_h = height - list_y - int(height * 0.05)
    draw.rounded_rectangle([int(width * 0.05), list_y,
                            width - int(width * 0.05), list_y + list_h],
                           radius=20, fill=(255, 255, 255))

    # آیتم‌های کتاب
    item_h = int(list_h * 0.22)
    item_y = list_y + int(list_h * 0.12)
    books = [("بوف کور", "صادق هدایت"), ("صد سال تنهایی", "مارکز")]
    for i, (title_b, author_b) in enumerate(books):
        y = item_y + i * (item_h + int(list_h * 0.05))
        draw.rounded_rectangle(
            [int(width * 0.08), y, width - int(width * 0.08), y + item_h],
            radius=12, fill=(250, 251, 255),
            outline=(224, 224, 224), width=2
        )
        try:
            draw.text((int(width * 0.12), y + int(item_h * 0.15)),
                      title_b, fill=(51, 51, 51), font=font_med)
            draw.text((int(width * 0.12), y + int(item_h * 0.55)),
                      author_b, fill=(120, 120, 120), font=font_small)
        except:
            pass

    img.save(filename, 'PNG', optimize=True)
    print(f"✅ ساخته شد: {filename}")

# ==================== اجرا ====================
print("🎨 در حال ساخت آیکون‌ها...")
make_icon(192, 'icons/icon-192.png')
make_icon(512, 'icons/icon-512.png')

print("\n🎨 در حال ساخت اسکرین‌شات‌ها...")
make_screenshot(1280, 720, 'screenshots/screen-wide.png')
make_screenshot(720, 1280, 'screenshots/screen-narrow.png')

print("\n🎉 تمام! همه فایل‌ها ساخته شدند.")