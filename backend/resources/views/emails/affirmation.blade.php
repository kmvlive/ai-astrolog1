<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#0f172a;color:#fff;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#1e293b;border-radius:16px;padding:40px;">
    <h1 style="color:#a78bfa;margin-bottom:10px;">💫 {{ $title }}</h1>
    <p style="color:#94a3b8;font-size:14px;margin-bottom:30px;">{{ $date }}</p>
    <p style="font-size:18px;line-height:1.8;">{{ $description }}</p>
    <hr style="border:none;border-top:1px solid #334155;margin:30px 0;">
    <p style="color:#64748b;font-size:12px;text-align:center;">
      AI Астролог · <a href="{{ url('/affirmations') }}" style="color:#a78bfa;">Все аффирмации</a> · 
      <a href="{{ url('/unsubscribe') }}" style="color:#64748b;">Отписаться</a>
    </p>
  </div>
</body>
</html>
